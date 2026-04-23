import io
import uuid
import pdfplumber
import logging

from azure.storage.blob import BlobServiceClient
from azure.search.documents import SearchClient
from azure.core.credentials import AzureKeyCredential
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import AzureOpenAIEmbeddings, AzureChatOpenAI
from langchain.schema import SystemMessage, HumanMessage, AIMessage
from azure.search.documents.models import VectorizedQuery

from app.core.config import settings

logger = logging.getLogger(__name__)

class RAGService:
    def __init__(self):
        # Conexión a Blob Storage para descargar el archivo
        self.blob_service_client = BlobServiceClient.from_connection_string(settings.AZURE_STORAGE_CONNECTION_STRING)
        self.container_client = self.blob_service_client.get_container_client(settings.AZURE_STORAGE_CONTAINER_NAME)
        
        # Conexión a Azure AI Search para subir los chunks indexados
        self.search_credential = AzureKeyCredential(settings.AZURE_SEARCH_ADMIN_KEY)
        self.search_client = SearchClient(
            endpoint=settings.AZURE_SEARCH_ENDPOINT,
            index_name=settings.AZURE_SEARCH_INDEX_NAME,
            credential=self.search_credential
        )
        
        # Configuración de Embeddings usando Azure OpenAI
        self.embeddings = AzureOpenAIEmbeddings(
            api_key=settings.AZURE_OPENAI_API_KEY,
            azure_endpoint=settings.AZURE_OPENAI_ENDPOINT,
            azure_deployment=settings.AZURE_OPENAI_EMBEDDINGS_DEPLOYMENT,
            openai_api_version=settings.OPENAI_API_VERSION
        )
        
        # Configuración del LLM de Chat usando Azure OpenAI
        self.chat_model = AzureChatOpenAI(
            api_key=settings.AZURE_OPENAI_API_KEY,
            azure_endpoint=settings.AZURE_OPENAI_ENDPOINT,
            azure_deployment=settings.AZURE_OPENAI_CHAT_DEPLOYMENT,
            openai_api_version=settings.OPENAI_API_VERSION,
            temperature=0.0
        )

    def ingest_document(self, assistant_id: uuid.UUID, blob_name: str):
        """
        Descarga el PDF, extrae su texto, lo divide en chunks y lo sube al índice de vectores.
        """
        print(f"[{assistant_id}] Iniciando ingesta del documento {blob_name}...")
        
        try:
            # 1. Descargar el archivo PDF desde el Blob Storage en memoria
            blob_client = self.container_client.get_blob_client(blob_name)
            pdf_stream = io.BytesIO(blob_client.download_blob().readall())
            
            # 2. Extraer texto usando pdfplumber
            extracted_text = ""
            with pdfplumber.open(pdf_stream) as pdf:
                for page in pdf.pages:
                    text = page.extract_text()
                    if text:
                        extracted_text += text + "\n"
                        
            if not extracted_text.strip():
                print(f"[{assistant_id}] ADVERTENCIA: No se encontró texto en el PDF.")
                return

            # 3. Dividir texto en chunks manejables (fragmentos de contexto)
            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=1000,
                chunk_overlap=200
            )
            chunks = text_splitter.split_text(extracted_text)
            
            # 4. Generar embeddings y estructurar los documentos
            documents = []
            for chunk in chunks:
                documents.append({
                    "id": str(uuid.uuid4()), # Azure search requiere un string como key
                    "assistant_id": str(assistant_id), # Aislamiento total de datos por asistente
                    "filename": blob_name,
                    "content": f"[Fuente: {blob_name}]\n{chunk}" # Inyectamos la fuente para que el LLM pueda citarla
                })
                
            # Generar vectores de todos los fragmentos en una sola llamada (batch) a OpenAI
            chunk_texts = [doc["content"] for doc in documents]
            logger.debug(f"[{assistant_id}] Generando embeddings para {len(chunk_texts)} fragmentos...")
            vectors = self.embeddings.embed_documents(chunk_texts)
            
            # Asignar los vectores calculados a cada documento
            for doc, vector in zip(documents, vectors):
                doc["content_vector"] = vector

            # 5. Subir documentos indexados y vectorizados a Azure AI Search
            # upload_documents puede manejar las peticiones de subida (batch insert/merge)
            self.search_client.upload_documents(documents)
            logger.info(f"[{assistant_id}] ¡Ingesta exitosa! {len(documents)} fragmentos subidos a Azure AI Search.")
            
        except Exception as e:
            logger.error(f"[{assistant_id}] ERROR durante la ingesta: {str(e)}")
            # Dependiendo de tu estrategia de logs, aquí podrías loguear en Sentry, etc.

    def delete_document_from_index(self, blob_name: str):
        search_query = f"\"{blob_name}\""
        try:
            results = self.search_client.search(
                search_text=search_query,
                select=["id", "content"],
                top=1000
            )
            
            docs_to_delete = []
            for r in results:
                if f"[Fuente: {blob_name}]" in r["content"]:
                    docs_to_delete.append({"id": r["id"]})
                    
            if docs_to_delete:
                self.search_client.delete_documents(documents=docs_to_delete)
                logger.info(f"Borrados {len(docs_to_delete)} fragmentos para {blob_name}")
        except Exception as e:
            logger.error(f"Error borrando documento del índice: {e}")

    def delete_all_documents(self):
        try:
            results = self.search_client.search(
                search_text="*",
                select=["id"],
                top=100000
            )
            docs_to_delete = [{"id": r["id"]} for r in results]
            if docs_to_delete:
                for i in range(0, len(docs_to_delete), 1000):
                    self.search_client.delete_documents(documents=docs_to_delete[i:i+1000])
                logger.info(f"Borrados todos los {len(docs_to_delete)} documentos del índice de Azure AI Search.")
        except Exception as e:
            logger.error(f"Error vaciando el índice de Azure AI Search: {e}")

    def delete_all_documents_except(self, preserved_assistant_id: str):
        """
        Borra del índice de Azure AI Search todos los documentos cuyo
        assistant_id sea DISTINTO al del asistente técnico preservado.
        Usa filtro OData para la consulta y borra en lotes de 1000.
        """
        try:
            filter_expr = f"assistant_id ne '{preserved_assistant_id}'"
            results = self.search_client.search(
                search_text="*",
                select=["id", "assistant_id"],
                filter=filter_expr,
                top=100000
            )
            docs_to_delete = [{"id": r["id"]} for r in results]
            if docs_to_delete:
                for i in range(0, len(docs_to_delete), 1000):
                    self.search_client.delete_documents(documents=docs_to_delete[i:i+1000])
                logger.info(f"AI Search: {len(docs_to_delete)} documentos eliminados (asistente {preserved_assistant_id} preservado).")
            else:
                logger.info(f"AI Search: No había documentos que eliminar (excluido {preserved_assistant_id}).")
        except Exception as e:
            logger.error(f"Error limpiando AI Search con filtro: {e}")

    def retrieve_context(self, assistant_id: str, query: str, active_documents: list[str] = None) -> list[str]:
        """
        Búsqueda Híbrida (Hybrid Search): combina BM25 keyword search (search_text)
        con búsqueda vectorial (vector_queries) para máxima precisión.
        Esto mejora resultados cuando el usuario usa términos específicos (códigos, nombres).
        """
        query_vector = self.embeddings.embed_query(query)
        vector_query = VectorizedQuery(vector=query_vector, k_nearest_neighbors=50, fields="content_vector")
        
        filter_expr = f"assistant_id eq '{assistant_id}'"
        
        # Fallback de Seguridad: Si active_documents está vacío, no filtramos por nombre (buscamos en todos)
        if active_documents:
            doc_filters = " or ".join([f"filename eq '{doc}'" for doc in active_documents])
            filter_expr += f" and ({doc_filters})"
            logger.debug(f"Filtrando con OData: {filter_expr}")
        else:
            logger.debug(f"active_documents vacío. Bypass activado. Filtro actual: {filter_expr}")
        
        # Hybrid Search: search_text (keyword BM25) + vector_queries (semántica) combinados
        results_iterator = self.search_client.search(
            search_text=query,            # Keyword search (BM25)
            vector_queries=[vector_query], # Vector search (semántico)
            filter=filter_expr,
            select=["content", "filename"],
            top=50,
            search_mode="all"
        )
        
        results_list = list(results_iterator)
        logger.debug(f"Buscando en {len(results_list)} fragmentos para el asistente {assistant_id}.")
        
        # Debug de Scoring para verificar si el manual está siendo penalizado por Azure
        for i, doc in enumerate(results_list[:5]): # Imprimimos solo los primeros 5 para no saturar
            logger.debug(f'Rank {i+1} | Score: {doc.get("@search.score")} | Archivo: {doc.get("filename")}')
            
        logger.debug(f'Archivos recuperados en el top 50: {set([doc.get("filename") for doc in results_list])}')
        
        if len(results_list) > 0:
            logger.debug(f'Primer fragmento - Texto: {results_list[0].get("content", "")[:50]}... | Archivo: {results_list[0].get("filename")}')
        
        return [doc["content"] for doc in results_list]

    def get_chat_messages(self, system_prompt: str, user_message: str, chat_history: list, context_chunks: list[str]) -> list:
        context_text = "\n\n---\n\n".join(context_chunks)
        
        base_instruction = """Eres un consultor analítico de IA experto en razonamiento. Tu misión no es solo ser un lector de documentos, sino un asesor inteligente.
Sigue estrictamente estas directrices:
1. Deducción Activa: Si el usuario hace una pregunta cuya respuesta directa no está en los manuales, pero hay información relacionada que permite deducirla, DEBES realizar esa inferencia.
2. Transparencia: Al razonar, usa frases como: "Basándome en lo que el manual indica sobre [Concepto]..." o "Aunque no se menciona explícitamente, el manual explica que [Dato], lo que sugiere que...".
3. Anclaje de Citas: Incluso en las deducciones, debes citar numéricamente el fragmento [1], [2] que ha servido de base para tu lógica.
4. Límite de Seguridad: Si la búsqueda devuelve vacío o no hay NADA relacionado, no te rindas tan rápido. Verifica si es un problema de que la información está en otro documento o si el usuario debe marcar otros archivos. Ofrece ayuda general o alternativas si es posible, informando de que no hallas la cita exacta.
5. Comparativa Multi-documento: Cuando el usuario te pida comparar documentos o existan múltiples fuentes, identifica las similitudes y contradicciones entre ellas. Si el usuario pide una comparación entre dos documentos y solo recibes fragmentos de uno, informa explícitamente de qué documento te falta información para que el usuario pueda subir el top_k o revisar el archivo.
6. Atención Especial a Textos Contradictorios: Tienes dos manuales con visiones opuestas. Busca SIEMPRE datos del manual de Nutrición Extrema aunque parezcan contradictorios con el manual de Conceptos Básicos. Presta la máxima atención a cualquier fragmento etiquetado con dicho manual.
7. Manejo de Errores Gracioso: Si no recibes contexto alguno (porque el usuario no ha subido PDFs o la búsqueda devuelve vacío total), responde con humor: "Aún no tengo conocimientos cargados en mi base de datos. ¡Dame de comer algún PDF para que pueda ayudarte!". No inventes respuestas técnicas si ocurre esto."""
        
        final_system_prompt = f"""{base_instruction}
        
INSTRUCCIONES ESPECÍFICAS DEL ASISTENTE:
{system_prompt}

Contexto recuperado de la base de conocimientos:
{context_text}

Instrucción final: Responde basándote solo en el razonamiento sobre este contexto. Añade siempre la citación numérica [1], [2] al final de cada afirmación y lista las fuentes usadas al final de tu respuesta.
"""
        messages = [SystemMessage(content=final_system_prompt)]
        
        for msg in chat_history:
            if msg.role == "user":
                messages.append(HumanMessage(content=msg.content))
            elif msg.role == "assistant":
                messages.append(AIMessage(content=msg.content))
                
        messages.append(HumanMessage(content=user_message))
        return messages

    def generate_chat_response(self, system_prompt: str, user_message: str, chat_history: list, context_chunks: list[str]) -> str:
        messages = self.get_chat_messages(system_prompt, user_message, chat_history, context_chunks)
        response = self.chat_model.invoke(messages)
        return response.content


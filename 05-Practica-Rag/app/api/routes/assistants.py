from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, BackgroundTasks
from fastapi.responses import StreamingResponse
import json
from sqlalchemy.ext.asyncio import AsyncSession
from app.data_access.database import get_db, AsyncSessionLocal
from typing import List
import uuid

from app.api.schemas import AssistantCreate, AssistantRead, ChatRequest, ChatResponse, PromptGenerateRequest
from app.services.assistant_service import AssistantService
from app.services.storage_service import StorageService

router = APIRouter(prefix="/assistants", tags=["assistants"])

@router.post("/generate-prompt")
async def generate_prompt(request: PromptGenerateRequest):
    try:
        from app.services.rag_service import RAGService
        from langchain_core.messages import SystemMessage, HumanMessage
        
        rag_service = RAGService()
        
        sys_msg = SystemMessage(content="""Eres un experto Prompt Engineer. Tu tarea es redactar un SYSTEM_PROMPT profesional para un asistente RAG. El prompt debe definir el rol, el tono y, OBLIGATORIAMENTE, incluir una regla estricta: si la información no está en los documentos subidos, el asistente debe decir que no lo sabe y no inventar nada. Devuelve ÚNICAMENTE el texto del prompt, sin comentarios adicionales ni comillas externas.""")
        human_msg = HumanMessage(content=f"Genera el system prompt para: {request.description}")
        
        response = rag_service.chat_model.invoke([sys_msg, human_msg])
        return {"prompt": response.content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("", response_model=AssistantRead, status_code=status.HTTP_201_CREATED)
async def create_assistant(
    assistant_in: AssistantCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Crea un nuevo Asistente RAG.
    
    - **name**: Nombre descriptivo del asistente.
    - **system_prompt**: Las instrucciones de comportamiento y personalidad.
    
    Devuelve el objeto asistente con su ID único generado (UUID).
    """
    service = AssistantService(db)
    return await service.create_assistant(assistant_in)

@router.get("", response_model=List[AssistantRead])
async def list_assistants(
    db: AsyncSession = Depends(get_db)
):
    """
    Recupera la lista de todos los asistentes RAG disponibles.
    
    Ideal para mostrar en la barra lateral (Sidebar) del frontend.
    """
    service = AssistantService(db)
    return await service.get_assistants()

@router.get("/{assistant_id}", response_model=AssistantRead)
async def get_assistant(
    assistant_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    Obtiene los detalles de un asistente específico por su ID.
    """
    service = AssistantService(db)
    assistant = await service.get_assistant(assistant_id)
    if not assistant:
        raise HTTPException(status_code=404, detail="Assistant not found")
    return assistant

@router.put("/{assistant_id}", response_model=AssistantRead)
async def update_assistant(
    assistant_id: uuid.UUID,
    assistant_in: AssistantCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Actualiza la configuración (nombre y prompt) de un asistente existente.
    """
    service = AssistantService(db)
    assistant = await service.get_assistant(assistant_id)
    if not assistant:
        raise HTTPException(status_code=404, detail="Assistant not found")
    
    assistant.name = assistant_in.name
    assistant.system_prompt = assistant_in.system_prompt
    await db.commit()
    await db.refresh(assistant)
    return assistant

@router.delete("/{assistant_id}")
async def delete_assistant(
    assistant_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    Elimina un asistente de la base de datos.
    """
    service = AssistantService(db)
    assistant = await service.get_assistant(assistant_id)
    if not assistant:
        raise HTTPException(status_code=404, detail="Assistant not found")
    
    await db.delete(assistant)
    await db.commit()
    return {"message": "Assistant deleted"}

@router.post("/{assistant_id}/documents")
async def upload_document(
    assistant_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    """
    Sube un documento PDF/TXT a un asistente específico.
    
    - Guarda el archivo en Azure Blob Storage.
    - Extrae el texto, genera embeddings y lo indexa en Azure AI Search.
    - Asocia el documento al `assistant_id` para aislamiento de datos total.
    """
    # Verificamos primero que el asistente existe
    service = AssistantService(db)
    assistant = await service.get_assistant(assistant_id)
    if not assistant:
        raise HTTPException(status_code=404, detail="Assistant not found")
        
    # Subimos el archivo a Azure
    storage_service = StorageService()
    try:
        blob_name = await storage_service.upload_document(assistant_id, file)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error uploading to Blob Storage: {str(e)}")
    
    # IMPORTANTE: Disparamos la ingesta RAG en background
    from app.services.rag_service import RAGService
    rag_service = RAGService()
    background_tasks.add_task(rag_service.ingest_document, assistant_id, blob_name)
    
    # Increment document count
    await service.increment_document_count(assistant_id)
    
    return {
        "message": "Document uploaded and RAG ingestion started in background",
        "filename": file.filename,
        "blob_name": blob_name
    }

@router.get("/{assistant_id}/documents")
async def list_documents(assistant_id: uuid.UUID):
    """
    Lista todos los documentos asociados a un asistente.
    """
    storage_service = StorageService()
    blobs = await storage_service.list_documents(assistant_id)
    return {"documents": blobs}

@router.delete("/{assistant_id}/documents/{blob_name:path}")
async def delete_document(
    assistant_id: uuid.UUID,
    blob_name: str,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """
    Elimina un documento de Azure Storage y de su índice RAG.
    """
    storage_service = StorageService()
    await storage_service.delete_document(blob_name)
    
    from app.services.rag_service import RAGService
    rag_service = RAGService()
    background_tasks.add_task(rag_service.delete_document_from_index, blob_name)
    
    service = AssistantService(db)
    await service.decrement_document_count(assistant_id)
    
    return {"message": "Document deleted"}

@router.post("/{assistant_id}/chat")
async def chat(
    assistant_id: uuid.UUID,
    request: ChatRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Endpoint principal para interactuar con el Asistente (RAG).
    
    - **message**: El mensaje del usuario.
    - **thread_id**: (Opcional) ID de la conversación para recuperar historial.
    - **active_documents**: Lista de blobs (archivos) a los que el RAG tiene permiso de acceso.
    
    Devuelve un Server-Sent Event (SSE) Stream con la respuesta generada letra a letra.
    """
    service = AssistantService(db)
    assistant = await service.get_assistant(assistant_id)
    if not assistant:
        raise HTTPException(status_code=404, detail="Assistant not found")
        
    thread_id = request.thread_id or str(uuid.uuid4())
    
    # Guardar mensaje del usuario
    await service.save_message(assistant_id, "user", request.message, thread_id)
    
    # Recuperar historial
    chat_history = await service.get_thread_messages(thread_id, limit=10)
    
    # Recuperar contexto RAG con búsqueda híbrida
    from app.services.rag_service import RAGService
    rag_service = RAGService()
    try:
        context_chunks = rag_service.retrieve_context(str(assistant_id), request.message, request.active_documents)
    except Exception as e:
        print(f"Error searching documents: {e}")
        context_chunks = []
    
    # Extraer fuentes únicas
    import re
    sources = set()
    for chunk in context_chunks:
        match = re.search(r"\[Fuente: (.*?)\]", chunk)
        if match:
            sources.add(match.group(1))

    # Preparar mensajes para el LLM
    messages = rag_service.get_chat_messages(
        assistant.system_prompt, request.message, chat_history[:-1], context_chunks
    )

    async def generate():
        # Primer evento: metadatos (fuentes, thread_id)
        yield f"data: {json.dumps({'type': 'meta', 'sources': list(sources), 'thread_id': thread_id})}\n\n"
        
        full_answer = ""
        
        try:
            async for chunk in rag_service.chat_model.astream(messages):
                if chunk.content:
                    full_answer += chunk.content
                    yield f"data: {json.dumps({'type': 'token', 'token': chunk.content})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'error': str(e)})}\n\n"
            
        yield "data: [DONE]\n\n"
        
        # Guardar respuesta en DB con sesión independiente
        async with AsyncSessionLocal() as bg_session:
            bg_service = AssistantService(bg_session)
            await bg_service.save_message(assistant_id, "assistant", full_answer, thread_id)

    return StreamingResponse(generate(), media_type="text/event-stream")

@router.get("/{assistant_id}/threads/{thread_id}/messages")
async def get_thread_messages(
    assistant_id: uuid.UUID,
    thread_id: str,
    db: AsyncSession = Depends(get_db)
):
    service = AssistantService(db)
    from sqlalchemy import select
    from app.data_access.models import ChatMessage
    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.assistant_id == assistant_id)
        .where(ChatMessage.thread_id == thread_id)
        .order_by(ChatMessage.created_at.asc())
    )
    messages = result.scalars().all()
    return [{"role": m.role, "content": m.content, "sources": []} for m in messages]


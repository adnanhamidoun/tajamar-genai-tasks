# 🧠 El Cerebro: Arquitectura y Nube

[Volver al Inicio](./README.md)

## 🔄 Flujo General (Frontend -> FastAPI -> LangChain -> Azure)
La aplicación utiliza un flujo asíncrono y en tiempo real (Streaming):
1. **Frontend (React):** Envía peticiones HTTP al Backend y establece una conexión asíncrona a través de una API Fetch para consumir el `ReadableStream`.
2. **Backend (FastAPI):** Recibe la petición, verifica credenciales e IDs. Orquesta la recuperación de datos mediante servicios inyectados.
3. **LangChain:** Actúa como el puente lógico. Genera la búsqueda, formatea el contexto recuperado y envuelve todo en una cadena de mensajes (`SystemMessage`, `HumanMessage`).
4. **Azure:** Procesa la llamada a través de `Azure OpenAI` y busca a la velocidad del rayo en `Azure AI Search`.

## ☁️ Infraestructura Cloud
- **Azure OpenAI (GPT-4o / GPT-4o-mini):** Seleccionado por su capacidad de razonamiento rápido y cumplimiento de normativas empresariales (compliance).
- **Azure AI Search (Hybrid Search):** No usamos búsquedas vectoriales simples. Combinamos *Keyword Search* (BM25) con *Vector Search*. ¿Por qué? Porque un vector puede no entender un código de pieza como "XYZ-90", pero la búsqueda híbrida sí.
- **Azure SQL:** Almacena la telemetría, el CRUD de asistentes y los registros de chat persistentes de los hilos de conversación.
- **Azure Blob Storage:** Repositorio físico inmutable donde residen los PDFs originales antes de ser "chopeados" (chunking).

## 🛡️ Seguridad: El Sándwich de Prompts
Para prevenir alucinaciones de la IA, usamos una técnica estructural de "Sándwich de Prompts" al pasar la instrucción a OpenAI:

1. **Capa Global (Base Instruction):** Es inviolable. Define al modelo como un consultor analítico con directrices estrictas: deductivo pero anclado a la verdad empírica.
2. **Capa de Personalidad (User Prompt):** Lo que el usuario o el "Auto-Prompt Generator" definió (Ej. "Eres un mecánico de barcos...").
3. **Capa de Contexto:** Los *Chunks* recuperados por RAG, formateados y separados con metadatos y orígenes (citas numéricas). 

Esta estructura fuerza a la IA a leer *de abajo arriba*, garantizando que la restricción global pesa más que cualquier intento de desvío.

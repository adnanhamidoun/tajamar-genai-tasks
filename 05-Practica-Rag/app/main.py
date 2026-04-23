from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uuid as uuid_module
from sqlalchemy import select, delete
from app.core.config import settings
from app.api.routes import health, assistants
from app.data_access.database import AsyncSessionLocal, engine
from app.data_access.models import Base, Assistant, ChatMessage
from app.services.storage_service import StorageService
from app.services.rag_service import RAGService



# ─── ID FIJO DEL ASISTENTE TÉCNICO ───────────────────────────────────────────
# Este UUID es inmutable. Nunca se borrará en ninguna rutina de limpieza.
TECH_ASSISTANT_ID = uuid_module.UUID("00000000-0000-0000-0000-000000000001")
TECH_ASSISTANT_ID_STR = str(TECH_ASSISTANT_ID)

TECH_ASSISTANT_PROMPT = """Eres el experto oficial en la arquitectura de Aisla-RAG Pro.
Este sistema fue construido usando FastAPI para el backend, React y Tailwind CSS v4 para el frontend, y Azure AI Search con Azure OpenAI (gpt-4o) para el RAG.
Características clave implementadas:
- Búsqueda Híbrida nativa con Azure AI Search (search_mode="all", vector_queries, BM25).
- Avalancha de contexto (Top_K 50) para aniquilar el Ranking Bias.
- Post-filtrado y filtros OData dinámicos para Aislamiento Total de Asistentes.
- Fallback de seguridad en el backend en caso de desincronización de React.
- Dark Mode global inyectado vía CSS utility overrides.
Responde a dudas sobre cómo funciona la aplicación internamente de forma técnica y precisa."""

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Iniciando rutina de autolimpieza selectiva del sistema...")
    print(f"  → Asistente técnico protegido: {TECH_ASSISTANT_ID_STR}")

    # 1. Limpiar Azure Blob Storage (preservando archivos del asistente técnico)
    try:
        storage_service = StorageService()
        await storage_service.delete_all_blobs_except(TECH_ASSISTANT_ID_STR)
        print("Azure Blob Storage limpiado (asistente técnico preservado).")
    except Exception as e:
        print(f"Error limpiando Blob Storage: {e}")

    # 2. Limpiar Azure AI Search (preservando docs del asistente técnico)
    try:
        rag_service = RAGService()
        rag_service.delete_all_documents_except(TECH_ASSISTANT_ID_STR)
        print("Azure AI Search limpiado (asistente técnico preservado).")
    except Exception as e:
        print(f"Error limpiando AI Search: {e}")

    # 3. Asegurar que las tablas existen (sin DROP — preserva datos del técnico)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # 4. Borrado selectivo en SQL: eliminar mensajes y asistentes EXCEPTO el técnico
    async with AsyncSessionLocal() as db:
        try:
            # 4a. Borrar mensajes de todos los asistentes excepto el técnico
            await db.execute(
                delete(ChatMessage).where(ChatMessage.assistant_id != TECH_ASSISTANT_ID)
            )
            # 4b. Borrar asistentes excepto el técnico
            await db.execute(
                delete(Assistant).where(Assistant.id != TECH_ASSISTANT_ID)
            )
            await db.commit()
            print("Base de datos limpiada (asistente técnico preservado).")
        except Exception as e:
            await db.rollback()
            print(f"Error en limpieza selectiva de la BD: {e}")

    # 5. Garantizar existencia del asistente técnico (upsert por ID fijo)
    async with AsyncSessionLocal() as db:
        try:
            result = await db.execute(
                select(Assistant).where(Assistant.id == TECH_ASSISTANT_ID)
            )
            tech_assistant = result.scalars().first()

            if not tech_assistant:
                new_assistant = Assistant(
                    id=TECH_ASSISTANT_ID,
                    name="Aisla-RAG Soporte Técnico",
                    system_prompt=TECH_ASSISTANT_PROMPT
                )
                db.add(new_assistant)
                await db.commit()
                print("Asistente técnico creado con ID fijo.")
            else:
                # Actualizar prompt por si ha cambiado en el código
                tech_assistant.system_prompt = TECH_ASSISTANT_PROMPT
                tech_assistant.name = "Aisla-RAG Soporte Técnico"
                await db.commit()
                print("Asistente técnico ya existía — prompt actualizado.")
        except Exception as e:
            await db.rollback()
            print(f"Error garantizando asistente técnico: {e}")

    yield

def create_app() -> FastAPI:
    """
    Application Factory: Crea y configura la instancia de FastAPI.
    """
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description="FastAPI application con inyección de dependencias y capas.",
        lifespan=lifespan
    )

    # Configuración de CORS dinámica
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "https://*.azurewebsites.net", "*"], # Permitir Azure y localhost
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Inclusión de routers
    app.include_router(health.router, prefix="/api/v1")
    app.include_router(assistants.router, prefix="/api/v1")

    # Manejo de Errores Globales (OpenAI / Rate Limits)
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        err_msg = str(exc).lower()
        if "rate_limit" in err_msg or "429" in err_msg:
            return JSONResponse(
                status_code=429,
                content={"detail": "Límite de cuota excedido en Azure OpenAI. Por favor, espera un momento y vuelve a intentarlo."}
            )
        if "openai" in err_msg:
            return JSONResponse(
                status_code=503,
                content={"detail": "El servicio de Azure AI está temporalmente no disponible."}
            )
        
        # Fallback normal
        from fastapi.responses import PlainTextResponse
        # No sobreescribir errores HTTP de FastAPI
        from fastapi import HTTPException
        if isinstance(exc, HTTPException):
            return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})
            
        return JSONResponse(
            status_code=500,
            content={"detail": "Error interno del servidor", "error": str(exc)}
        )

    return app

# La instancia principal que corre uvicorn
app = create_app()

@app.get("/")
def root():
    return {"message": f"Welcome to {settings.APP_NAME}"}


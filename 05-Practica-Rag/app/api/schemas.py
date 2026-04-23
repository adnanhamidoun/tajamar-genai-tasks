from pydantic import BaseModel, ConfigDict
from datetime import datetime
import uuid

class AssistantCreate(BaseModel):
    name: str
    system_prompt: str

class AssistantRead(BaseModel):
    id: uuid.UUID
    name: str
    system_prompt: str
    document_count: int
    created_at: datetime
    
    # Esto permite leer atributos de modelos ORM como SQLAlchemy
    model_config = ConfigDict(from_attributes=True)

class ChatRequest(BaseModel):
    message: str
    thread_id: str | None = None
    active_documents: list[str] | None = None

class ChatResponse(BaseModel):
    answer: str
    thread_id: str
    sources: list[str]

class PromptGenerateRequest(BaseModel):
    description: str

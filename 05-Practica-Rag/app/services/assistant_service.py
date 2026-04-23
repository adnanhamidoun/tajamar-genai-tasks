from typing import List, Optional
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.data_access.models import Assistant, ChatMessage
from app.api.schemas import AssistantCreate

class AssistantService:
    def __init__(self, db: AsyncSession):
        self.db = db
        
    async def create_assistant(self, data: AssistantCreate) -> Assistant:
        new_assistant = Assistant(
            name=data.name,
            system_prompt=data.system_prompt
        )
        self.db.add(new_assistant)
        await self.db.commit()
        await self.db.refresh(new_assistant)
        return new_assistant
        
    async def get_assistants(self) -> List[Assistant]:
        result = await self.db.execute(select(Assistant))
        return list(result.scalars().all())
        
    async def get_assistant(self, assistant_id: uuid.UUID) -> Optional[Assistant]:
        result = await self.db.execute(select(Assistant).where(Assistant.id == assistant_id))
        return result.scalars().first()

    async def increment_document_count(self, assistant_id: uuid.UUID):
        assistant = await self.get_assistant(assistant_id)
        if assistant:
            assistant.document_count += 1
            await self.db.commit()
            await self.db.refresh(assistant)
        return assistant

    async def decrement_document_count(self, assistant_id: uuid.UUID):
        assistant = await self.get_assistant(assistant_id)
        if assistant and assistant.document_count > 0:
            assistant.document_count -= 1
            await self.db.commit()
            await self.db.refresh(assistant)
        return assistant

    async def save_message(self, assistant_id: uuid.UUID, role: str, content: str, thread_id: str) -> ChatMessage:
        msg = ChatMessage(
            assistant_id=assistant_id,
            role=role,
            content=content,
            thread_id=thread_id
        )
        self.db.add(msg)
        await self.db.commit()
        await self.db.refresh(msg)
        return msg

    async def get_thread_messages(self, thread_id: str, limit: int = 10) -> List[ChatMessage]:
        result = await self.db.execute(
            select(ChatMessage)
            .where(ChatMessage.thread_id == thread_id)
            .order_by(ChatMessage.created_at.asc())
            .limit(limit)
        )
        return list(result.scalars().all())

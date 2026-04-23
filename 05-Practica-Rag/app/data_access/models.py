from datetime import datetime
from typing import List, Optional
import uuid

from sqlalchemy import String, Text, DateTime, ForeignKey
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

class Base(DeclarativeBase):
    pass

class Assistant(Base):
    __tablename__ = "assistants"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    system_prompt: Mapped[str] = mapped_column(Text, nullable=False)
    document_count: Mapped[int] = mapped_column(default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    # Relación uno a muchos con ChatMessage
    messages: Mapped[List["ChatMessage"]] = relationship(
        "ChatMessage", back_populates="assistant", cascade="all, delete-orphan"
    )

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    assistant_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("assistants.id"), nullable=False)
    thread_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)
    role: Mapped[str] = mapped_column(String(50), nullable=False) # e.g., 'user', 'assistant', 'system'
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    # Relación con Assistant
    assistant: Mapped["Assistant"] = relationship("Assistant", back_populates="messages")

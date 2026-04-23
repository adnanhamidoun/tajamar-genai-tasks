"""Add thread_id to ChatMessage

Revision ID: e4fba48554f4
Revises: 4415bd82525c
Create Date: 2026-04-20 23:01:34.330652

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e4fba48554f4'
down_revision: Union[str, Sequence[str], None] = '4415bd82525c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('chat_messages', sa.Column('thread_id', sa.String(length=255), nullable=True))
    op.create_index(op.f('ix_chat_messages_thread_id'), 'chat_messages', ['thread_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_chat_messages_thread_id'), table_name='chat_messages')
    op.drop_column('chat_messages', 'thread_id')

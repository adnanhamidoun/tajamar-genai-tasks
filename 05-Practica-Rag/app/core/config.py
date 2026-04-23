from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
from typing import Optional

class Settings(BaseSettings):
    # App Settings
    APP_NAME: str = "Practica-Rag API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Azure OpenAI
    AZURE_OPENAI_API_KEY: str = Field(..., description="API Key for Azure OpenAI")
    AZURE_OPENAI_ENDPOINT: str = Field(..., description="Endpoint for Azure OpenAI")
    AZURE_OPENAI_CHAT_DEPLOYMENT: str = Field(..., description="Deployment name for chat model")
    AZURE_OPENAI_EMBEDDINGS_DEPLOYMENT: str = Field(..., description="Deployment name for embeddings model")
    OPENAI_API_VERSION: str = Field("2024-02-15-preview", description="API version for Azure OpenAI")

    # Azure AI Search
    AZURE_SEARCH_ENDPOINT: str = Field(..., description="Endpoint for Azure AI Search")
    AZURE_SEARCH_INDEX_NAME: str = Field(..., description="Index name for Azure AI Search")
    AZURE_SEARCH_ADMIN_KEY: str = Field(..., description="API Key for Azure AI Search")

    # Azure SQL
    SQL_SERVER: str = Field(..., description="SQL Server host")
    SQL_DATABASE: str = Field(..., description="SQL Database name")
    SQL_USER: str = Field(..., description="SQL Username")
    SQL_PASSWORD: str = Field(..., description="SQL Password")
    DATABASE_URL: str = Field(..., description="SQLAlchemy connection URL")

    # Azure Blob Storage
    AZURE_STORAGE_CONNECTION_STRING: str = Field(..., description="Connection string for Azure Blob Storage")
    AZURE_STORAGE_CONTAINER_NAME: str = Field(..., description="Container name for Azure Blob Storage")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore" # Permite que haya otras variables en el .env sin que rompa
    )

# Instanciamos la configuración al momento de importar. 
# Esto fallará inmediatamente si faltan variables obligatorias en el entorno o .env.
settings = Settings()

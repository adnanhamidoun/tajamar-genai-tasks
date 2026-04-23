import asyncio
import uuid
from fastapi import UploadFile
from azure.storage.blob import BlobServiceClient

from app.core.config import settings

class StorageService:
    def __init__(self):
        self.connection_string = settings.AZURE_STORAGE_CONNECTION_STRING
        self.container_name = settings.AZURE_STORAGE_CONTAINER_NAME

    def _upload_to_blob(self, file_content: bytes, blob_name: str):
        """
        Método síncrono para interactuar con Azure SDK.
        """
        blob_service_client = BlobServiceClient.from_connection_string(self.connection_string)
        container_client = blob_service_client.get_container_client(self.container_name)
        
        # Crea el contenedor si no existe
        if not container_client.exists():
            container_client.create_container()
            
        blob_client = container_client.get_blob_client(blob_name)
        blob_client.upload_blob(file_content, overwrite=True)

    async def upload_document(self, assistant_id: uuid.UUID, file: UploadFile) -> str:
        """
        Lee el archivo de forma asíncrona y delega la subida a un thread.
        """
        # Generar un nombre único para el blob
        blob_name = f"assistants/{assistant_id}/{uuid.uuid4()}-{file.filename}"
        
        # Leer archivo asíncronamente (en memoria)
        file_content = await file.read()
        
        # Ejecutar la operación de subida en un hilo separado (evita bloquear el event loop)
        await asyncio.to_thread(self._upload_to_blob, file_content, blob_name)
            
        return blob_name

    async def list_documents(self, assistant_id: uuid.UUID) -> list[str]:
        prefix = f"assistants/{assistant_id}/"
        blob_service_client = BlobServiceClient.from_connection_string(self.connection_string)
        container_client = blob_service_client.get_container_client(self.container_name)
        
        def get_blobs():
            if not container_client.exists(): return []
            return [blob.name for blob in container_client.list_blobs(name_starts_with=prefix)]
            
        return await asyncio.to_thread(get_blobs)

    async def delete_document(self, blob_name: str):
        blob_service_client = BlobServiceClient.from_connection_string(self.connection_string)
        container_client = blob_service_client.get_container_client(self.container_name)
        
        def _delete():
            blob_client = container_client.get_blob_client(blob_name)
            if blob_client.exists():
                blob_client.delete_blob()
                
        await asyncio.to_thread(_delete)

    async def delete_all_blobs(self):
        blob_service_client = BlobServiceClient.from_connection_string(self.connection_string)
        container_client = blob_service_client.get_container_client(self.container_name)
        
        def _delete_all():
            if container_client.exists():
                blobs = container_client.list_blobs()
                for blob in blobs:
                    container_client.delete_blob(blob.name)
                
        await asyncio.to_thread(_delete_all)

    async def delete_all_blobs_except(self, preserved_assistant_id: str):
        """
        Borra todos los blobs del contenedor EXCEPTO los que pertenecen
        al asistente con el ID indicado (prefijo: assistants/<id>/).
        """
        blob_service_client = BlobServiceClient.from_connection_string(self.connection_string)
        container_client = blob_service_client.get_container_client(self.container_name)
        protected_prefix = f"assistants/{preserved_assistant_id}/"

        def _delete_except():
            if not container_client.exists():
                return
            deleted = 0
            for blob in container_client.list_blobs():
                if not blob.name.startswith(protected_prefix):
                    container_client.delete_blob(blob.name)
                    deleted += 1
            print(f"Blob Storage: {deleted} blobs eliminados (protegido: {protected_prefix}).")

        await asyncio.to_thread(_delete_except)

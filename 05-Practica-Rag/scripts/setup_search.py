import os
import sys

# Añadir el directorio padre al PATH para poder importar la configuración de la app
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from azure.core.credentials import AzureKeyCredential
from azure.search.documents.indexes import SearchIndexClient
from azure.search.documents.indexes.models import (
    SearchIndex,
    SimpleField,
    SearchableField,
    SearchField,
    SearchFieldDataType,
    VectorSearch,
    HnswAlgorithmConfiguration,
    VectorSearchProfile,
)
from app.core.config import settings

def create_or_update_index():
    endpoint = settings.AZURE_SEARCH_ENDPOINT
    key = settings.AZURE_SEARCH_ADMIN_KEY
    index_name = settings.AZURE_SEARCH_INDEX_NAME

    credential = AzureKeyCredential(key)
    client = SearchIndexClient(endpoint=endpoint, credential=credential)

    # Configuración del algoritmo de búsqueda vectorial HNSW
    vector_search = VectorSearch(
        algorithms=[
            HnswAlgorithmConfiguration(
                name="myHnswConfig",
                parameters={
                    "m": 4,
                    "efConstruction": 400,
                    "efSearch": 500,
                    "metric": "cosine"
                }
            )
        ],
        profiles=[
            VectorSearchProfile(
                name="myVectorProfile",
                algorithm_configuration_name="myHnswConfig",
            )
        ]
    )

    # Definir los campos que pediste:
    # id (Key), assistant_id (filterable), content (searchable), content_vector (dimensiones 1536)
    fields = [
        SimpleField(name="id", type=SearchFieldDataType.String, key=True),
        SimpleField(name="assistant_id", type=SearchFieldDataType.String, filterable=True),
        SearchableField(name="content", type=SearchFieldDataType.String),
        SearchField(
            name="content_vector",
            type=SearchFieldDataType.Collection(SearchFieldDataType.Single),
            searchable=True,
            vector_search_dimensions=1536,
            vector_search_profile_name="myVectorProfile"
        )
    ]

    index = SearchIndex(name=index_name, fields=fields, vector_search=vector_search)
    
    print(f"Creando o actualizando el índice '{index_name}' en Azure AI Search...")
    result = client.create_or_update_index(index)
    print(f"¡Índice '{result.name}' configurado con éxito!")

if __name__ == "__main__":
    create_or_update_index()

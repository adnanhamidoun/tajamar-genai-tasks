from fastapi import Depends
from app.core.config import settings
from app.data_access.example_repository import ExampleRepository
from app.services.example_service import ExampleService

# Dependencia para Data Access (Repository)
def get_example_repository() -> ExampleRepository:
    # Aquí es donde instanciamos el repositorio y le inyectamos las dependencias necesarias 
    # (ej. sesión de DB, strings de conexión desde settings)
    return ExampleRepository(connection_string=settings.DATABASE_URL)

# Dependencia para Service Layer
def get_example_service(
    repository: ExampleRepository = Depends(get_example_repository)
) -> ExampleService:
    # Instanciamos el servicio y le inyectamos el repositorio
    return ExampleService(repository=repository)

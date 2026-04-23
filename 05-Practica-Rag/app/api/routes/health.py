from fastapi import APIRouter, Depends
from app.services.example_service import ExampleService
from app.api.dependencies import get_example_service
from app.core.config import settings

router = APIRouter(prefix="/health", tags=["health"])

@router.get("/")
def health_check(service: ExampleService = Depends(get_example_service)):
    """
    Endpoint de ejemplo para verificar el estado de la API y demostrar la inyección de dependencias.
    """
    # El controlador solo llama al servicio y devuelve la respuesta
    result = service.process_data()
    return {
        "status": "ok",
        "app_name": settings.APP_NAME,
        "service_result": result
    }

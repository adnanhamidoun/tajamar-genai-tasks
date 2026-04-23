from app.data_access.example_repository import ExampleRepository

class ExampleService:
    """
    Capa de Servicios.
    Contiene la lógica de negocio. Coordina con la capa de acceso a datos para obtener/guardar información,
    y puede llamar a otros servicios (ej. Azure OpenAI, Azure Search).
    """
    def __init__(self, repository: ExampleRepository):
        self.repository = repository

    def process_data(self) -> dict:
        # Lógica de negocio aquí
        data = self.repository.get_data()
        return {
            "processed": True,
            "business_logic_applied": "Success",
            "original_data": data
        }

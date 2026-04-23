class ExampleRepository:
    """
    Capa de Acceso a Datos (Data Access / Repository).
    Se encarga de las consultas a bases de datos, APIs externas, o almacenamiento (SQL, Blob Storage, etc).
    """
    def __init__(self, connection_string: str):
        self.connection_string = connection_string

    def get_data(self) -> dict:
        # Aquí iría la lógica de acceso a la base de datos (ej. SQLAlchemy)
        return {"data": "mocked_data from database"}

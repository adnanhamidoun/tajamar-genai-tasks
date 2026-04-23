from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.core.config import settings

# Determinar el engine asíncrono basado en la URL
# En Azure SQL (SQL Server) el driver asíncrono suele ser mssql+aioodbc://...
# Si la DB es Azure Database for PostgreSQL, sería postgresql+asyncpg://...

database_url = settings.DATABASE_URL
# Asegurarse de que usemos el driver correcto según la URL configurada
if database_url.startswith("postgresql://"):
    database_url = database_url.replace("postgresql://", "postgresql+asyncpg://", 1)
elif database_url.startswith("mssql+pyodbc://"):
    database_url = database_url.replace("mssql+pyodbc://", "mssql+aioodbc://", 1)
elif database_url.startswith("mssql://"):
    database_url = database_url.replace("mssql://", "mssql+aioodbc://", 1)

if "mssql" in database_url and "MARS_Connection" not in database_url:
    database_url += "&MARS_Connection=yes"

# Crear el motor asíncrono
engine = create_async_engine(
    database_url,
    echo=settings.DEBUG, # True para ver las queries en desarrollo
)

# Session factory
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False
)

async def get_db():
    """
    Dependencia de FastAPI para inyectar la sesión de la base de datos asíncrona.
    """
    async with AsyncSessionLocal() as session:
        yield session

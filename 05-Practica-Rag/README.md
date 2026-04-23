# Aisla-RAG 🚀

**Aisla-RAG** es una plataforma de Inteligencia Artificial generativa de nivel empresarial diseñada para la creación, gestión e interacción de múltiples asistentes virtuales basados en el patrón **RAG (Retrieval-Augmented Generation)**. 

Con un enfoque absoluto en la seguridad, la escalabilidad y la eficiencia de costes, Aisla-RAG garantiza un aislamiento hermético de los datos corporativos, permitiendo que múltiples asistentes (o inquilinos) coexistan en la misma infraestructura sin riesgo de fuga de información.

---

## 🛠️ Stack Tecnológico

El sistema ha sido construido sobre una arquitectura moderna, asíncrona y respaldada por el ecosistema Cloud de Microsoft Azure:

- **Backend Framework:** [FastAPI](https://fastapi.tiangolo.com/) (Rendimiento extremo, tipado estricto, operaciones asíncronas).
- **ORM & Persistencia:** [SQLAlchemy 2.0](https://www.sqlalchemy.org/) (Modelos declarativos asíncronos con soporte avanzado de tipado estricto).
- **Inteligencia Artificial:** Azure OpenAI (Implementando modelos ultrarrápidos como `gpt-4o-mini` y generadores de embeddings avanzados).
- **Base Vectorial (VDB):** Azure AI Search (Búsqueda vectorial nativa y filtrado ultra-rápido de OData).
- **Almacenamiento Físico:** Azure Blob Storage (Persistencia de documentos a bajo coste).

---

## 📚 Documentación Técnica

Para explorar en profundidad las decisiones de ingeniería detrás del producto, consulta la documentación oficial:

- 🏛️ **[Arquitectura del Sistema](docs/ARCHITECTURE.md)**: Flujos de ingesta RAG, justificación del ecosistema Azure y escalabilidad.
- 🛡️ **[Seguridad y Aislamiento](docs/SECURITY.md)**: Cómo garantizamos la prevención total de *Data Leakage* y evitamos vulnerabilidades.
- 💾 **[Base de Datos e Índices Vectoriales](docs/DATABASE.md)**: Diagramas Entidad-Relación y detalles algorítmicos (HNSW) en Azure.

---

## 🚀 Guía de Despliegue Rápido

Aisla-RAG está diseñado para un despliegue sin fricciones. Sigue estos pasos para arrancar el entorno de desarrollo local.

### 1. Clonar y Configurar el Entorno Virtual

Recomendamos usar un entorno virtual para mantener el aislamiento de dependencias:

```bash
# Crear entorno virtual
python -m venv venv

# Activar el entorno (Windows)
.\venv\Scripts\activate
# Activar el entorno (macOS/Linux)
# source venv/bin/activate

# Instalar las dependencias core
pip install -r requirements.txt
```

### 2. Configurar Variables de Entorno

Copia el archivo `.env.example` (si existe) o crea un archivo `.env` en la raíz del proyecto. Deberás configurar tus credenciales de Azure, incluyendo endpoints y keys de OpenAI, Search y SQL Server. Aisla-RAG valida estrictamente estas variables en el arranque utilizando Pydantic.

### 3. Ejecutar Migraciones (Base de Datos)

El proyecto utiliza **Alembic** para gestionar el ciclo de vida del esquema de la base de datos SQL. 

```bash
# Sincroniza tu base de datos Azure SQL Server con el modelo de datos más reciente
alembic upgrade head
```

*Nota: Asegúrate de que la IP de tu máquina esté permitida en el Firewall de Azure SQL.*

### 4. Configurar Base Vectorial

Antes de arrancar, debes instanciar el índice en Azure AI Search:

```bash
python scripts/setup_search.py
```

### 5. Iniciar el Servidor de Aplicaciones

Arranca el servidor Uvicorn con recarga automática para desarrollo:

```bash
uvicorn app.main:app --reload
```

La API estará disponible en `http://127.0.0.1:8000`. Puedes explorar e interactuar de inmediato a través de Swagger UI visitando: **`http://127.0.0.1:8000/docs`**

# Aisla-RAG: Documentación Técnica de Infraestructura

Este documento detalla la configuración de la infraestructura en la nube para el proyecto **Aisla-RAG**, un sistema de asistentes multitenant basado en arquitectura RAG (Retrieval-Augmented Generation).

## 1. Resumen de la Arquitectura
La solución se despliega íntegramente en **Microsoft Azure**, priorizando un modelo de costes de **pago por uso (Serverless)** y garantizando el aislamiento lógico de datos por asistente.

**Región principal:** Sweden Central (Sverige central)
**Modelo de costes:** Optimización máxima mediante políticas de auto-pausado y tiers de consumo.

---

## 2. Componentes del Sistema

### A. Azure OpenAI (Cerebro e Inteligencia)
Se ha desplegado un recurso de Azure OpenAI para gestionar tanto la generación de lenguaje como la vectorización de documentos.

- **Modelo LLM:** `gpt-4o-mini`
  - *Decisión:* Se ha elegido la versión mini por su equilibrio entre inteligencia y coste (90% más económico que GPT-4o estándar) siendo ideal para tareas de síntesis de contexto.
  - *Configuración:* Global-Standard con límite de **15,000 TPM** (Tokens por Minuto) como medida de seguridad financiera.
- **Modelo de Embeddings:** `text-embedding-3-small`
  - *Decisión:* Modelo de última generación, más eficiente y con menores dimensiones vectoriales que modelos anteriores, reduciendo el coste de almacenamiento en la base vectorial.

### B. Azure AI Search (Motor de Búsqueda Vectorial)
Actúa como la memoria a largo plazo del sistema, permitiendo búsquedas semánticas sobre los documentos subidos.

- **Tier:** Basic.
- **Estrategia de Aislamiento:** Filtrado por Metadatos.
  - *Decisión:* En lugar de crear un índice por asistente, se utiliza un campo `assistant_id` marcado como `filterable`. Esto permite un aislamiento total de la información en las consultas sin incurrir en los costes de múltiples índices.
- **Algoritmo:** HNSW (Hierarchical Navigable Small World) para búsquedas vectoriales de baja latencia.

### C. Azure SQL Database (Persistencia y Memoria Conversacional)
Base de datos relacional para gestionar la lógica de negocio y el historial de chat.

- **Tier de Servicio:** General Purpose.
- **Modelo de Computación:** **Serverless**.
- **Configuración de Hardware:** Standard-series (Gen5), 0.5 - 1 vCore.
- **Política de Ahorro:** **Auto-pause habilitado (1 hora)**.
  - *Decisión:* La base de datos entra en estado de hibernación tras una hora de inactividad, eliminando los costes de computación mientras no se utiliza el sistema.
- **Almacenamiento:** Reducido a **6.5 GB** con redundancia local (LRS) para minimizar el coste fijo mensual a <1 USD.

### D. Azure Blob Storage (Almacén de Archivos)
Almacenamiento de objetos para los documentos fuente (PDF, DOCX).

- **Tier:** Standard LRS (Locally Redundant Storage).
- **Contenedor:** `documentos-asistentes`.

---

## 3. Guía de Conectividad y Seguridad

Para permitir que el entorno de desarrollo local se comunique con los servicios de Azure, se han aplicado las siguientes reglas de red:

1. **Firewall de SQL Server:** Se ha añadido la IP pública del desarrollador a la lista blanca de reglas de firewall.
2. **Acceso a API:** Azure OpenAI y AI Search configurados para permitir acceso desde "Todas las redes" para facilitar el desarrollo local sin necesidad de VPN o Private Links en esta fase.

---

## 4. Configuración del Entorno (.env)

El sistema requiere las siguientes variables de entorno para su correcto funcionamiento. **No subir el archivo .env real al control de versiones.**

```env
# AZURE OPENAI
AZURE_OPENAI_KEY="XXXXXX"
AZURE_OPENAI_ENDPOINT="[https://aisla-rag-openai.openai.azure.com/](https://aisla-rag-openai.openai.azure.com/)"
AZURE_OPENAI_CHAT_NAME="gpt-chat-deployment"
AZURE_OPENAI_EMBEDDINGS_NAME="text-embedding-deployment"

# AZURE AI SEARCH
AZURE_SEARCH_KEY="XXXXXX"
AZURE_SEARCH_ENDPOINT="[https://aisla-rag-search.search.windows.net](https://aisla-rag-search.search.windows.net)"
AZURE_SEARCH_INDEX_NAME="asistentes-index"

# AZURE SQL
SQL_SERVER="aisla-rag-server.database.windows.net"
SQL_DATABASE="aisla-db"
SQL_USER="admin_user"
SQL_PASSWORD="password_segura"

# AZURE STORAGE
AZURE_STORAGE_CONNECTION_STRING="DefaultEndpointsProtocol=https;AccountName=..."
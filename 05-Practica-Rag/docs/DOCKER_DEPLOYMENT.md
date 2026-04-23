# 🚢 El Manual de Operaciones: Docker y Despliegue

[Volver al Inicio](./README.md)

## 🐋 Estrategia Docker
El proyecto se empaquetará utilizando un enfoque multi-contenedor mediante Dockerfiles aislados.

### 1. Frontend (Vite -> Nginx)
Se utiliza un *Multi-stage build*:
1. **Fase de Compilación:** Usa una imagen de Node para instalar dependencias y ejecutar `npm run build`.
2. **¿Por qué `VITE_API_URL`?** Las aplicaciones Vite se compilan estáticamente. Inyectamos `import.meta.env.VITE_API_URL` en el proceso de `build`. Así, el JS resultante en producción sabe comunicarse con `api.tu-empresa.azure.com` sin quemar URLs a fuego en el código fuente.
3. **Fase de Servidor:** La segunda fase copia la carpeta `dist/` a un servidor web `Nginx` alpino súper ligero, enlazado al puerto 80.

### 2. Backend (FastAPI -> Uvicorn)
1. Usamos una imagen de Python base ligera (`python:3.11-slim`).
2. Instalamos los paquetes de `requirements.txt`.
3. **Ejecución:** Levantamos el servidor de forma síncrona/asíncrona con `uvicorn app.main:app --host 0.0.0.0 --port 8000`.

## 🌐 Variables de Entorno de Producción
A nivel del contenedor Backend, es estrictamente obligatorio montar las credenciales y URLs. Si falta alguna, `rag_service.py` fallará catastróficamente al invocar a LangChain.
```env
# Claves OpenAI
AZURE_OPENAI_API_KEY="..."
AZURE_OPENAI_ENDPOINT="..."
AZURE_OPENAI_API_VERSION="..."

# Azure Cognitive Search
AZURE_SEARCH_ENDPOINT="..."
AZURE_SEARCH_API_KEY="..."

# Bases de Datos
AZURE_STORAGE_CONNECTION_STRING="..."
DATABASE_URL="sqlite+aiosqlite:///./sql_app.db" # O cadena SQL Server en prod
```

## 🚀 Despliegue en Azure ACI
Azure Container Instances (ACI) es ideal porque factura por segundo consumido de contenedor. Para el despliegue ejecutaremos `docker context create aci` y usaremos comandos nativos de Compose integrados en la nube para levantar el clúster.

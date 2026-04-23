FROM python:3.10-slim

WORKDIR /app

# 1. Instalar dependencias del sistema y el Driver de Microsoft para SQL Server
# Usamos el método moderno para añadir repositorios en Debian/Ubuntu
RUN apt-get update && apt-get install -y curl gnupg2 \
    && curl -fsSL https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor -o /usr/share/keyrings/microsoft-prod.gpg \
    && echo "deb [arch=amd64,arm64,armhf signed-by=/usr/share/keyrings/microsoft-prod.gpg] https://packages.microsoft.com/debian/12/prod bookworm main" > /etc/apt/sources.list.d/mssql-release.list \
    && apt-get update \
    && ACCEPT_EULA=Y apt-get install -y msodbcsql18 unixodbc-dev \
    && apt-get install -y build-essential \
    && rm -rf /var/lib/apt/lists/*

# 2. Copiar el requirements.txt (el que acabas de generar con el freeze)
COPY requirements.txt .

# 3. Instalar todas las librerías de Python
RUN pip install --no-cache-dir -r requirements.txt

# 4. Copiar el código de la app
COPY ./app ./app

# 5. Configuración de ejecución
EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers", "--forwarded-allow-ips", "*"]
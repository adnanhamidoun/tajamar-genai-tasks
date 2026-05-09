# Base image con Python 3.9 slim (versión estabilizada y ligera)
FROM python:3.9-slim

# Metadatos del contenedor
LABEL maintainer="Lead Machine Learning Engineer"
LABEL description="API Flask para inferencia de Housing Prices con Keras"

# Establecer directorio de trabajo en la raíz del pod
WORKDIR /app

# Copiar dependencias y artefactos previamente serializados 
COPY requirements.txt .
COPY app.py .
COPY housing_model_final.keras .
# Asegurarse que scaler_X.pkl y scaler_y.pkl existan antes de hacer docker build
COPY scaler_X.pkl . 
COPY scaler_y.pkl .

# Instalación de librerías del sistema esenciales y requerimientos
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Posteo de seguridad exponen de puerto de red Flask
EXPOSE 5000

# Punto de inmersión y arranque de aplicación
CMD ["python", "app.py"]

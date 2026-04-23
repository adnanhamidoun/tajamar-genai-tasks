# Etapa 1: Build de React/Vite
FROM node:22-alpine as build

WORKDIR /app

# Copiar archivos de configuración de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar todo el código fuente del frontend
COPY . .

# Argumento para que Vite sepa dónde compilar las llamadas a la API
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Construir el frontend para producción (se generará la carpeta /dist)
RUN npm run build

# Etapa 2: Servidor de Producción con Nginx
FROM nginx:alpine

# Copiar la configuración personalizada de nginx (para Single Page Applications)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar los estáticos compilados desde la Etapa 1
COPY --from=build /app/dist /usr/share/nginx/html

# Exponer el puerto 80
EXPOSE 80

# Iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]

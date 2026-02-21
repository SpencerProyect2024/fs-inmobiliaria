FROM ghcr.io/puppeteer/puppeteer:latest

# Cambiamos a root solo para preparar carpetas y permisos
USER root

# Eliminamos la línea de apt-get que fallaba porque Chrome ya existe en esta imagen
# Definimos el directorio de trabajo
WORKDIR /app

# Copiamos el package.json para instalar dependencias primero (mejor para la caché)
COPY package*.json ./

# Instalamos las librerías de Node
RUN npm install

# Copiamos todo el contenido de la carpeta backend al directorio actual (/app)
COPY backend/ .

# Aseguramos que el usuario pptruser tenga permisos sobre los archivos copiados
RUN chown -R pptruser:pptruser /app

# Volvemos al usuario seguro de la imagen de Puppeteer
USER pptruser

# Forzamos a Puppeteer a usar el Chrome que ya trae la imagen
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

EXPOSE 10000

# Como copiamos el contenido de backend/ a la raíz de /app, server.js está ahí mismo
CMD ["node", "server.js"]
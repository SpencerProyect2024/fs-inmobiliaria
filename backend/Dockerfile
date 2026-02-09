FROM ghcr.io/puppeteer/puppeteer:latest

USER root
WORKDIR /app

# Copiamos el package.json desde la raíz
COPY package*.json ./

# Instalamos librerías
RUN npm install

# ¡ESTA ES LA LÍNEA CLAVE! 
# Copia el CONTENIDO de backend directamente a /app
COPY backend/. .

EXPOSE 10000

# Ahora sí encontrará el archivo server.js en la raíz de /app
CMD ["node", "server.js"]
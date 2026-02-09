FROM ghcr.io/puppeteer/puppeteer:latest

USER root
WORKDIR /app

# Subimos un nivel para copiar el package.json que está en la raíz
COPY ../package*.json ./

# Instalamos las librerías
RUN npm install

# Copiamos todo el contenido de la carpeta backend
COPY backend/. .

EXPOSE 10000

# Arrancamos el servidor
CMD ["node", "server.js"]
FROM ghcr.io/puppeteer/puppeteer:latest

USER root
WORKDIR /app

# Copiamos archivos de dependencias
COPY package*.json ./

# Instalamos las librerías de Node
RUN npm install

# Copiamos el resto de tu código de la carpeta backend
COPY . .

# Puerto para Render
EXPOSE 10000

# IMPORTANTE: Usamos server.js que es como se llama tu archivo en GitHub
CMD ["node", "server.js"]
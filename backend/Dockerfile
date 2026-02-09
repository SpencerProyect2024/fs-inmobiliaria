FROM ghcr.io/puppeteer/puppeteer:latest

USER root
WORKDIR /app

# Instalar dependencias del sistema para WhatsApp
RUN apt-get update && apt-get install -y \
    libgpgcheck-perl \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install

COPY . .

# Puerto que configuramos en tu .env
EXPOSE 10000

CMD ["node", "index.js"]
import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import authRoutes from "./routes/auth.js";
import lotesRoutes from "./routes/lotes.js";

import pkg from "whatsapp-web.js";
const { Client, LocalAuth } = pkg;

import qrcode from "qrcode-terminal";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

/* ===============================
   🔥 CORS GLOBAL (ANTES DE TODO)
================================ */

app.use(cors({
  origin: '*', 
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// ESTO ES LO MÁS IMPORTANTE: Agrégalo justo debajo del app.use(cors...)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});


/* ===============================
   BODY
================================ */

app.use(express.json());


/* ===============================
   WHATSAPP CONFIG
================================ */

const client = new Client({
    authStrategy: new LocalAuth({
        clientId: "client-one" // Esto ayuda a separar sesiones
    }),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--no-first-run',
            '--no-zygote',
            '--single-process'
        ]
    }
});

// USAMOS EL EVENTO QR PARA PEDIR EL CÓDIGO SOLO CUANDO EL NAVEGADOR ESTÉ LISTO
client.on('qr', async (qr) => {
    console.log('--- NAVEGADOR LISTO, GENERANDO CÓDIGO ---');
    try {
        // REEMPLAZA ESTO CON TU NÚMERO REAL
        const pairingCode = await client.requestPairingCode('5491100000000'); 
        console.log('****************************************');
        console.log('TU CÓDIGO DE VINCULACIÓN ES:', pairingCode);
        console.log('****************************************');
    } catch (err) {
        console.log('Error al generar código, reintentando...');
    }
});

client.on('ready', () => {
    console.log('✅ WhatsApp conectado correctamente');
});

client.initialize().catch(err => console.error("Error al inicializar:", err));

// AGREGA ESTO AL FINAL O DESPUÉS DE INITIALIZE
// Sustituye 'tu_numero' por tu número con código de país (ej: 54911...)
setTimeout(async () => {
    const code = await client.requestPairingCode('TU_NUMERO_DE_TELEFONO_CON_CODIGO_PAIS');
    console.log('---------------------------------');
    console.log('TU CÓDIGO DE VINCULACIÓN ES:', code);
    console.log('---------------------------------');
}, 5000);

client.on("qr", (qr) => {
  console.log("⚠️ Escanea el QR:");
  qrcode.generate(qr, { small: true });
});


client.on("ready", () => {
  console.log("✅ WhatsApp conectado");
});


client.on("disconnected", (reason) => {
  console.log("❌ Desconectado:", reason);
  client.initialize();
});


client.initialize().catch(err => {
  console.error("Error WhatsApp:", err);
});


/* ===============================
   ROUTES
================================ */

app.use("/api/auth", authRoutes);
app.use("/api/lotes", lotesRoutes);


/* ===============================
   TEST
================================ */

app.get("/ping", (req, res) => {
  res.json({ ok: true });
});


/* ===============================
   SERVER
================================ */

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

export { client };

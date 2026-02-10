import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import pkg from "whatsapp-web.js"; // IMPORTANTE: Descomentado
const { Client, LocalAuth } = pkg;   // IMPORTANTE: Descomentado

import authRoutes from "./routes/auth.js";
import lotesRoutes from "./routes/lotes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

// 🔥 CORS CONFIG (Una sola vez, bien hecho)
app.use(cors({
    origin: '*',
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

/* ===============================
    WHATSAPP CONFIG
================================ */
/*const client = new Client({
    authStrategy: new LocalAuth({ clientId: "session-fs" }),
    puppeteer: {
        headless: true,
         executablePath: '/usr/bin/google-chrome-stable', // Prueba con esta primer
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--single-process'
        ]
    }
});

let codeRequested = false;*/

client.on('qr', async (qr) => {
    if (!codeRequested) {
        codeRequested = true;
        console.log('--- ESPERANDO 15 SEG PARA CARGA DE WHATSAPP ---');
        setTimeout(async () => {
            try {
                console.log('--- GENERANDO CÓDIGO DE VINCULACIÓN ---');
                const pairingCode = await client.requestPairingCode('573203910334'); 
                console.log('****************************************');
                console.log('TU CÓDIGO FINAL ES:', pairingCode);
                console.log('****************************************');
            } catch (err) {
                console.error('Error al generar código:', err.message);
                codeRequested = false;
            }
        }, 15000);
    }
});

client.on('ready', () => {
    console.log('✅ CONEXIÓN EXITOSA: WhatsApp está activo.');
});

/* ===============================
    ROUTES
================================ */
app.use("/api/auth", authRoutes);
app.use("/api/lotes", lotesRoutes);

app.get("/ping", (req, res) => {
    res.json({ ok: true });
});

/* ===============================
    SERVER START
================================ */
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    
    // Solo inicializamos si no hay un error previo
    client.initialize().catch(err => {
        console.error("Fallo al iniciar WhatsApp (El login seguirá funcionando):", err.message);
    });
});

export { client };
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import lotesRoutes from './routes/lotes.js';
import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode-terminal';

dotenv.config();
const app = express();
// Ajuste para despliegue: usa el puerto de Railway o 3001 por defecto
const PORT = process.env.PORT || 3001;

// --- CONFIGURACIÓN DE WHATSAPP MEJORADA ---
const client = new Client({
    authStrategy: new LocalAuth(),
    qrMaxRetries: 10, // Evita que el QR cambie tan rápido
    puppeteer: { 
        headless: true,
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu'
        ] 
    }
});

// Evento QR
client.on('qr', (qr) => {
    console.log('⚠️ NUEVO QR GENERADO (Escanea rápido):');
    qrcode.generate(qr, { small: true });
});

// Evento Ready
client.on('ready', () => {
    console.log('✅ WhatsApp Bot conectado y listo para enviar mensajes!');
});

// Evento de desconexión (Para que no se quede colgado)
client.on('disconnected', (reason) => {
    console.log('❌ El bot se desconectó:', reason);
    client.initialize(); // Intenta reconectar automáticamente
});

client.initialize().catch(err => console.error("Error inicializando WhatsApp:", err));

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/lotes', lotesRoutes);

// --- ENDPOINT NOTIFICAR (ACTUALIZADO CON TELÉFONO DEL CLIENTE) ---
app.post('/api/whatsapp/notificar', async (req, res) => {
    // Extraemos 'telefono_prospecto' que viene desde el frontend
    const { cliente, telefono_prospecto, proyecto, fecha_cita, telefonoJefe, lote } = req.body;
    console.log("📩 Petición recibida para:", cliente);

    try {
        if (!client || !client.info || !client.info.wid) {
             return res.json({ 
                success: false, 
                message: "WhatsApp no está listo. Espera a que el QR conecte." 
             });
        }

        // UNIÓN DE LOGICA: Mensaje estructurado con los datos del prospecto
        const mensaje = 
            `*🔔 NUEVA CITA AGENDADA*\n\n` +
            `👤 *Cliente:* ${cliente}\n` +
            `📞 *Teléfono:* ${telefono_prospecto || 'No proporcionado'}\n` +
            `🏗️ *Proyecto:* ${proyecto}\n` +
            `📍 *Lote:* ${lote || 'N/A'}\n` +
            `📅 *Fecha y Hora:* ${fecha_cita || 'Pendiente por definir'}\n\n` +
            `_Por favor, confirmar disponibilidad._`;

        const numeroDestino = telefonoJefe || "573204838819";
        const chatId = `${numeroDestino}@c.us`;

        await client.sendMessage(chatId, mensaje);
        console.log(`✅ MENSAJE ENVIADO A: ${numeroDestino}`);
        res.json({ success: true });

    } catch (error) {
        console.error("❌ ERROR AL ENVIAR:", error.message);
        res.json({ success: false, error: error.message });
    }
});

app.listen(PORT, () => {
  console.log(`🚀 SERVIDOR ACTIVO EN EL PUERTO: ${PORT}`);
});

export { client };
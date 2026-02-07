import express from "express";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.js";
import lotesRoutes from "./routes/lotes.js";

import pkg from "whatsapp-web.js";
const { Client, LocalAuth } = pkg;

import qrcode from "qrcode-terminal";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;


/* ===============================
   CONFIG CORS
================================ */

app.use((req, res, next) => {

  res.header(
    "Access-Control-Allow-Origin",
    "https://creative-marigold-466670.netlify.app"
  );

  res.header(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,DELETE,OPTIONS"
  );

  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );

  res.header("Access-Control-Allow-Credentials", "true");

  // Preflight
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

app.use(express.json());


/* ===============================
   WHATSAPP CONFIG
================================ */

const client = new Client({
  authStrategy: new LocalAuth(),

  qrMaxRetries: 10,

  puppeteer: {
    headless: true,

    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu"
    ]
  }
});


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
   WHATSAPP ENDPOINT
================================ */

app.post("/api/whatsapp/notificar", async (req, res) => {

  const {
    cliente,
    telefono_prospecto,
    proyecto,
    fecha_cita,
    telefonoJefe,
    lote
  } = req.body;


  try {

    if (!client?.info?.wid) {
      return res.json({
        success: false,
        message: "WhatsApp no está listo"
      });
    }


    const mensaje = `
🔔 NUEVA CITA

👤 Cliente: ${cliente}
📞 Teléfono: ${telefono_prospecto || "N/A"}
🏗️ Proyecto: ${proyecto}
📍 Lote: ${lote || "N/A"}
📅 Fecha: ${fecha_cita || "Pendiente"}
`;


    const numero = telefonoJefe || "573204838819";
    const chatId = `${numero}@c.us`;


    await client.sendMessage(chatId, mensaje);


    res.json({ success: true });


  } catch (error) {

    console.error("Error WhatsApp:", error);

    res.status(500).json({
      success: false,
      error: "Error enviando mensaje"
    });
  }
});


/* ===============================
   START SERVER
================================ */

app.listen(PORT, () => {
  console.log(`🚀 Servidor activo en puerto ${PORT}`);
});


export { client };

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
  origin: "https://creative-marigold-466670.netlify.app",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: false
}));

// Preflight
app.options("*", cors());


/* ===============================
   BODY
================================ */

app.use(express.json());


/* ===============================
   WHATSAPP CONFIG
================================ */

const client = new Client({
  authStrategy: new LocalAuth(),

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

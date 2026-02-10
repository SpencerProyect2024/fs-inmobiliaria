import express from "express";
import dotenv from "dotenv";
import cors from "cors";
// Comentamos estos para evitar que Node busque librerías que no usaremos en el servidor
// import pkg from "whatsapp-web.js"; 
// const { Client, LocalAuth } = pkg;

import authRoutes from "./routes/auth.js";
import lotesRoutes from "./routes/lotes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

// 🔥 CORS CONFIG
app.use(cors({
    origin: '*',
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

/* ===============================
    WHATSAPP CONFIG (DESACTIVADO PARA RENDER)
================================ */
// Si en el futuro usas Docker, puedes volver a activar esto.
// Por ahora, el Frontend maneja WhatsApp directamente.
const client = null; 

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
    console.log(`💡 WhatsApp logic bypass: Activo (Frontend handling)`);
});

// Cambiamos el export para que no falle
export { client };
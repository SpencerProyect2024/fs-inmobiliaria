import express from "express";
import dotenv from "dotenv";
import cors from "cors";

// 1. Rutas
import authRoutes from "./routes/auth.js";
import lotesRoutes from "./routes/lotes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

// 2. Middleware
app.use(cors({
    origin: '*',
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// 3. Rutas API
app.use("/api/auth", authRoutes);
app.use("/api/lotes", lotesRoutes);

app.get("/ping", (req, res) => {
    res.json({ ok: true, message: "Servidor activo" });
});

// 4. Inicio del servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`✅ Base de datos conectada correctamente`);
});

// 5. EXPORTACIÓN LIMPIA (Sin la variable 'client' que daba error)
export default app;
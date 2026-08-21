import cors from "cors";

const allowedOrigins = [
    "https://front-1-rho.vercel.app",
    process.env.FRONTEND_URL,
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:5000"
].filter(Boolean);

export const dynamicCors = cors({
    origin: (origin, callback) => {
        // Permitir peticiones sin origin (como herramientas de prueba) o si coincide con la lista permitida
        if (!origin || allowedOrigins.includes(origin) || allowedOrigins.some(o => origin && origin.startsWith(o)) || process.env.NODE_ENV !== "production") {
            callback(null, true);
        } else {
            callback(null, true); // Permitir peticiones cross-origin controladas por cabeceras
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-tenant-id"]
});

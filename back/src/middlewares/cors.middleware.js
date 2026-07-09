import cors from "cors";
import { models } from "../models/index.js";

// Opciones de CORS dinámico
const corsOptionsDelegate = async (req, callback) => {
    let corsOptions;
    const origin = req.header('Origin');
    const isTest = process.env.NODE_ENV === "test";

    try {
        // Permitir peticiones sin Origin (como Postman o curl) o si estamos en Testing
        if (!origin || isTest) {
            corsOptions = { origin: true };
            return callback(null, corsOptions);
        }

        const allowedLocalOrigins = ["http://localhost:3000", "http://127.0.0.1:3000"];
        if (allowedLocalOrigins.includes(origin)) {
            return callback(null, { origin: true });
        }

        // Buscar si el origin está en nuestra base de datos (y está activo)
        // Usa centralDb implicitamente a traves del fallback de models
        const mf = await models.MicroFrontend.findOne({ 
            where: { urlOrigen: origin, activo: true } 
        });

        if (mf) {
            corsOptions = { origin: true }; // Permitir
        } else {
            corsOptions = { origin: false }; // Denegar
        }
        
        callback(null, corsOptions);
    } catch (error) {
        // Fallback seguro en caso de error de DB
        console.error("Error al validar CORS dinámico:", error);
        callback(null, { origin: false });
    }
};

export const dynamicCors = cors(corsOptionsDelegate);

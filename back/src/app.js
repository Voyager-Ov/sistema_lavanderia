import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import authRoutes from "./routes/auth/auth.routes.js";
import usuarioRoutes from "./routes/usuarios/usuario.routes.js";
import clienteRoutes from "./routes/clientes/cliente.routes.js";
import trackingRoutes from "./routes/tracking/tracking.routes.js";
import categoriaRoutes from "./routes/categorias/categoria.routes.js";
import productoRoutes from "./routes/productos/producto.routes.js";
import cajaRoutes from "./routes/cajas/caja.routes.js";
import gastoRoutes from "./routes/gastos/gasto.routes.js";
import pagoRoutes from "./routes/pagos/pago.routes.js";
import pedidoRoutes from "./routes/pedidos/pedido.routes.js";
import asistenciaRoutes from "./routes/rrhh/asistencia.routes.js";
import reporteRoutes from "./routes/rrhh/reporte.routes.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import { successResponse } from "./utils/response.util.js";

import mfRoutes from "./routes/microfrontends/mf.routes.js";
import superadminRoutes from "./routes/superadmin/superadmin.routes.js";
import configuracionRoutes from "./routes/configuracion/configuracion.routes.js";
import dashboardRoutes from "./routes/dashboard/dashboard.routes.js";
import { dynamicCors } from "./middlewares/cors.middleware.js";

const app = express();

app.use(helmet());

// CORS Dinámico para múltiples micro-frontends
app.use(dynamicCors);

app.use(express.json());
app.use(cookieParser());

// Rate Limiting Global: Protege a TODA la API de ataques DDoS o saturación
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 1000, // Máximo de 1000 peticiones por IP en esos 15 mins para rutas generales
    message: { error: "Has excedido el límite de peticiones. Intenta nuevamente más tarde." },
    standardHeaders: true,
    legacyHeaders: false
});

// Rate Limiting Estricto para Auth (Prevención de ataques de fuerza bruta)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 20, // Solo 20 intentos
    message: { error: "Demasiadas peticiones desde esta IP, intente de nuevo en 15 minutos." }
});

// Aplicar el limitador global a todas las rutas bajo /api
app.use("/api/", globalLimiter);

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/usuarios", usuarioRoutes);
app.use("/api/clientes", clienteRoutes);
app.use("/api/tracking", trackingRoutes); // Ruta pública
app.use("/api/categorias", categoriaRoutes);
app.use("/api/productos", productoRoutes);
app.use("/api/cajas", cajaRoutes);
app.use("/api/gastos", gastoRoutes);
app.use("/api/pagos", pagoRoutes);
app.use("/api/pedidos", pedidoRoutes);
app.use("/api/rrhh/asistencias", asistenciaRoutes);
app.use("/api/rrhh/reportes", reporteRoutes);
app.use("/api/microfrontends", mfRoutes);
app.use("/api/superadmin", superadminRoutes);
app.use("/api/configuracion", configuracionRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.get("/api/health", (req, res) => {
	return successResponse(res, 200, "Lavanderia API Health Check", { timestamp: new Date() });
});

app.use((req, res) => {
	res.status(404).json({ error: "Ruta no encontrada" });
});

// Middleware de errores
app.use(errorHandler);

export default app;

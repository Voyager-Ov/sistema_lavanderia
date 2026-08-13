import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";

// Custom Middlewares
import { errorHandler } from "./middlewares/error.middleware.js";
import { dynamicCors } from "./middlewares/cors.middleware.js";
import { successResponse } from "./utils/response.util.js";

// Module Routes (Feature-First Architecture)
import authRoutes from "./modules/auth/auth.routes.js";
import pedidosRoutes from "./modules/pedidos/pedidos.routes.js";
import clientesRoutes from "./modules/clientes/clientes.routes.js";
import finanzasRoutes from "./modules/finanzas/finanzas.routes.js";
import serviciosRoutes from "./modules/servicios/servicios.routes.js";
import categoriasRoutes from "./modules/servicios/categorias.routes.js";
import rrhhRoutes from "./modules/rrhh/rrhh.routes.js";
import dashboardRoutes from "./modules/dashboard/dashboard.routes.js";
import reportesRoutes from "./modules/reportes/reportes.routes.js";
import superadminRoutes from "./modules/superadmin/superadmin.routes.js";
import configuracionRoutes from "./modules/configuracion/configuracion.routes.js";
import trackingRoutes from "./modules/pedidos/tracking.routes.js";
import cajasRoutes from "./modules/finanzas/cajas.routes.js";
import pagosRoutes from "./modules/finanzas/pagos.routes.js";
import gastosRoutes from "./modules/gastos/gastos.routes.js";
import categoriasGastosRoutes from "./modules/gastos/categoriasGastos.routes.js";

const app = express();

// Security headers
app.use(helmet());

// CORS Configuration
app.use(dynamicCors);

// Body parsers
app.use(express.json());
app.use(cookieParser());

// Static uploads folder
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/uploads", express.static(path.join(__dirname, "../public/uploads")));

// Global Rate Limiting
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 1000 requests per window
    message: { error: "Has excedido el límite de peticiones. Intenta nuevamente más tarde." },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => process.env.NODE_ENV === "test" || process.env.NODE_ENV === "development" || req.headers["x-test-suite"] === "true"
});

// Stricter Rate Limiting for Authentication
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 25, // Limit each IP to 25 attempts
    message: { error: "Demasiadas peticiones desde esta IP, intente de nuevo en 15 minutos." },
    skip: (req) => process.env.NODE_ENV === "test" || process.env.NODE_ENV === "development" || req.headers["x-test-suite"] === "true"
});

// Apply rate limiting
app.use("/api/", globalLimiter);
app.use("/api/auth", authLimiter);

// Register Feature Routes
app.use("/api/auth", authRoutes);
app.use("/api/pedidos", pedidosRoutes);
app.use("/api/clientes", clientesRoutes);
app.use("/api/finanzas", finanzasRoutes);
app.use("/api/servicios", serviciosRoutes);
app.use("/api/productos", serviciosRoutes);
app.use("/api/categorias", categoriasRoutes);
app.use("/api/rrhh", rrhhRoutes);
app.use("/api/empleados", rrhhRoutes);
app.use("/api/usuarios", rrhhRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/reportes", reportesRoutes);
app.use("/api/superadmin", superadminRoutes);
app.use("/api/configuracion", configuracionRoutes);
app.use("/api/tracking", trackingRoutes);
app.use("/api/cajas", cajasRoutes);
app.use("/api/pagos", pagosRoutes);
app.use("/api/gastos", gastosRoutes);
app.use("/api/categorias-gastos", categoriasGastosRoutes);

// Health Check
app.get("/api/health", (req, res) => {
	return successResponse(res, 200, "SaaS Laundry API Health Check", { timestamp: new Date() });
});

// 404 handler
app.use((req, res) => {
	res.status(404).json({ error: "Ruta no encontrada" });
});

// Centralized error handler
app.use(errorHandler);

export default app;

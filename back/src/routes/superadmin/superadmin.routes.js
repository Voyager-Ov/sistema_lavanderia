import { Router } from "express";
import { models } from "../../models/index.js";
import { superAdminAuth } from "../../middleware/superAdminAuth.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import * as superadminController from "../../controllers/superadmin/superadmin.controller.js";
import * as mfController from "../../controllers/microfrontends/mf.controller.js";

const router = Router();

// @route   POST /api/superadmin/login
// @desc    Autenticar un SuperAdmin y obtener el token
// @access  Public
router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        const superAdmin = await models.SuperAdmin.findOne({ where: { email, activo: true } });
        if (!superAdmin) {
            return res.status(400).json({ error: "Credenciales inválidas" });
        }

        const isMatch = await bcrypt.compare(password, superAdmin.passwordHash);
        if (!isMatch) {
            return res.status(400).json({ error: "Credenciales inválidas" });
        }

        const payload = {
            id: superAdmin.id,
            email: superAdmin.email,
            rol: "SUPERADMIN_SYS"
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: "1d" },
            (err, token) => {
                if (err) throw err;
                res.json({
                    token,
                    user: {
                        id: superAdmin.id,
                        email: superAdmin.email,
                        nombre: superAdmin.nombre,
                        rol: "SUPERADMIN_SYS"
                    }
                });
            }
        );
    } catch (error) {
        console.error("Error en login superadmin:", error);
        res.status(500).json({ error: "Error en el servidor" });
    }
});

// Middleware for the rest
router.use(superAdminAuth);

// @route   GET /api/superadmin/dashboard
// @desc    Obtener métricas y listado de negocios y microfronts
router.get("/dashboard", async (req, res) => {
    try {
        const negocios = await models.Negocio.findAll({
            order: [["createdAt", "DESC"]]
        });
        
        const microfrontends = await models.MicroFrontend.findAll();

        res.json({
            negocios,
            microfrontends,
            stats: {
                totalNegocios: negocios.length,
                activos: negocios.filter(n => n.activo).length,
                inactivos: negocios.filter(n => !n.activo).length
            }
        });
    } catch (error) {
        console.error("Error obteniendo dashboard superadmin:", error);
        res.status(500).json({ error: "Error en el servidor" });
    }
});

import { runHealthCheck } from "../../services/monitor.service.js";

// @route   GET /api/superadmin/health-check
// @desc    Correr un chequeo manual del sistema
router.get("/health-check", async (req, res) => {
    try {
        const health = await runHealthCheck();
        res.json(health);
    } catch (error) {
        console.error("Error en health check manual:", error);
        res.status(500).json({ error: "Error en el servidor" });
    }
});

// @route   PUT /api/superadmin/negocios/:id/status
// @desc    Cortar o habilitar servicio a un negocio
router.put("/negocios/:id/status", async (req, res) => {
    try {
        const { id } = req.params;
        const { activo } = req.body;

        const negocio = await models.Negocio.findByPk(id);
        if (!negocio) {
            return res.status(404).json({ error: "Negocio no encontrado" });
        }

        if (activo !== undefined) negocio.activo = activo;
        await negocio.save();

        res.json(negocio);
    } catch (error) {
        console.error("Error actualizando negocio:", error);
        res.status(500).json({ error: "Error en el servidor" });
    }
});

// Use existing controllers where applicable
router.get("/negocios", superadminController.getNegocios);
router.patch("/negocios/:id/estado", superadminController.updateEstadoSuscripcion);

// --- Gestión de Microfrontends (CORS Origins) ---
router.get("/microfrontends", mfController.getMicroFrontends);
router.post("/microfrontends", mfController.createMicroFrontend);
router.patch("/microfrontends/:id/toggle", mfController.toggleMicroFrontend);

export default router;

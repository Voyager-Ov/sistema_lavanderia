import { Router } from "express";
import { verificarToken } from "../../middlewares/auth/auth.middleware.js";
import { verificarRol } from "../../middlewares/role.middleware.js";
import { 
	getMotivos, 
	getTodosMotivosAdmin, 
	createMotivo, 
	updateMotivo, 
	deleteMotivo 
} from "../../controllers/pedidos/motivos-cancelacion.controller.js";

const router = Router();

// Accesible por cualquier empleado/admin
router.get("/", verificarToken, getMotivos);

// Accesibles solo por ADMIN
router.use(verificarToken, verificarRol(["ADMIN", "SUPERADMIN"]));
router.get("/admin", getTodosMotivosAdmin);
router.post("/", createMotivo);
router.put("/:id", updateMotivo);
router.delete("/:id", deleteMotivo);

export default router;

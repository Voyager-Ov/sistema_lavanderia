import { Router } from "express";
import * as clienteCuentaController from "../../controllers/clientes/cliente-cuenta.controller.js";
import { verificarToken } from "../../middlewares/auth/auth.middleware.js";
import { verificarSuscripcionActiva } from "../../middlewares/auth/subscription.middleware.js";
import { verificarRol } from "../../middlewares/role.middleware.js";
import { validarCampos } from "../../middlewares/validation.middleware.js";
import { 
    cobrarDeudaValidator, 
    ajusteManualCreditoValidator, 
    movimientosFiltroValidator 
} from "../../validators/clientes/cliente-cuenta.validator.js";

const router = Router({ mergeParams: true });

// Todas las rutas requieren token y suscripción activa
router.use(verificarToken, verificarSuscripcionActiva);

router.get(
    "/estado-cuenta",
    verificarRol(["admin", "empleado"]),
    clienteCuentaController.getEstadoCuenta
);

router.get(
    "/movimientos",
    verificarRol(["admin", "empleado"]),
    movimientosFiltroValidator,
    validarCampos,
    clienteCuentaController.getMovimientosCuenta
);

router.get(
    "/creditos",
    verificarRol(["admin", "empleado"]),
    clienteCuentaController.getCreditosDisponibles
);

router.post(
    "/cobrar-deuda",
    verificarRol(["admin", "empleado"]),
    cobrarDeudaValidator,
    validarCampos,
    clienteCuentaController.cobrarDeuda
);

router.post(
    "/ajuste-credito",
    verificarRol(["admin"]),
    ajusteManualCreditoValidator,
    validarCampos,
    clienteCuentaController.crearAjusteManualCredito
);

export default router;

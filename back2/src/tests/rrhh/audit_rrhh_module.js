import dotenv from "dotenv";
dotenv.config({ path: "back2/.env" });
dotenv.config({ path: ".env" });
import { connectionManager } from "../../models/connectionManager.js";
import { empleadosService } from "../../modules/rrhh/services/empleados.service.js";
import { estadoEmpleadosService } from "../../modules/rrhh/services/estadoEmpleados.service.js";
import { desempenoEmpleadosService } from "../../modules/rrhh/services/desempenoEmpleados.service.js";
import { AppError } from "../../utils/appError.js";

async function runRrhhAudit() {
    console.log("🚀 INICIANDO AUDITORÍA Y PRUEBAS EN VIVO DEL MÓDULO DE RRHH / EMPLEADOS...\n");

    console.log("[TEST 1] Inicializando conexión central de DB (Neon DB)...");
    await connectionManager.initCentral();
    const negocioId = 13; // Negocio activo de prueba
    console.log("✅ Conexión inicializada con éxito.\n");

    console.log("[TEST 2] Verificando Fail-Fast al omitir negocioId en empleadosService...");
    try {
        await empleadosService.obtenerEmpleados(null);
        console.error("❌ FALLO: Debería haber rechazado negocioId nulo.");
        process.exit(1);
    } catch (err) {
        if (err instanceof AppError && err.code === "MISSING_TENANT_ID") {
            console.log("✅ Correcto: Lanzó AppError 400 (MISSING_TENANT_ID).\n");
        } else {
            console.error("❌ FALLO: Lanzó error inesperado:", err);
            process.exit(1);
        }
    }

    console.log("[TEST 3] Verificando Fail-Fast al intentar crear empleado sin contraseña...");
    try {
        await empleadosService.crearEmpleado(negocioId, {
            nombre: "Empleado Test Sin Clave",
            email: `test_sin_clave_${Date.now()}@lavanderia.com`
        });
        console.error("❌ FALLO: Debería haber rechazado la creación sin clave.");
        process.exit(1);
    } catch (err) {
        if (err instanceof AppError && (err.code === "INVALID_PASSWORD" || err.code === "MISSING_PASSWORD")) {
            console.log("✅ Correcto: Rechazó la creación sin contraseña requerida (400 INVALID_PASSWORD).\n");
        } else {
            console.error("❌ FALLO: Lanzó error inesperado:", err);
            process.exit(1);
        }
    }

    console.log("[TEST 4] Verificando Fail-Fast al intentar crear empleado sin rol...");
    try {
        await empleadosService.crearEmpleado(negocioId, {
            nombre: "Empleado Test Sin Rol",
            email: `test_sin_rol_${Date.now()}@lavanderia.com`,
            password: "password123"
        });
        console.error("❌ FALLO: Debería haber rechazado la creación sin rol.");
        process.exit(1);
    } catch (err) {
        if (err instanceof AppError && err.code === "MISSING_ROLE") {
            console.log("✅ Correcto: Rechazó la creación sin rol requerido (400 MISSING_ROLE).\n");
        } else {
            console.error("❌ FALLO: Lanzó error inesperado:", err);
            process.exit(1);
        }
    }

    console.log("[TEST 5] Verificando Fail-Fast en sueldoBase negativo...");
    try {
        await empleadosService.crearEmpleado(negocioId, {
            nombre: "Empleado Test Sueldo Inválido",
            email: `test_sueldo_${Date.now()}@lavanderia.com`,
            password: "password123",
            rol: "empleado",
            sueldoBase: -5000
        });
        console.error("❌ FALLO: Debería haber rechazado sueldo negativo.");
        process.exit(1);
    } catch (err) {
        if (err instanceof AppError && err.code === "INVALID_SUELDO") {
            console.log("✅ Correcto: Lanzó AppError 400 (INVALID_SUELDO).\n");
        } else {
            console.error("❌ FALLO: Lanzó error inesperado:", err);
            process.exit(1);
        }
    }

    const testEmail = `audit_emp_${Date.now()}@testlavanderia.com`;
    console.log(`[TEST 5] Registrando empleado válido atómicamente (${testEmail})...`);
    const nuevoEmp = await empleadosService.crearEmpleado(negocioId, {
        nombre: "Empleado Audit Vivo",
        email: testEmail,
        password: "passwordSegura123",
        telefono: "1199887766",
        rol: "empleado",
        sueldoBase: 450000,
        horasSemanalesObjetivo: 40
    });
    console.log(`✅ Empleado creado exitosamente ID: ${nuevoEmp.id} (Nombre: ${nuevoEmp.nombre}, Legajo Tenant + Usuario Central vinculado).\n`);

    console.log("[TEST 6] Consultando empleado por ID...");
    const empObtenido = await empleadosService.obtenerEmpleadoPorId(negocioId, nuevoEmp.id);
    if (empObtenido.id !== nuevoEmp.id || empObtenido.nombre !== "Empleado Audit Vivo") {
        console.error("❌ FALLO: Los datos recuperados no coinciden.");
        process.exit(1);
    }
    console.log("✅ Empleado recuperado por ID coincidente 1:1.\n");

    console.log("[TEST 7] Cambiando estado de activación del empleado atómicamente...");
    const empInactivo = await estadoEmpleadosService.cambiarEstadoEmpleado(negocioId, nuevoEmp.id, false);
    if (empInactivo.activo !== false) {
        console.error("❌ FALLO: El empleado debería estar inactivo.");
        process.exit(1);
    }
    console.log("✅ Estado desactivado exitosamente (activo: false).\n");

    console.log("[TEST 8] Reactivando empleado...");
    const empActivo = await estadoEmpleadosService.cambiarEstadoEmpleado(negocioId, nuevoEmp.id, true);
    if (empActivo.activo !== true) {
        console.error("❌ FALLO: El empleado debería estar activo.");
        process.exit(1);
    }
    console.log("✅ Estado reactivado exitosamente (activo: true).\n");

    console.log("[TEST 9] Obteniendo métricas de desempeño del empleado recién creado...");
    const metricas = await desempenoEmpleadosService.obtenerMetricasEmpleado(negocioId, nuevoEmp.id);
    if (!metricas || metricas.empleadoId !== nuevoEmp.id) {
        console.error("❌ FALLO: No se pudieron calcular las métricas.");
        process.exit(1);
    }
    console.log(`✅ Métricas calculadas con éxito: ${metricas.cajasAtendidas} cajas atendidas, $${metricas.totalFacturado} recaudado.\n`);

    console.log("[TEST 10] Actualizando legajo del empleado...");
    const empActualizado = await empleadosService.actualizarEmpleado(negocioId, nuevoEmp.id, {
        nombre: "Empleado Audit Modificado",
        sueldoBase: 500000
    });
    if (empActualizado.nombre !== "Empleado Audit Modificado" || Number(empActualizado.sueldoBase) !== 500000) {
        console.error("❌ FALLO: La actualización del empleado no persistió.");
        process.exit(1);
    }
    console.log("✅ Legajo de empleado actualizado a sueldoBase $500.000.\n");

    console.log("🎉 AUDITORÍA COMPLETA Y PRUEBAS EN VIVO DEL MÓDULO DE RRHH / EMPLEADOS EXITOSAS (100% PASS)!");
    process.exit(0);
}

runRrhhAudit().catch((err) => {
    console.error("💥 FALLO EN LA AUDITORÍA DE RRHH:", err);
    process.exit(1);
});

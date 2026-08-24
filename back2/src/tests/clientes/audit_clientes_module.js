import "dotenv/config";
import { connectionManager } from "../../models/connectionManager.js";
import { clientesService } from "../../modules/clientes/services/clientes.service.js";

async function runAuditTests() {
    process.env.NODE_ENV = "development";
    console.log("🚀 INICIANDO AUDITORÍA Y PRUEBAS DE INTEGRACIÓN DEL MÓDULO DE CLIENTES...");

    const negocioId = 13; // Negocio activo de pruebas
    let testClienteId = null;

    try {
        console.log("\n[TEST 1] Inicializando conexión central de DB...");
        await connectionManager.initCentral();
        console.log("✅ Conexión inicializada con éxito.");

        // TEST 2: Intentar operaciones sin negocioId
        console.log("\n[TEST 2] Verificando Fail-Fast al omitir negocioId...");
        try {
            await clientesService.listarClientes(null);
            console.error("❌ ERROR: Listar clientes debió fallar por falta de negocioId");
            process.exit(1);
        } catch (err) {
            if (err.code === "MISSING_TENANT_ID") {
                console.log("✅ Correcto: Lanzó AppError MISSING_TENANT_ID (400/401).");
            } else {
                console.error("❌ ERROR inesperado:", err);
                process.exit(1);
            }
        }

        // TEST 3: Crear un cliente nuevo
        console.log("\n[TEST 3] Creando cliente de prueba en tenant ID", negocioId, "...");
        const nuevoCliente = await clientesService.crearCliente(negocioId, {
            nombre: "Cliente Audit Test",
            apellido: "SaaS",
            telefono: "+541100009999",
            email: "audit.test@lavanderia.com",
            direccion: "Av. Pruebas 123"
        });

        if (!nuevoCliente || !nuevoCliente.id || nuevoCliente.nombre !== "Cliente Audit Test") {
            console.error("❌ ERROR: Falla al crear cliente.", nuevoCliente);
            process.exit(1);
        }
        testClienteId = nuevoCliente.id;
        console.log("✅ Cliente creado exitosamente con ID:", testClienteId);

        // TEST 4: Obtener cliente por ID
        console.log("\n[TEST 4] Recuperando cliente por ID:", testClienteId, "...");
        const clienteObtenido = await clientesService.obtenerClientePorId(negocioId, testClienteId);
        if (clienteObtenido.id !== testClienteId) {
            console.error("❌ ERROR: El ID recuperado no coincide.");
            process.exit(1);
        }
        console.log("✅ Cliente recuperado correctamente. Saldo a favor inicial:", clienteObtenido.saldoAFavor);

        // TEST 5: Validar error al ajustar crédito sin concepto
        console.log("\n[TEST 5] Probando ajuste de crédito sin concepto (debe fallar)...");
        try {
            await clientesService.ajustarCreditoCliente(negocioId, testClienteId, { monto: 1500 });
            console.error("❌ ERROR: Ajuste de crédito debió fallar por falta de concepto");
            process.exit(1);
        } catch (err) {
            if (err.code === "MISSING_CONCEPT") {
                console.log("✅ Correcto: Lanzó AppError MISSING_CONCEPT.");
            } else {
                console.error("❌ ERROR inesperado:", err);
                process.exit(1);
            }
        }

        // TEST 6: Realizar ajuste de crédito manual exitoso con concepto
        console.log("\n[TEST 6] Realizando ajuste de crédito manual con concepto...");
        const estadoPostAjuste = await clientesService.ajustarCreditoCliente(negocioId, testClienteId, {
            monto: 2500.50,
            concepto: "Bonificación por auditoría de resiliencia"
        });

        if (estadoPostAjuste.resumen.saldoAFavor !== 2500.50) {
            console.error("❌ ERROR: El saldo a favor pos-ajuste no coincide. Obtenido:", estadoPostAjuste.resumen.saldoAFavor);
            process.exit(1);
        }
        console.log("✅ Crédito bonificado con éxito. Nuevo Saldo a Favor:", estadoPostAjuste.resumen.saldoAFavor);

        // TEST 7: Desactivar / Eliminar cliente de prueba
        console.log("\n[TEST 7] Limpiando datos: Eliminando cliente de prueba ID:", testClienteId, "...");
        const resEliminar = await clientesService.eliminarCliente(negocioId, testClienteId);
        console.log("✅ Respuesta de eliminación:", resEliminar.message);

        console.log("\n🎉 AUDITORÍA DE INTEGRACIÓN DEL MÓDULO DE CLIENTES COMPLETADA CON ÉXITO 100%!");
        process.exit(0);

    } catch (error) {
        console.error("\n💥 FALLO EN LA AUDITORÍA DE CLIENTES:", error);
        if (testClienteId) {
            try {
                await clientesService.eliminarCliente(negocioId, testClienteId);
            } catch (e) {}
        }
        process.exit(1);
    }
}

runAuditTests();

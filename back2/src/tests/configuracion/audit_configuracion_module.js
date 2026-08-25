import "dotenv/config";
import { connectionManager } from "../../models/connectionManager.js";
import { configuracionService } from "../../modules/configuracion/services/configuracion.service.js";
import { mercadopagoService } from "../../modules/configuracion/services/mercadopago.service.js";
import { AppError } from "../../utils/appError.js";

async function runConfiguracionAudit() {
    console.log("🚀 INICIANDO AUDITORÍA Y PRUEBAS DE INTEGRACIÓN DEL MÓDULO DE CONFIGURACIÓN...\n");

    console.log("[TEST 1] Inicializando conexión central de DB...");
    await connectionManager.initCentral();
    console.log("✅ Conexión inicializada con éxito.\n");

    const negocioId = 13; // Negocio activo de prueba

    console.log("[TEST 2] Verificando Fail-Fast para negocio inexistente...");
    try {
        await configuracionService.getConfiguracion(999999);
        console.error("❌ FALLO: Debería haber lanzado AppError 404 para negocio inexistente.");
        process.exit(1);
    } catch (err) {
        if (err instanceof AppError && err.statusCode === 404 && err.code === "BUSINESS_NOT_FOUND") {
            console.log("✅ Correcto: Lanzó AppError 404 (BUSINESS_NOT_FOUND).\n");
        } else {
            console.error("❌ FALLO: Lanzó error inesperado:", err);
            process.exit(1);
        }
    }

    console.log(`[TEST 3] Asegurando existencia del Negocio ID ${negocioId} en BD central...`);
    const { Negocio } = connectionManager.centralModels;
    let negocio = await Negocio.findByPk(negocioId);
    if (!negocio) {
        negocio = await Negocio.create({
            id: negocioId,
            razonSocial: "Lavandería Audit Test",
            cuit: "30-11223344-5",
            activo: true
        });
        console.log(`✅ Negocio ID ${negocioId} creado para auditoría.`);
    } else {
        console.log(`✅ Negocio ID ${negocioId} ya existe en BD central.`);
    }

    console.log("\n[TEST 4] Obtención de Configuración...");
    const config = await configuracionService.getConfiguracion(negocioId);
    console.log("✅ Configuración recuperada:", {
        id: config.id,
        razonSocial: config.razonSocial,
        colorPrincipal: config.colorPrincipal,
        simboloMoneda: config.simboloMoneda
    });

    console.log("\n[TEST 5] Actualizando Branding (razón social, colores)...");
    const updatedBranding = await configuracionService.actualizarConfiguracion(negocioId, {
        razonSocial: "Lavandería Octavio Velo",
        colorPrincipal: "#2563eb",
        colorSecundario: "#1e40af"
    });
    console.log("✅ Branding actualizado con éxito:", {
        razonSocial: updatedBranding.razonSocial,
        colorPrincipal: updatedBranding.colorPrincipal
    });

    console.log("\n[TEST 6] Verificando validación de Token Mercado Pago...");
    try {
        await mercadopagoService.validarMercadoPagoToken(negocioId, "inv");
        console.error("❌ FALLO: Debería haber rechazado token inválido.");
        process.exit(1);
    } catch (err) {
        if (err instanceof AppError && err.code === "INVALID_TOKEN") {
            console.log("✅ Correcto: Lanzó AppError INVALID_TOKEN (400).\n");
        } else {
            console.error("❌ FALLO: Lanzó error inesperado al validar MP:", err);
            process.exit(1);
        }
    }

    console.log("\n[TEST 7] Listando motivos de cancelación base en tenant DB...");
    const motivos = await configuracionService.listarMotivosCancelacion(negocioId);
    console.log(`✅ Motivos de cancelación recuperados correctamente (${motivos.length} motivos base).`);

    console.log("\n🎉 AUDITORÍA DE INTEGRACIÓN DEL MÓDULO DE CONFIGURACIÓN COMPLETADA CON ÉXITO 100%!");
    process.exit(0);
}

runConfiguracionAudit().catch((err) => {
    console.error("💥 FALLO EN LA AUDITORÍA DE CONFIGURACIÓN:", err);
    process.exit(1);
});

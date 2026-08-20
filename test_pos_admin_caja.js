import { cajasService } from './back2/src/modules/finanzas/services/cajas.service.js';

async function auditCaja() {
  console.log("=== INICIANDO AUDITORÍA CRUZADA Y PRUEBAS DE CAJA POS ===");
  const negocioId = 13;

  try {
    // 1. Obtener caja actual
    console.log(`1. Consultando caja actual para Negocio ID: ${negocioId}...`);
    const cajaInicial = await cajasService.obtenerCajaActual(negocioId);
    console.log("Caja obtenida:", {
      id: cajaInicial.id,
      estado: cajaInicial.estado,
      montoInicial: cajaInicial.montoInicial,
      efectivoEsperado: cajaInicial.efectivoEsperadoEnVivo
    });

    // 2. Si la caja estaba abierta, probar cerrarla primero o probar apertura
    if (cajaInicial.estado === "ABIERTA") {
      console.log("2. Cerrando caja activa existente para probar flujo completo...");
      await cajasService.cerrarCaja(negocioId, cajaInicial.id, { efectivoReal: cajaInicial.efectivoEsperadoEnVivo || 0 });
      console.log("Caja cerrada con éxito.");
    }

    // 3. Probar Apertura de Caja
    console.log("3. Ejecutando Apertura de Caja con $15,000 iniciales...");
    const cajaNueva = await cajasService.abrirCaja(negocioId, { montoInicial: 15000, observaciones: "Apertura test POS" });
    console.log("¡Caja abierta exitosamente! Estado:", cajaNueva.estado, "ID:", cajaNueva.id);

    // 4. Probar Arqueo y Cierre
    console.log("4. Ejecutando Cierre de Turno POS / Arqueo...");
    const cajaCerrada = await cajasService.cerrarCaja(negocioId, cajaNueva.id, { efectivoReal: 15000 });
    console.log("¡Cierre exitoso! Estado final:", cajaCerrada.estado);

    console.log("=== AUDITORÍA FINALIZADA SIN ERRORES ===");
    process.exit(0);
  } catch (error) {
    console.error("❌ ERROR EN AUDITORÍA DE CAJA:", error);
    process.exit(1);
  }
}

auditCaja();

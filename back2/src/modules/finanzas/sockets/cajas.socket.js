import { getIO } from "../../../socket.js";

class CajasSocket {
    // Emite evento cuando un cajero abre un nuevo turno de caja
    emitirCajaAbierta(negocioId, caja) {
        if (!negocioId || !caja) return;
        getIO().to(`tenant_${negocioId}`).emit("caja:apertura", {
            idCaja: caja.idCaja || caja.id,
            montoInicial: caja.montoInicial || caja.montoInicialEfectivo || 0,
            fechaApertura: caja.fechaApertura || new Date().toISOString(),
            usuarioCajero: caja.usuarioCajero || "Cajero",
            timestamp: new Date().toISOString()
        });
    }

    // Emite evento cuando un cajero cierra el turno de caja
    emitirCajaCerrada(negocioId, caja) {
        if (!negocioId || !caja) return;
        getIO().to(`tenant_${negocioId}`).emit("caja:cierre", {
            idCaja: caja.idCaja || caja.id,
            efectivoReal: caja.efectivoReal || caja.montoFinalEfectivoReal || 0,
            fechaCierre: caja.fechaCierre || new Date().toISOString(),
            timestamp: new Date().toISOString()
        });
    }

    // Emite evento cuando se registra un gasto o egreso de dinero en vivo
    emitirGastoRegistrado(negocioId, gasto) {
        if (!negocioId || !gasto) return;
        getIO().to(`tenant_${negocioId}`).emit("gasto:registrado", {
            id: gasto.id,
            montoTotal: gasto.montoTotal || gasto.monto,
            categoria: gasto.categoria?.nombre || gasto.categoriaId || "General",
            descripcion: gasto.descripcion || "Egreso de caja",
            timestamp: new Date().toISOString()
        });
    }
}

export const cajasSocket = new CajasSocket();

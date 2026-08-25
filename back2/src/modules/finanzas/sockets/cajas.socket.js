import { getIO } from "../../../socket.js";

class CajasSocket {
    // Emite evento cuando un cajero abre un nuevo turno de caja
    emitirCajaAbierta(negocioId, caja) {
        if (!negocioId || !caja) return;
        getIO().to(`tenant_${negocioId}`).emit("caja:apertura", {
            idCaja: caja.idCaja,
            empleadoId: caja.usuarioId,
            abierta: true,
            montoInicial: caja.montoInicial,
            fechaApertura: caja.fechaApertura,
            timestamp: new Date().toISOString()
        });
    }

    // Emite evento cuando un cajero cierra el turno de caja
    emitirCajaCerrada(negocioId, caja) {
        if (!negocioId || !caja) return;
        getIO().to(`tenant_${negocioId}`).emit("caja:cierre", {
            idCaja: caja.idCaja,
            empleadoId: caja.usuarioId,
            abierta: false,
            efectivoReal: caja.efectivoReal,
            fechaCierre: caja.fechaCierre,
            timestamp: new Date().toISOString()
        });
    }

    // Emite evento cuando se registra un gasto o egreso de dinero en vivo
    emitirGastoRegistrado(negocioId, gasto) {
        if (!negocioId || !gasto) return;
        getIO().to(`tenant_${negocioId}`).emit("gasto:registrado", {
            id: gasto.id,
            montoTotal: gasto.montoTotal ? parseFloat(gasto.montoTotal) : parseFloat(gasto.monto),
            categoria: gasto.categoria?.nombre ? gasto.categoria.nombre : null,
            descripcion: gasto.descripcion ? gasto.descripcion : null,
            timestamp: new Date().toISOString()
        });
    }
}

export const cajasSocket = new CajasSocket();

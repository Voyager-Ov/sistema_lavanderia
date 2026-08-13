import { getIO } from "../../../socket.js";

class PedidosSocket {
    // Emite evento cuando se crea un nuevo pedido para actualizar POS y Kanban en vivo
    emitirPedidoCreado(negocioId, pedido) {
        if (!negocioId || !pedido) return;
        getIO().to(`tenant_${negocioId}`).emit("pedido:creado", {
            pedidoId: pedido.numeroPedido || pedido.id,
            codigoSeguimiento: pedido.codigoSeguimiento,
            cliente: pedido.cliente?.nombre || pedido.nombreClienteFactura || "Cliente",
            estado: pedido.estado || "PENDIENTE",
            total: pedido.total || 0,
            timestamp: new Date().toISOString()
        });
    }

    // Emite evento cuando cambia el estado de un pedido (Tablero Kanban de Planta)
    emitirEstadoCambiado(negocioId, pedido, nuevoEstado) {
        if (!negocioId || !pedido) return;
        const estadoVal = nuevoEstado || pedido.estado;
        
        // Emisión a la sala del negocio (POS / Admin / Planta)
        getIO().to(`tenant_${negocioId}`).emit("pedido:estado_cambiado", {
            pedidoId: pedido.numeroPedido || pedido.id,
            codigoSeguimiento: pedido.codigoSeguimiento,
            nuevoEstado: estadoVal,
            timestamp: new Date().toISOString()
        });

        // Emisión a la sala de tracking público del cliente final
        if (pedido.codigoSeguimiento) {
            this.emitirTrackingActualizado(pedido.codigoSeguimiento, {
                codigoSeguimiento: pedido.codigoSeguimiento,
                estado: estadoVal,
                mensaje: this._getMensajePorEstado(estadoVal)
            });
        }
    }

    // Emite evento directo a la pantalla de Live Tracking del cliente final
    emitirTrackingActualizado(codigoSeguimiento, data) {
        if (!codigoSeguimiento) return;
        getIO().to(`tracking_${codigoSeguimiento}`).emit("tracking:actualizado", {
            codigoSeguimiento,
            estado: data.estado,
            mensaje: data.mensaje || "Estado actualizado",
            timestamp: new Date().toISOString()
        });
    }

    _getMensajePorEstado(estado) {
        switch (estado) {
            case "PENDIENTE": return "Tu pedido ha sido recibido y está en cola de lavado.";
            case "EN_PROCESO": return "Tu prenda está siendo lavada y secada en nuestras instalaciones.";
            case "LISTO_PARA_RETIRAR": return "¡Tu pedido está listo! Podés pasar a retirarlo por la sucursal.";
            case "ENTREGADO": return "Pedido entregado exitosamente. ¡Gracias por confiar en nosotros!";
            case "CANCELADO": return "El pedido ha sido cancelado.";
            default: return "Estado de pedido actualizado.";
        }
    }
}

export const pedidosSocket = new PedidosSocket();

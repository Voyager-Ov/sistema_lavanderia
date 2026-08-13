import { getIO } from "../../../socket.js";

class RrhhSocket {
    // Emite evento cuando un empleado cambia su estado de habilitación / alta
    emitirEstadoEmpleadoCambiado(negocioId, empleado) {
        if (!negocioId || !empleado) return;
        getIO().to(`tenant_${negocioId}`).emit("empleado:estado_cambiado", {
            empleadoId: empleado.id,
            nombre: empleado.nombre,
            activo: empleado.activo,
            timestamp: new Date().toISOString()
        });
    }
}

export const rrhhSocket = new RrhhSocket();

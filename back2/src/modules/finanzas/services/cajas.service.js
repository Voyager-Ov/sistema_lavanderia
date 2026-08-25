import { connectionManager } from "../../../models/connectionManager.js";
import { AppError } from "../../../utils/appError.js";
import { cajasSocket } from "../sockets/cajas.socket.js";

class CajasService {

    async _getModels(negocioId) {
        const tenantDb = await connectionManager.getTenantDb(negocioId);
        return tenantDb.models;
    }

    // Formatea una caja para cumplir con la interfaz completa de CajaActual del frontend
    _formatCaja(caja) {
        const plain = caja.get ? caja.get({ plain: true }) : caja;

        let totalIngresosEnVivo = 0;
        let totalEgresosEnVivo = 0;
        let totalIngresosEfectivo = 0;
        let totalIngresosDigitales = 0;
        let totalEgresosEfectivo = 0;
        let totalEgresosDigitales = 0;

        const pagos = [];
        const gastos = [];
        const metodoMap = {};

        if (plain.movimientos && Array.isArray(plain.movimientos)) {
            for (const mov of plain.movimientos) {
                const montoVal = parseFloat(mov.monto) || 0;
                const isIngreso = mov.tipoMovimiento?.toLowerCase().includes("ingreso") || mov.tipoMovimiento?.toLowerCase().includes("venta") || montoVal > 0;
                const absMonto = Math.abs(montoVal);

                const metodoObj = mov.metodoPago ? mov.metodoPago : { nombre: "Efectivo", esFijo: true };
                const metodoNombre = metodoObj.nombre ? metodoObj.nombre : "Efectivo";
                const metodoId = metodoObj.id ? metodoObj.id : null;
                const isEfectivo = metodoObj.esFijo !== false && !metodoNombre.toLowerCase().includes("transferencia") && !metodoNombre.toLowerCase().includes("mercadopago") && !metodoNombre.toLowerCase().includes("tarjeta");

                if (!metodoMap[metodoNombre]) {
                    metodoMap[metodoNombre] = {
                        metodoPagoId: metodoId,
                        nombre: metodoNombre,
                        ingresos: 0,
                        egresos: 0
                    };
                }

                if (isIngreso) {
                    totalIngresosEnVivo += absMonto;
                    metodoMap[metodoNombre].ingresos += absMonto;

                    if (isEfectivo) {
                        totalIngresosEfectivo += absMonto;
                    } else {
                        totalIngresosDigitales += absMonto;
                    }

                    pagos.push({
                        id: mov.id,
                        monto: absMonto,
                        estado: "COMPLETADO",
                        createdAt: mov.fechaHora || mov.createdAt,
                        metodoPago: { id: metodoId, nombre: metodoNombre, esFijo: isEfectivo },
                        pedido: {
                            id: mov.id,
                            codigoSeguimiento: mov.observacion || `MOV-${mov.id}`,
                            total: absMonto,
                            estado: "ENTREGADO",
                            fechaRecepcion: mov.fechaHora || mov.createdAt
                        }
                    });
                } else {
                    totalEgresosEnVivo += absMonto;
                    metodoMap[metodoNombre].egresos += absMonto;

                    if (isEfectivo) {
                        totalEgresosEfectivo += absMonto;
                    } else {
                        totalEgresosDigitales += absMonto;
                    }

                    gastos.push({
                        id: mov.id,
                        monto: absMonto,
                        categoria: "GASTO_GENERAL",
                        descripcion: mov.observacion || "Gasto de caja",
                        createdAt: mov.fechaHora || mov.createdAt,
                        metodoPago: { id: metodoId, nombre: metodoNombre, esFijo: isEfectivo }
                    });
                }
            }
        }

        const montoInicial = parseFloat(plain.montoInicialEfectivo) || 0;
        const efectivoEsperadoEnVivo = montoInicial + totalIngresosEfectivo - totalEgresosEfectivo;
        const totalesPorMetodo = Object.values(metodoMap);

        const isAbierta = plain.abierta === true || plain.estadoCaja === "Abierta" || plain.estado === "ABIERTA";

        const emp = plain.empleado;
        const empNombre = emp ? (emp.apellido ? `${emp.nombre} ${emp.apellido}` : emp.nombre) : "Empleado de Mostrador";

        return {
            id: plain.idCaja,
            idCaja: plain.idCaja,
            negocioId: plain.negocioId,
            usuarioId: plain.empleadoId,
            abierta: isAbierta,
            estado: isAbierta ? "ABIERTA" : "CERRADA",
            estadoCaja: isAbierta ? "Abierta" : "Cerrada",
            montoInicial,
            fechaApertura: plain.fechaHoraApertura || plain.createdAt,
            fechaCierre: plain.fechaHoraCierre,
            totalIngresosEnVivo,
            totalEgresosEnVivo,
            totalIngresosEfectivo,
            totalIngresosDigitales,
            totalEgresosEfectivo,
            totalEgresosDigitales,
            efectivoEsperado: efectivoEsperadoEnVivo,
            efectivoEsperadoEnVivo,
            efectivoReal: plain.montoFinalEfectivoReal,
            totalesPorMetodo,
            actividadTurno: [],
            usuario: emp ? {
                id: emp.id,
                nombre: empNombre,
                email: emp.email || null
            } : {
                id: plain.empleadoId,
                nombre: "Empleado de Mostrador",
                email: null
            },
            pagos,
            gastos
        };
    }

    // Obtener la caja activa actualmente del usuario autenticado
    async obtenerCajaActual(negocioId, empleadoId = null, incluirUltimaCerrada = false) {
        if (!negocioId) {
            throw new AppError("ID de negocio es requerido.", 400, "MISSING_TENANT_ID");
        }
        if (!empleadoId) {
            return null;
        }

        const { Caja, MovimientoCaja, MetodoPago, Empleado } = await this._getModels(negocioId);

        const includeModels = [
            {
                model: MovimientoCaja,
                as: "movimientos",
                include: [{ model: MetodoPago, as: "metodoPago" }]
            },
            {
                model: Empleado,
                as: "empleado"
            }
        ];

        // 1. Buscar la caja ABIERTA de ESTE empleado especifico
        const cajaAbierta = await Caja.findOne({
            where: { estadoCaja: "Abierta", empleadoId },
            include: includeModels,
            order: [["idCaja", "DESC"]]
        });

        if (cajaAbierta) {
            return this._formatCaja(cajaAbierta);
        }

        // 2. Solo si se solicita explicitamente la última caja cerrada del empleado para vistas de resumen
        if (incluirUltimaCerrada) {
            const ultimaCajaCerrada = await Caja.findOne({
                where: { empleadoId, estadoCaja: "Cerrada" },
                include: includeModels,
                order: [["idCaja", "DESC"]]
            });

            if (ultimaCajaCerrada) {
                return this._formatCaja(ultimaCajaCerrada);
            }
        }

        // Si el usuario no tiene una caja abierta a su nombre, retorna NULL
        return null;
    }

    // Obtener todas las cajas abiertas activas del negocio (Para vista de Administrador)
    async obtenerCajasAbiertas(negocioId) {
        if (!negocioId) {
            throw new AppError("ID de negocio es requerido.", 400, "MISSING_TENANT_ID");
        }
        const { Caja, MovimientoCaja, MetodoPago, Empleado } = await this._getModels(negocioId);

        const cajasAbiertas = await Caja.findAll({
            where: { estadoCaja: "Abierta" },
            include: [
                {
                    model: MovimientoCaja,
                    as: "movimientos",
                    include: [{ model: MetodoPago, as: "metodoPago" }]
                },
                {
                    model: Empleado,
                    as: "empleado"
                }
            ],
            order: [["idCaja", "DESC"]]
        });

        return cajasAbiertas.map(c => this._formatCaja(c));
    }

    // Abrir un nuevo turno de caja por usuario/empleado
    async abrirCaja(negocioId, data) {
        if (!negocioId) {
            throw new AppError("ID de negocio es requerido.", 400, "MISSING_TENANT_ID");
        }
        const { Caja, Empleado } = await this._getModels(negocioId);

        const empleadoId = data.empleadoId;
        if (!empleadoId) {
            throw new AppError("No se ha identificado el empleado para abrir el turno de caja.", 400, "MISSING_EMPLOYEE_ID");
        }

        const cajaAbierta = await Caja.findOne({ where: { estadoCaja: "Abierta", empleadoId } });
        if (cajaAbierta) {
            throw new AppError("Ya posees un turno de caja abierto actualmente.", 400, "CASH_REGISTER_ALREADY_OPEN");
        }

        const montoInicial = parseFloat(data.montoInicial);
        if (isNaN(montoInicial) || montoInicial < 0) {
            throw new AppError("El monto inicial de caja debe ser mayor o igual a cero.", 400, "INVALID_INITIAL_AMOUNT");
        }

        const observacionApertura = data.observacionApertura ? String(data.observacionApertura).trim() : null;

        const nuevaCaja = await Caja.create({
            montoInicialEfectivo: montoInicial,
            estadoCaja: "Abierta",
            observacionApertura,
            fechaHoraApertura: new Date(),
            empleadoId,
            negocioId
        });

        const cajaConRelaciones = await Caja.findOne({
            where: { idCaja: nuevaCaja.idCaja },
            include: [{ model: Empleado, as: "empleado" }]
        });

        const formattedApertura = this._formatCaja(cajaConRelaciones || nuevaCaja);
        cajasSocket.emitirCajaAbierta(negocioId, formattedApertura);
        return formattedApertura;
    }

    // Cerrar el turno de caja activo de forma segura por usuario u operador
    async cerrarCaja(negocioId, idCaja, data, empleadoId = null, isGlobalAdmin = false) {
        if (!negocioId) {
            throw new AppError("ID de negocio es requerido.", 400, "MISSING_TENANT_ID");
        }
        const { Caja, MovimientoCaja, MetodoPago } = await this._getModels(negocioId);

        let caja = null;
        if (idCaja === "actual") {
            caja = await Caja.findOne({
                where: { estadoCaja: "Abierta", ...(empleadoId ? { empleadoId } : {}) },
                include: [{
                    model: MovimientoCaja,
                    as: "movimientos",
                    include: [{ model: MetodoPago, as: "metodoPago" }]
                }],
                order: [["idCaja", "DESC"]]
            });
        } else {
            caja = await Caja.findOne({
                where: { idCaja },
                include: [{
                    model: MovimientoCaja,
                    as: "movimientos",
                    include: [{ model: MetodoPago, as: "metodoPago" }]
                }]
            });
        }

        if (!caja) {
            throw new AppError("Caja no encontrada para cerrar.", 404, "CASH_REGISTER_NOT_FOUND");
        }

        // Si no es Administrador global, verificar que la caja a cerrar pertenezca al usuario autenticado
        if (!isGlobalAdmin && empleadoId && Number(caja.empleadoId) !== Number(empleadoId)) {
            throw new AppError("No posees permisos para cerrar la caja de otro operador.", 403, "FORBIDDEN");
        }

        if (caja.estadoCaja === "Cerrada") {
            return this._formatCaja(caja);
        }

        const efectivoReal = parseFloat(data.efectivoReal);
        if (isNaN(efectivoReal) || efectivoReal < 0) {
            throw new AppError("El efectivo real debe ser mayor o igual a cero.", 400, "INVALID_FINAL_AMOUNT");
        }

        const observacionCierre = data.observacionCierre ? String(data.observacionCierre).trim() : null;

        await caja.update({
            estadoCaja: "Cerrada",
            montoFinalEfectivoReal: efectivoReal,
            fechaHoraCierre: new Date(),
            observacionCierre
        });

        const formattedCierre = this._formatCaja(caja);
        cajasSocket.emitirCajaCerrada(negocioId, formattedCierre);
        return formattedCierre;
    }

    // Historial de cajas
    async obtenerHistorialCajas(negocioId, query = {}) {
        if (!negocioId) {
            throw new AppError("ID de negocio es requerido.", 400, "MISSING_TENANT_ID");
        }
        const { Caja, MovimientoCaja, MetodoPago } = await this._getModels(negocioId);

        const limit = parseInt(query.limit) || 20;
        const offset = parseInt(query.offset) || 0;

        const where = {};
        if (query.empleadoId) {
            where.empleadoId = query.empleadoId;
        }

        let count = 0;
        let rows = [];

        try {
            const res = await Caja.findAndCountAll({
                where,
                include: [{
                    model: MovimientoCaja,
                    as: "movimientos",
                    include: [{ model: MetodoPago, as: "metodoPago" }]
                }],
                limit,
                offset,
                order: [["idCaja", "DESC"]]
            });
            count = res.count;
            rows = res.rows;
        } catch (err) {
            count = await Caja.count({ where });
            rows = await Caja.findAll({
                where,
                include: [{
                    model: MovimientoCaja,
                    as: "movimientos",
                    include: [{ model: MetodoPago, as: "metodoPago" }]
                }],
                limit,
                offset,
                order: [["idCaja", "DESC"]]
            });
        }

        const items = rows.map(c => this._formatCaja(c));

        return {
            total: count,
            items
        };
    }

    // Obtener caja por ID
    async obtenerCajaPorId(negocioId, idCaja) {
        if (!negocioId) {
            throw new AppError("ID de negocio es requerido.", 400, "MISSING_TENANT_ID");
        }
        const { Caja, MovimientoCaja, MetodoPago } = await this._getModels(negocioId);

        const caja = await Caja.findOne({
            where: { idCaja },
            include: [{
                model: MovimientoCaja,
                as: "movimientos",
                include: [{ model: MetodoPago, as: "metodoPago" }]
            }]
        });

        if (!caja) {
            throw new AppError("Caja no encontrada.", 404, "CASH_REGISTER_NOT_FOUND");
        }

        return this._formatCaja(caja);
    }
}

export const cajasService = new CajasService();

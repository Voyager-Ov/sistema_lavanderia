import { Op } from "sequelize";
import { connectionManager } from "../../../models/connectionManager.js";
import { AppError } from "../../../utils/appError.js";

function isPedidoCancelado(p) {
    if (!p) return false;
    const est = typeof p.estado === "object" ? p.estado?.nombre : p.estado;
    if (!est) return false;
    return est.toString().toUpperCase().includes("CANCELAD");
}

// Regla de Negocio Única: Un pedido es DEUDA únicamente si fue ENTREGADO y NO FUE COBRADO
function isPedidoEntregadoEImpago(p) {
    if (!p || p.cobrado) return false;
    const est = typeof p.estado === "object" ? p.estado?.nombre : p.estado;
    if (!est) return false;
    const estUpper = est.toString().toUpperCase();
    if (estUpper.includes("CANCELAD")) return false;
    return estUpper.includes("ENTREGADO") || estUpper.includes("COMPLETADO");
}

class ClientesService {

    async _getModels(negocioId) {
        const tenantDb = await connectionManager.getTenantDb(negocioId);
        return tenantDb.models;
    }

    // Listar clientes con paginación, búsqueda por nombre/teléfono/email y ordenamiento
    async listarClientes(negocioId, query = {}) {
        if (!negocioId) {
            throw new AppError("ID de negocio es requerido.", 400, "MISSING_TENANT_ID");
        }
        const { Cliente, CuentaCorriente, Pedido, DetallePedido } = await this._getModels(negocioId);

        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 50;
        const offset = (page - 1) * limit;

        const where = {};

        // Filtro por término de búsqueda (nombre, teléfono o email)
        if (query.search && query.search.trim() !== "") {
            const searchVal = query.search.trim();
            const searchOp = process.env.NODE_ENV === "test" ? Op.like : Op.iLike;
            where[Op.or] = [
                { nombre: { [searchOp]: `%${searchVal}%` } },
                { apellido: { [searchOp]: `%${searchVal}%` } },
                { telefono: { [searchOp]: `%${searchVal}%` } },
                { email: { [searchOp]: `%${searchVal}%` } }
            ];
        }

        const sortBy = query.sortBy || "id";
        const sortOrder = (query.sortOrder || "DESC").toUpperCase();

        const { count, rows } = await Cliente.findAndCountAll({
            where,
            include: [
                { model: CuentaCorriente, as: "cuentaCorriente", attributes: ["saldo"], required: false },
                { 
                    model: Pedido, 
                    as: "pedidos", 
                    attributes: ["numeroPedido", "total", "costoEnvio", "cobrado", "estado"], 
                    where: { cobrado: false, estado: { [Op.notLike]: "%CANCELAD%" } }, 
                    include: [
                        {
                            model: DetallePedido,
                            as: "detalles",
                            attributes: ["cantidad", "precioHistorico"]
                        }
                    ],
                    required: false 
                }
            ],
            limit,
            offset,
            order: [[sortBy, sortOrder]]
        });

        const totalPages = Math.ceil(count / limit) || 1;

        const formattedItems = rows.map(cl => {
            const plain = cl.get({ plain: true });
            // Deuda Única: Solo pedidos entregados e impagos
            const pedidosDeuda = (plain.pedidos || []).filter(p => isPedidoEntregadoEImpago(p));
            
            const totalDeudaImpaga = pedidosDeuda.reduce((acc, p) => {
                let subtotalItems = 0;
                if (p.detalles && Array.isArray(p.detalles)) {
                    subtotalItems = p.detalles.reduce((sub, d) => {
                        const precio = parseFloat(d.precioHistorico) || 0;
                        const cant = parseInt(d.cantidad) || 1;
                        return sub + (precio * cant);
                    }, 0);
                }
                const costoEnvio = parseFloat(p.costoEnvio) || 0;
                const finalTotal = parseFloat(p.total) > 0 ? parseFloat(p.total) : (subtotalItems + costoEnvio);
                return acc + finalTotal;
            }, 0);

            const saldoAFavor = parseFloat(plain.cuentaCorriente?.saldo) || 0;
            
            return {
                ...plain,
                activo: plain.activo !== undefined && plain.activo !== null ? plain.activo : true,
                saldoDeuda: totalDeudaImpaga,
                saldoAFavor,
                pedidosImpagosCount: pedidosDeuda.length,
                cuentaCorriente: {
                    saldo: saldoAFavor,
                    saldoDeuda: totalDeudaImpaga
                }
            };
        });

        return {
            items: formattedItems,
            meta: {
                totalItems: count,
                total: count,
                totalPages,
                currentPage: page,
                itemsPerPage: limit
            }
        };
    }

    // Obtener cliente por ID con deuda calculada y pedidos
    async obtenerClientePorId(negocioId, id) {
        if (!negocioId) {
            throw new AppError("ID de negocio es requerido.", 400, "MISSING_TENANT_ID");
        }
        const { Cliente, CuentaCorriente, Pedido, DetallePedido, Servicio } = await this._getModels(negocioId);

        const cliente = await Cliente.findOne({
            where: { id },
            include: [
                { model: CuentaCorriente, as: "cuentaCorriente" },
                { 
                    model: Pedido, 
                    as: "pedidos", 
                    include: [
                        {
                            model: DetallePedido,
                            as: "detalles",
                            include: [{ model: Servicio, as: "servicio" }]
                        }
                    ],
                    order: [["numeroPedido", "DESC"]] 
                }
            ]
        });

        if (!cliente) {
            throw new AppError("Cliente no encontrado", 404, "CLIENT_NOT_FOUND");
        }

        const plain = cliente.get({ plain: true });

        // Formatear pedidos asegurando total correcto calculado a partir de detalles si es 0
        const pedidosFormatted = (plain.pedidos || []).map(p => {
            let subtotalItems = 0;
            if (p.detalles && Array.isArray(p.detalles)) {
                subtotalItems = p.detalles.reduce((acc, d) => {
                    const precio = parseFloat(d.precioHistorico) || 0;
                    const cant = parseInt(d.cantidad) || 1;
                    return acc + (precio * cant);
                }, 0);
            }
            const costoEnvio = parseFloat(p.costoEnvio) || 0;
            const finalTotal = parseFloat(p.total) > 0 ? parseFloat(p.total) : (subtotalItems + costoEnvio);

            return {
                ...p,
                total: finalTotal,
                detallesCount: p.detalles ? p.detalles.length : 0
            };
        });
        
        // Deuda Única: Pedidos entregados e impagos
        const pedidosDeuda = pedidosFormatted.filter(p => isPedidoEntregadoEImpago(p));
        const totalDeuda = pedidosDeuda.reduce((sum, p) => sum + (parseFloat(p.total) || 0), 0);

        // Importe de pedidos impagos aún en taller (para información del local sin radicar deuda)
        const impagosTaller = pedidosFormatted.filter(p => !p.cobrado && !isPedidoCancelado(p) && !isPedidoEntregadoEImpago(p));
        const totalTaller = impagosTaller.reduce((sum, p) => sum + (parseFloat(p.total) || 0), 0);

        const saldoAFavor = parseFloat(plain.cuentaCorriente?.saldo) || 0;

        return {
            ...plain,
            pedidos: pedidosFormatted,
            activo: plain.activo !== undefined && plain.activo !== null ? plain.activo : true,
            saldoDeuda: totalDeuda,
            saldoAFavor,
            saldoCuentaCorriente: saldoAFavor,
            montoEnTaller: totalTaller,
            pedidosImpagosCount: pedidosDeuda.length,
            cuentaCorriente: {
                saldo: saldoAFavor,
                saldoDeuda: totalDeuda
            }
        };
    }

    // Obtener lista de pedidos impagos de un cliente para cobro
    async obtenerPedidosImpagosCliente(negocioId, clienteId, options = {}) {
        if (!negocioId) {
            throw new AppError("ID de negocio es requerido.", 400, "MISSING_TENANT_ID");
        }
        const { Cliente, Pedido, DetallePedido, Servicio } = await this._getModels(negocioId);
        const t = options.transaction;

        const cliente = await Cliente.findByPk(clienteId, { transaction: t });
        if (!cliente) {
            throw new AppError("Cliente no encontrado", 404, "CLIENT_NOT_FOUND");
        }

        const pedidosImpagosRaw = await Pedido.findAll({
            where: {
                clienteId,
                cobrado: false,
                estado: { [Op.notLike]: "%CANCELAD%" }
            },
            include: [
                {
                    model: DetallePedido,
                    as: "detalles",
                    include: [{ model: Servicio, as: "servicio" }]
                }
            ],
            order: [["numeroPedido", "DESC"]],
            transaction: t
        });

        const impagosFormatted = pedidosImpagosRaw
            .filter(p => !p.cobrado && !isPedidoCancelado(p))
            .map(p => {
                let subtotalItems = 0;
                if (p.detalles && Array.isArray(p.detalles)) {
                    subtotalItems = p.detalles.reduce((acc, d) => {
                        const precio = parseFloat(d.precioHistorico) || 0;
                        const cant = parseInt(d.cantidad) || 1;
                        return acc + (precio * cant);
                    }, 0);
                }
                const costoEnvio = parseFloat(p.costoEnvio) || 0;
                const finalTotal = parseFloat(p.total) > 0 ? parseFloat(p.total) : (subtotalItems + costoEnvio);
                const esEntregado = isPedidoEntregadoEImpago(p);

                return {
                    id: p.numeroPedido,
                    numeroPedido: p.numeroPedido,
                    codigoSeguimiento: `LAV-${p.numeroPedido}`,
                    total: finalTotal,
                    estado: p.estado,
                    esDeuda: esEntregado,
                    fechaRecepcion: p.fechaHoraPedido || p.fechaHoraCreacion || p.createdAt,
                    createdAt: p.fechaHoraCreacion || p.createdAt,
                    detalles: p.detalles,
                    itemsCount: p.detalles ? p.detalles.length : 0
                };
            });

        const totalDeudaExigible = impagosFormatted.filter(p => p.esDeuda).reduce((sum, p) => sum + p.total, 0);
        const totalImpagos = impagosFormatted.reduce((sum, p) => sum + p.total, 0);

        return {
            clienteId: parseInt(clienteId),
            clienteNombre: `${cliente.nombre} ${cliente.apellido || ""}`.trim(),
            totalDeuda: totalDeudaExigible,
            totalImpagos,
            pedidosImpagos: impagosFormatted
        };
    }

    // Realizar cobro de pedidos seleccionados del cliente (Delegado al servicio único transaccional pagosService.procesarCobro)
    async cobrarPedidosCliente(negocioId, clienteId, data) {
        if (!negocioId) {
            throw new AppError("ID de negocio es requerido.", 400, "MISSING_TENANT_ID");
        }
        const { pagosService } = await import("../../finanzas/services/pagos.service.js");
        
        const res = await pagosService.procesarCobro(negocioId, {
            ...data,
            clienteId: parseInt(clienteId)
        });

        const resImpagos = await this.obtenerPedidosImpagosCliente(negocioId, clienteId);

        return {
            clienteId: parseInt(clienteId),
            pedidosCobradosCount: res.pedidosCobradosCount,
            totalMontoCobrado: res.totalMontoCobrado,
            creditoConsumidoTotal: res.creditoConsumidoTotal,
            saldoRestanteDeuda: resImpagos.totalDeuda,
            cobros: res.cobros
        };
    }

    // Crear cliente nuevo
    async crearCliente(negocioId, data) {
        if (!negocioId) {
            throw new AppError("ID de negocio es requerido.", 400, "MISSING_TENANT_ID");
        }
        const { Cliente, CuentaCorriente } = await this._getModels(negocioId);

        if (!data.nombre || data.nombre.trim() === "") {
            throw new AppError("El nombre del cliente es obligatorio.", 400, "MISSING_CLIENT_NAME");
        }

        const nuevoCliente = await Cliente.create({
            nombre: data.nombre.trim(),
            apellido: data.apellido ? data.apellido.trim() : "",
            telefono: data.telefono ? data.telefono.trim() : null,
            email: data.email ? data.email.trim() : null,
            direccion: data.direccion ? data.direccion.trim() : null,
            negocioId
        });

        // Crear su cuenta corriente con saldo inicial 0
        await CuentaCorriente.create({
            clienteId: nuevoCliente.id,
            saldo: 0
        });

        return this.obtenerClientePorId(negocioId, nuevoCliente.id);
    }

    // Actualizar cliente
    async actualizarCliente(negocioId, id, data) {
        if (!negocioId) {
            throw new AppError("ID de negocio es requerido.", 400, "MISSING_TENANT_ID");
        }
        const { Cliente } = await this._getModels(negocioId);

        const cliente = await Cliente.findByPk(id);
        if (!cliente) {
            throw new AppError("Cliente no encontrado para actualizar.", 404, "CLIENT_NOT_FOUND");
        }

        const updateFields = {};
        if (data.nombre !== undefined) updateFields.nombre = data.nombre.trim();
        if (data.apellido !== undefined) updateFields.apellido = data.apellido.trim();
        if (data.telefono !== undefined) updateFields.telefono = data.telefono.trim();
        if (data.email !== undefined) updateFields.email = data.email.trim();
        if (data.direccion !== undefined) updateFields.direccion = data.direccion.trim();

        await cliente.update(updateFields);

        return this.obtenerClientePorId(negocioId, id);
    }

    // Desactivar / Eliminar cliente
    async eliminarCliente(negocioId, id) {
        if (!negocioId) {
            throw new AppError("ID de negocio es requerido.", 400, "MISSING_TENANT_ID");
        }
        const { Cliente } = await this._getModels(negocioId);

        const cliente = await Cliente.findByPk(id);
        if (!cliente) {
            throw new AppError("Cliente no encontrado para eliminar.", 404, "CLIENT_NOT_FOUND");
        }

        await cliente.destroy();
        return { message: "Cliente eliminado correctamente." };
    }

    // Obtener Posición Financiera y Estado de Cuenta Corriente (CU-CLI-05)
    async obtenerEstadoCuenta(negocioId, clienteId) {
        const impagosData = await this.obtenerPedidosImpagosCliente(negocioId, clienteId);
        const clienteData = await this.obtenerClientePorId(negocioId, clienteId);

        const pedidosImpagos = impagosData.pedidosImpagos || [];
        
        const deudaExigible = pedidosImpagos
            .filter(p => (typeof p.estado === 'object' ? p.estado?.nombre : p.estado)?.toString()?.toUpperCase()?.includes("ENTREGADO"))
            .reduce((sum, p) => sum + p.total, 0);

        const deudaNoExigible = pedidosImpagos
            .filter(p => !(typeof p.estado === 'object' ? p.estado?.nombre : p.estado)?.toString()?.toUpperCase()?.includes("ENTREGADO"))
            .reduce((sum, p) => sum + p.total, 0);

        const saldoAFavor = Math.max(0, parseFloat(clienteData.saldoCuentaCorriente || 0));

        return {
            resumen: {
                deudaTotal: impagosData.totalDeuda,
                deudaExigible,
                deudaNoExigible,
                saldoAFavor
            },
            pedidosDeuda: pedidosImpagos,
            creditosDisponibles: saldoAFavor > 0 ? [{ id: 1, montoDisponible: saldoAFavor }] : [],
            movimientos: clienteData.movimientos || []
        };
    }

    // Obtener Movimientos de Cuenta Corriente (CU-CLI-05)
    async obtenerMovimientosCuenta(negocioId, clienteId) {
        const estadoCuenta = await this.obtenerEstadoCuenta(negocioId, clienteId);
        return {
            clienteId: parseInt(clienteId),
            movimientos: estadoCuenta.movimientos
        };
    }

    // Ajustar Crédito / Saldo a Favor del Cliente (CU-CLI-07)
    async ajustarCreditoCliente(negocioId, clienteId, data) {
        const { CuentaCorriente, MovimientoCuentaCorriente } = await this._getModels(negocioId);
        const monto = parseFloat(data.monto || 0);
        const concepto = data.concepto || data.observaciones || "Ajuste manual de crédito";

        if (isNaN(monto) || monto <= 0) {
            throw new AppError("El monto del ajuste debe ser un valor numérico positivo.", 400, "INVALID_AMOUNT");
        }

        let cc = await CuentaCorriente.findOne({ where: { clienteId } });
        if (!cc) {
            cc = await CuentaCorriente.create({ clienteId, saldo: 0 });
        }

        // Un crédito a favor suma al saldo positivo en la cuenta corriente
        const nuevoSaldo = parseFloat(cc.saldo || 0) + monto;
        await cc.update({ saldo: nuevoSaldo });

        if (MovimientoCuentaCorriente) {
            await MovimientoCuentaCorriente.create({
                cuentaCorrienteId: cc.id,
                monto: monto,
                saldoResultante: nuevoSaldo,
                concepto,
                fechaHora: new Date()
            }).catch(() => {});
        }

        return this.obtenerEstadoCuenta(negocioId, clienteId);
    }
}

export const clientesService = new ClientesService();

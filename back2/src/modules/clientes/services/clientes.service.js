import { Op } from "sequelize";
import { connectionManager } from "../../../models/connectionManager.js";
import { AppError } from "../../../utils/appError.js";

function isPedidoCancelado(p) {
    if (!p) return false;
    const est = typeof p.estado === "object" ? p.estado.nombre : p.estado;
    if (!est) return false;
    return est.toString().toUpperCase().includes("CANCELAD");
}

// Regla de Negocio Única: Un pedido es DEUDA únicamente si fue ENTREGADO y NO FUE COBRADO
function isPedidoEntregadoEImpago(p) {
    if (!p) return false;
    if (p.cobrado) return false;
    const est = typeof p.estado === "object" ? p.estado.nombre : p.estado;
    if (!est) return false;
    const estUpper = est.toString().toUpperCase();
    if (estUpper.includes("CANCELAD")) return false;
    return estUpper.includes("ENTREGADO") || estUpper.includes("COMPLETADO");
}

class ClientesService {

    async _getModels(negocioId) {
        const tenantDb = await connectionManager.getTenantDb(negocioId);
        return tenantDb;
    }

    // Listar clientes con paginación, búsqueda por nombre/teléfono/email y ordenamiento
    async listarClientes(negocioId, query = {}) {
        if (!negocioId) {
            throw new AppError("No se ha identificado el negocio activo en la sesión.", 400, "MISSING_TENANT_ID");
        }
        const tenantDb = await this._getModels(negocioId);
        const { Cliente, CuentaCorriente, Pedido, DetallePedido } = tenantDb.models;

        const page = parseInt(query.page, 10);
        const limit = parseInt(query.limit, 10);
        const offset = (page - 1) * limit;

        const where = {};

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

        const sortBy = query.sortBy;
        const sortOrder = query.sortOrder;

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

        const totalPages = Math.ceil(count / limit);

        const formattedItems = rows.map(cl => {
            const plain = cl.get({ plain: true });
            const plainPedidos = plain.pedidos ? plain.pedidos : [];
            const pedidosDeuda = plainPedidos.filter(p => isPedidoEntregadoEImpago(p));
            
            const totalDeudaImpaga = pedidosDeuda.reduce((acc, p) => {
                let subtotalItems = 0;
                if (p.detalles && Array.isArray(p.detalles)) {
                    subtotalItems = p.detalles.reduce((sub, d) => {
                        const precio = parseFloat(d.precioHistorico);
                        const cant = parseInt(d.cantidad, 10);
                        return sub + (precio * cant);
                    }, 0);
                }
                const finalTotal = parseFloat(p.total) > 0 ? parseFloat(p.total) : subtotalItems;
                return acc + finalTotal;
            }, 0);

            const saldoAFavor = plain.cuentaCorriente ? parseFloat(plain.cuentaCorriente.saldo) : 0;
            
            return {
                ...plain,
                activo: Boolean(plain.activo),
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
            throw new AppError("No se ha identificado el negocio activo en la sesión.", 400, "MISSING_TENANT_ID");
        }
        const tenantDb = await this._getModels(negocioId);
        const { Cliente, CuentaCorriente, MovimientoCuenta, Pedido, DetallePedido, Servicio } = tenantDb.models;

        const cliente = await Cliente.findOne({
            where: { id },
            include: [
                { 
                    model: CuentaCorriente, 
                    as: "cuentaCorriente",
                    include: [{ model: MovimientoCuenta, as: "movimientos" }]
                },
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
            throw new AppError("Cliente no encontrado.", 404, "CLIENT_NOT_FOUND");
        }

        const plain = cliente.get({ plain: true });

        const plainPedidos = plain.pedidos ? plain.pedidos : [];

        const pedidosFormatted = plainPedidos.map(p => {
            let subtotalItems = 0;
            if (p.detalles && Array.isArray(p.detalles)) {
                subtotalItems = p.detalles.reduce((acc, d) => {
                    const precio = parseFloat(d.precioHistorico);
                    const cant = parseInt(d.cantidad, 10);
                    return acc + (precio * cant);
                }, 0);
            }
            const finalTotal = parseFloat(p.total) > 0 ? parseFloat(p.total) : subtotalItems;

            return {
                ...p,
                total: finalTotal,
                detallesCount: p.detalles ? p.detalles.length : 0
            };
        });
        
        const pedidosDeuda = pedidosFormatted.filter(p => isPedidoEntregadoEImpago(p));
        const totalDeuda = pedidosDeuda.reduce((sum, p) => sum + parseFloat(p.total), 0);

        const impagosTaller = pedidosFormatted.filter(p => !p.cobrado && !isPedidoCancelado(p) && !isPedidoEntregadoEImpago(p));
        const totalTaller = impagosTaller.reduce((sum, p) => sum + parseFloat(p.total), 0);

        const saldoAFavor = plain.cuentaCorriente ? parseFloat(plain.cuentaCorriente.saldo) : 0;
        const movimientos = plain.cuentaCorriente && plain.cuentaCorriente.movimientos ? plain.cuentaCorriente.movimientos : [];

        return {
            ...plain,
            pedidos: pedidosFormatted,
            activo: Boolean(plain.activo),
            saldoDeuda: totalDeuda,
            saldoAFavor,
            saldoCuentaCorriente: saldoAFavor,
            montoEnTaller: totalTaller,
            pedidosImpagosCount: pedidosDeuda.length,
            movimientos,
            cuentaCorriente: {
                saldo: saldoAFavor,
                saldoDeuda: totalDeuda,
                movimientos
            }
        };
    }

    // Obtener lista de pedidos impagos de un cliente para cobro
    async obtenerPedidosImpagosCliente(negocioId, clienteId, options = {}) {
        if (!negocioId) {
            throw new AppError("No se ha identificado el negocio activo en la sesión.", 400, "MISSING_TENANT_ID");
        }
        const tenantDb = await this._getModels(negocioId);
        const { Cliente, Pedido, DetallePedido, Servicio } = tenantDb.models;
        const t = options.transaction;

        const cliente = await Cliente.findByPk(clienteId, { transaction: t });
        if (!cliente) {
            throw new AppError("Cliente no encontrado.", 404, "CLIENT_NOT_FOUND");
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
                        const precio = parseFloat(d.precioHistorico);
                        const cant = parseInt(d.cantidad, 10);
                        return acc + (precio * cant);
                    }, 0);
                }
                const finalTotal = parseFloat(p.total) > 0 ? parseFloat(p.total) : subtotalItems;
                const esEntregado = isPedidoEntregadoEImpago(p);

                return {
                    id: p.numeroPedido,
                    numeroPedido: p.numeroPedido,
                    codigoSeguimiento: `LAV-${p.numeroPedido}`,
                    total: finalTotal,
                    estado: p.estado,
                    esDeuda: esEntregado,
                    fechaRecepcion: p.fechaHoraPedido,
                    createdAt: p.createdAt,
                    detalles: p.detalles,
                    itemsCount: p.detalles ? p.detalles.length : 0
                };
            });

        const totalDeudaExigible = impagosFormatted.filter(p => p.esDeuda).reduce((sum, p) => sum + p.total, 0);
        const totalImpagos = impagosFormatted.reduce((sum, p) => sum + p.total, 0);

        const apellidoStr = cliente.apellido ? cliente.apellido : "";
        const clienteNombreCompleto = apellidoStr ? `${cliente.nombre} ${apellidoStr}` : cliente.nombre;

        return {
            clienteId: parseInt(clienteId, 10),
            clienteNombre: clienteNombreCompleto,
            totalDeuda: totalDeudaExigible,
            totalImpagos,
            pedidosImpagos: impagosFormatted
        };
    }

    // Realizar cobro de pedidos seleccionados del cliente
    async cobrarPedidosCliente(negocioId, clienteId, data) {
        if (!negocioId) {
            throw new AppError("No se ha identificado el negocio activo en la sesión.", 400, "MISSING_TENANT_ID");
        }
        const { pagosService } = await import("../../finanzas/services/pagos.service.js");
        
        const res = await pagosService.procesarCobro(negocioId, {
            ...data,
            clienteId: parseInt(clienteId, 10)
        });

        const resImpagos = await this.obtenerPedidosImpagosCliente(negocioId, clienteId);

        return {
            clienteId: parseInt(clienteId, 10),
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
            throw new AppError("No se ha identificado el negocio activo en la sesión.", 400, "MISSING_TENANT_ID");
        }
        if (!data.nombre || typeof data.nombre !== "string" || data.nombre.trim() === "") {
            throw new AppError("El nombre del cliente es obligatorio.", 400, "MISSING_CLIENT_NAME");
        }

        const tenantDb = await this._getModels(negocioId);
        const { Cliente, CuentaCorriente } = tenantDb.models;

        const nuevoCliente = await Cliente.create({
            nombre: data.nombre.trim(),
            apellido: data.apellido && typeof data.apellido === "string" ? data.apellido.trim() : "",
            telefono: data.telefono && typeof data.telefono === "string" ? data.telefono.trim() : null,
            email: data.email && typeof data.email === "string" ? data.email.trim() : null,
            direccion: data.direccion && typeof data.direccion === "string" ? data.direccion.trim() : null,
            negocioId
        });

        await CuentaCorriente.create({
            clienteId: nuevoCliente.id,
            saldo: 0
        });

        return this.obtenerClientePorId(negocioId, nuevoCliente.id);
    }

    // Actualizar cliente
    async actualizarCliente(negocioId, id, data) {
        if (!negocioId) {
            throw new AppError("No se ha identificado el negocio activo en la sesión.", 400, "MISSING_TENANT_ID");
        }
        const tenantDb = await this._getModels(negocioId);
        const { Cliente } = tenantDb.models;

        const cliente = await Cliente.findByPk(id);
        if (!cliente) {
            throw new AppError("Cliente no encontrado.", 404, "CLIENT_NOT_FOUND");
        }

        const updateFields = {};
        if (data.nombre !== undefined && typeof data.nombre === "string") updateFields.nombre = data.nombre.trim();
        if (data.apellido !== undefined && typeof data.apellido === "string") updateFields.apellido = data.apellido.trim();
        if (data.telefono !== undefined && typeof data.telefono === "string") updateFields.telefono = data.telefono.trim();
        if (data.email !== undefined && typeof data.email === "string") updateFields.email = data.email.trim();
        if (data.direccion !== undefined && typeof data.direccion === "string") updateFields.direccion = data.direccion.trim();

        await cliente.update(updateFields);

        return this.obtenerClientePorId(negocioId, id);
    }

    // Desactivar / Eliminar cliente
    async eliminarCliente(negocioId, id) {
        if (!negocioId) {
            throw new AppError("No se ha identificado el negocio activo en la sesión.", 400, "MISSING_TENANT_ID");
        }
        const tenantDb = await this._getModels(negocioId);
        const { Cliente } = tenantDb.models;

        const cliente = await Cliente.findByPk(id);
        if (!cliente) {
            throw new AppError("Cliente no encontrado.", 404, "CLIENT_NOT_FOUND");
        }

        await cliente.destroy();
        return { message: "Cliente eliminado correctamente." };
    }

    // Obtener Posición Financiera y Estado de Cuenta Corriente (CU-CLI-05)
    async obtenerEstadoCuenta(negocioId, clienteId) {
        const impagosData = await this.obtenerPedidosImpagosCliente(negocioId, clienteId);
        const clienteData = await this.obtenerClientePorId(negocioId, clienteId);

        const pedidosImpagos = impagosData.pedidosImpagos;
        
        const deudaExigible = pedidosImpagos
            .filter(p => {
                const est = typeof p.estado === 'object' ? p.estado.nombre : p.estado;
                return est.toString().toUpperCase().includes("ENTREGADO");
            })
            .reduce((sum, p) => sum + p.total, 0);

        const deudaNoExigible = pedidosImpagos
            .filter(p => {
                const est = typeof p.estado === 'object' ? p.estado.nombre : p.estado;
                return !est.toString().toUpperCase().includes("ENTREGADO");
            })
            .reduce((sum, p) => sum + p.total, 0);

        const saldoAFavor = Math.max(0, parseFloat(clienteData.saldoCuentaCorriente));
        const apellidoStr = clienteData.apellido ? clienteData.apellido : "";
        const clienteNombreCompleto = apellidoStr ? `${clienteData.nombre} ${apellidoStr}` : clienteData.nombre;

        return {
            cliente: {
                id: clienteData.id,
                nombre: clienteNombreCompleto,
                telefono: clienteData.telefono,
                email: clienteData.email
            },
            resumen: {
                deudaTotal: impagosData.totalDeuda,
                deudaExigible,
                deudaNoExigible,
                saldoAFavor
            },
            pedidosDeuda: pedidosImpagos,
            creditosDisponibles: saldoAFavor > 0 ? [{ id: 1, montoDisponible: saldoAFavor }] : [],
            movimientos: clienteData.movimientos
        };
    }

    // Obtener Movimientos de Cuenta Corriente (CU-CLI-05)
    async obtenerMovimientosCuenta(negocioId, clienteId) {
        const estadoCuenta = await this.obtenerEstadoCuenta(negocioId, clienteId);
        return {
            clienteId: parseInt(clienteId, 10),
            movimientos: estadoCuenta.movimientos,
            meta: {
                totalItems: estadoCuenta.movimientos.length,
                totalPages: 1,
                currentPage: 1
            }
        };
    }

    // Ajustar Crédito / Saldo a Favor del Cliente (CU-CLI-07)
    async ajustarCreditoCliente(negocioId, clienteId, data) {
        if (data.monto === undefined || data.monto === null) {
            throw new AppError("El campo 'monto' es obligatorio.", 400, "MISSING_AMOUNT");
        }
        const monto = parseFloat(data.monto);
        if (isNaN(monto) || monto <= 0) {
            throw new AppError("El monto del ajuste debe ser un valor numérico positivo.", 400, "INVALID_AMOUNT");
        }

        if (!data.concepto || typeof data.concepto !== "string" || data.concepto.trim() === "") {
            throw new AppError("El campo 'concepto' es obligatorio.", 400, "MISSING_CONCEPT");
        }
        const concepto = data.concepto.trim();

        const tenantDb = await this._getModels(negocioId);
        const { CuentaCorriente, MovimientoCuenta } = tenantDb.models;

        const transaction = await tenantDb.sequelize.transaction();

        try {
            let cc = await CuentaCorriente.findOne({ where: { clienteId }, transaction });
            if (!cc) {
                cc = await CuentaCorriente.create({ clienteId, saldo: 0 }, { transaction });
            }

            const nuevoSaldo = parseFloat(cc.saldo) + monto;
            await cc.update({ saldo: nuevoSaldo }, { transaction });

            if (MovimientoCuenta) {
                await MovimientoCuenta.create({
                    cuentaCorrienteId: cc.id,
                    monto: monto,
                    tipoMovimiento: "Crédito",
                    descripcion: concepto,
                    fechaHora: new Date()
                }, { transaction });
            }

            await transaction.commit();
        } catch (err) {
            await transaction.rollback();
            throw err;
        }

        return this.obtenerEstadoCuenta(negocioId, clienteId);
    }
}

export const clientesService = new ClientesService();

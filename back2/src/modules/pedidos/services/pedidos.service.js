import { Op } from "sequelize";
import { connectionManager } from "../../../models/connectionManager.js";
import { AppError } from "../../../utils/appError.js";
import { parseDateRange } from "../../../utils/date.util.js";
import { pedidosSocket } from "../sockets/pedidos.socket.js";

class PedidosService {

    async _getModels(negocioId) {
        const tenantDb = await connectionManager.getTenantDb(negocioId);
        return tenantDb.models;
    }

    // Formatea un pedido agregando totales calculados, estado actual y alineado con interfaces SSOT
    _formatPedido(pedido) {
        const plain = pedido.get ? pedido.get({ plain: true }) : pedido;

        // Calcular total del pedido sumando ítems
        let subtotalItems = 0;
        const detallesFormatted = [];

        if (plain.detalles && Array.isArray(plain.detalles)) {
            for (const item of plain.detalles) {
                const precioUnitario = Number(item.precioHistorico);
                const cant = Number(item.cantidad);
                if (isNaN(precioUnitario) || precioUnitario < 0 || isNaN(cant) || cant <= 0) {
                     throw new AppError(`Detalle corrupto (ID: ${item.id}).`, 500, "INVALID_DATA");
                }
                const subtotal = precioUnitario * cant;
                subtotalItems += subtotal;

                detallesFormatted.push({
                    id: item.id,
                    servicioId: item.servicioId,
                    cantidad: cant,
                    precioUnitario,
                    subtotal,
                    servicio: item.servicio ? {
                        id: item.servicio.id,
                        nombre: item.servicio.nombre,
                        imagenUrl: item.servicio.imagenUrl
                    } : null
                });
            }
        }

        const costoEnvio = 0; // Regla Modelo Mostrador
        const total = subtotalItems + costoEnvio;

        // Calcular total cobrado
        let totalCobrado = 0;
        if (plain.cobros && Array.isArray(plain.cobros)) {
            for (const cobro of plain.cobros) {
                 const m = Number(cobro.montoAbonado !== null && cobro.montoAbonado !== undefined ? cobro.montoAbonado : cobro.monto);
                 if (isNaN(m) || m < 0) throw new AppError(`Cobro corrupto (ID: ${cobro.id}).`, 500, "INVALID_DATA");
                 totalCobrado += m;
            }
        }

        const isCobradoFlag = !!plain.cobrado;
        const cobrado = isCobradoFlag || (totalCobrado >= total && total > 0);
        let estadoPago = "NO_PAGADO";
        if (cobrado) {
            estadoPago = "PAGADO";
            if (totalCobrado === 0) totalCobrado = total;
        } else if (totalCobrado > 0) {
            estadoPago = "PARCIAL";
        }

        // Estado actual (último cambio de estado) e historial mapeado para el frontend
        let estadoActual = plain.estado;
        if (!estadoActual) {
             throw new AppError(`El pedido #${plain.numeroPedido} tiene un estado nulo o corrupto.`, 500, "INVALID_STATE");
        }
        
        const cambiosEstadoFormatted = [];

        if (plain.cambiosEstado && Array.isArray(plain.cambiosEstado) && plain.cambiosEstado.length > 0) {
            const sortedCambios = [...plain.cambiosEstado].sort((a, b) => {
                if (!a.fechaHoraInicio || !b.fechaHoraInicio) {
                     throw new AppError(`Cambio de estado corrupto (falta fechaHoraInicio) en pedido #${plain.numeroPedido}.`, 500, "INVALID_DATA");
                }
                const timeA = new Date(a.fechaHoraInicio).getTime();
                const timeB = new Date(b.fechaHoraInicio).getTime();
                if (timeA !== timeB) return timeA - timeB;
                return a.id - b.id;
            });

            const ultimoCambio = sortedCambios[sortedCambios.length - 1];
            if (ultimoCambio && ultimoCambio.estado && ultimoCambio.estado.nombre) {
                estadoActual = ultimoCambio.estado.nombre;
            }

            for (let i = 0; i < sortedCambios.length; i++) {
                const ce = sortedCambios[i];
                const prev = i > 0 ? sortedCambios[i - 1] : null;
                cambiosEstadoFormatted.push({
                    id: ce.id,
                    estadoAnterior: prev && prev.estado ? prev.estado.nombre : null,
                    estadoNuevo: ce.estado ? ce.estado.nombre : "PENDIENTE",
                    comentario: ce.comentario || `Estado cambiado a ${ce.estado ? ce.estado.nombre : "PENDIENTE"}`,
                    fechaHoraInicio: ce.fechaHoraInicio
                });
            }
        } else {
            if (!plain.fechaHoraCreacion) throw new AppError("Falta fechaHoraCreacion en pedido.", 500, "INVALID_DATA");
            cambiosEstadoFormatted.push({
                id: 1,
                estadoAnterior: null,
                estadoNuevo: estadoActual,
                comentario: "Pedido recepcionado en sistema",
                fechaHoraInicio: plain.fechaHoraCreacion
            });
        }

        if (!plain.fechaHoraCreacion) throw new AppError("Falta fechaHoraCreacion en pedido.", 500, "INVALID_DATA");
        if (!plain.fechaHoraPedido) throw new AppError("Falta fechaHoraPedido (fecha de recepción real) en pedido.", 500, "INVALID_DATA");

        return {
            id: plain.numeroPedido,
            numeroPedido: plain.numeroPedido,
            negocioId: plain.negocioId,
            codigoSeguimiento: `LAV-${plain.numeroPedido}`,
            fechaHoraCreacion: plain.fechaHoraCreacion,
            fechaHoraPedido: plain.fechaHoraPedido,
            fechaHoraEntregaEstimada: plain.fechaHoraEntregaEstimada,
            observaciones: plain.observaciones,
            origen: plain.origen,
            costoEnvio,
            subtotal: subtotalItems,
            total,
            totalCobrado,
            saldoPendiente: cobrado ? 0 : Math.max(0, total - totalCobrado),
            cobrado,
            estadoPago,
            estado: estadoActual,
            ticketImpreso: plain.ticketImpreso,
            clienteId: plain.clienteId,
            cliente: plain.cliente,
            detalles: detallesFormatted,
            cambiosEstado: cambiosEstadoFormatted,
            cobros: plain.cobros,
            factura: plain.factura
        };
    }

    // Listar pedidos con paginación, filtros de cliente, estado, fechas y ordenamiento
    async listarPedidos(negocioId, query) {
        const { Pedido, Cliente, DetallePedido, Servicio, CambioEstadoPedido, Estado, Cobro } = await this._getModels(negocioId);

        let page = 1;
        if (query.page) {
            page = Number(query.page);
            if (isNaN(page) || page < 1) throw new AppError("Página inválida.", 400, "INVALID_PAGINATION");
        }

        let limit = 10;
        if (query.limit) {
            limit = Number(query.limit);
            if (isNaN(limit) || limit < 1) throw new AppError("Límite inválido.", 400, "INVALID_PAGINATION");
        }

        const offset = (page - 1) * limit;
        const where = {};

        // Filtro por número de pedido o nombre/teléfono de cliente
        if (query.search && query.search.trim() !== "") {
            const searchVal = query.search.trim();
            const searchNum = Number(searchVal);

            if (!isNaN(searchNum)) {
                where.numeroPedido = searchNum;
            } else {
                const searchOp = process.env.NODE_ENV === "test" ? Op.like : Op.iLike;
                where[Op.or] = [
                    { observaciones: { [searchOp]: `%${searchVal}%` } },
                    { "$cliente.nombre$": { [searchOp]: `%${searchVal}%` } },
                    { "$cliente.telefono$": { [searchOp]: `%${searchVal}%` } }
                ];
            }
        }

        // Filtro por rango de fechas (usar fechaInicio y fechaFin como canónicos)
        if (query.fechaInicio || query.fechaFin) {
            const dateClause = parseDateRange(query.fechaInicio, query.fechaFin);
            if (dateClause) {
                where[Op.or] = [
                    { fechaHoraCreacion: dateClause },
                    { fechaHoraPedido: dateClause },
                    { createdAt: dateClause }
                ];
            }
        }

        // Ordenamiento
        let sortBy = "numeroPedido";
        if (query.sortBy === "numeroPedido" || query.sortBy === "fechaHoraEntregaEstimada" || query.sortBy === "createdAt" || query.sortBy === "total" || query.sortBy === "estado" || query.sortBy === "codigoSeguimiento") {
            sortBy = query.sortBy;
        }

        const sortOrder = query.sortOrder ? query.sortOrder.toUpperCase() : "DESC";

        const { count, rows } = await Pedido.findAndCountAll({
            where,
            include: [
                { model: Cliente, as: "cliente", attributes: ["id", "nombre", "telefono", "email"] },
                {
                    model: DetallePedido,
                    as: "detalles",
                    include: [{ model: Servicio, as: "servicio", attributes: ["id", "nombre", "imagenUrl"] }]
                },
                {
                    model: CambioEstadoPedido,
                    as: "cambiosEstado",
                    include: [{ model: Estado, as: "estado", attributes: ["id", "nombre"] }]
                },
                { model: Cobro, as: "cobros" }
            ],
            limit,
            offset,
            order: [[sortBy, sortOrder]],
            distinct: true
        });

        const formattedItems = rows.map(p => this._formatPedido(p));

        // Filtrar por estado
        let filteredItems = formattedItems;
        if (query.estado && query.estado !== "ALL") {
            filteredItems = formattedItems.filter(p => p.estado === query.estado);
        }

        const totalPages = Math.max(1, Math.ceil(count / limit));

        return {
            items: filteredItems, // Maintained items here for pagination container wrapper in Next.js
            meta: {
                totalItems: count,
                total: count,
                totalPages,
                currentPage: page,
                itemsPerPage: limit
            }
        };
    }

    // Obtener estadísticas de pedidos
    async obtenerEstadisticas(negocioId) {
        const { Pedido, CambioEstadoPedido, Estado } = await this._getModels(negocioId);

        const totalPedidos = await Pedido.count();
        
        const pedidos = await Pedido.findAll({
            include: [{
                model: CambioEstadoPedido,
                as: "cambiosEstado",
                include: [{ model: Estado, as: "estado", attributes: ["nombre"] }]
            }]
        });

        let pendientes = 0;
        let enProceso = 0;
        let listos = 0;
        let entregados = 0;

        for (const p of pedidos) {
            const formatted = this._formatPedido(p);
            if (formatted.estadoActual === "PENDIENTE") pendientes++;
            if (formatted.estadoActual === "EN_PROCESO") enProceso++;
            if (formatted.estadoActual === "LISTO" || formatted.estadoActual === "LISTO_PARA_RETIRAR") listos++;
            if (formatted.estadoActual === "ENTREGADO") entregados++;
        }

        return {
            total: totalPedidos,
            pendientes,
            enProceso,
            listos,
            entregados
        };
    }

    // Obtener detalle de un pedido por su número / ID
    async obtenerPedidoPorNumero(negocioId, numeroPedido) {
        const { Pedido, Cliente, DetallePedido, Servicio, CambioEstadoPedido, Estado, Cobro, Factura } = await this._getModels(negocioId);

        const pedido = await Pedido.findOne({
            where: { numeroPedido },
            include: [
                { model: Cliente, as: "cliente" },
                {
                    model: DetallePedido,
                    as: "detalles",
                    include: [{ model: Servicio, as: "servicio" }]
                },
                {
                    model: CambioEstadoPedido,
                    as: "cambiosEstado",
                    include: [{ model: Estado, as: "estado" }]
                },
                { model: Cobro, as: "cobros" },
                { model: Factura, as: "factura" }
            ]
        });

        if (!pedido) {
            throw new AppError("Pedido no encontrado", 404, "ORDER_NOT_FOUND");
        }

        return this._formatPedido(pedido);
    }

    // Crear un nuevo pedido con sus ítems y estado inicial
    async crearPedido(negocioId, data) {
        const { Pedido, DetallePedido, Servicio, Cliente, Estado, CambioEstadoPedido } = await this._getModels(negocioId);

        const itemsList = data.detalles;
        if (!Array.isArray(itemsList) || itemsList.length === 0) {
            throw new AppError("El pedido debe contener al menos un detalle (servicio).", 400, "MISSING_ORDER_ITEMS");
        }

        let clienteId = data.clienteId;
        if (!clienteId && data.clienteNombre) {
            const nuevoCliente = await Cliente.create({
                nombre: data.clienteNombre,
                telefono: data.clienteTelefono || null,
                direccion: data.direccionEntrega || null,
                negocioId
            });
            clienteId = nuevoCliente.id;
        }

        const fechaHoraPedido = data.fechaHoraPedido ? new Date(data.fechaHoraPedido) : new Date();

        if (!data.origen) {
            throw new AppError("El origen del pedido (origen) es obligatorio.", 400, "MISSING_ORIGIN");
        }

        // Crear registro principal del pedido
        const nuevoPedido = await Pedido.create({
            clienteId: clienteId || null,
            origen: data.origen,
            observaciones: data.observaciones || null,
            direccionEntrega: data.direccionEntrega || null,
            costoEnvio: 0,
            fechaHoraCreacion: new Date(),
            fechaHoraPedido: fechaHoraPedido,
            fechaHoraEntregaEstimada: data.fechaHoraEntregaEstimada ? new Date(data.fechaHoraEntregaEstimada) : null,
            ticketImpreso: false,
            negocioId
        });

        // Insertar ítems y calcular subtotal total
        let subtotalTotal = 0;
        for (const item of itemsList) {
            const servicioId = item.servicioId;
            if (!servicioId) throw new AppError("Detalle de pedido sin ID de servicio.", 400, "INVALID_DATA");

            let precioUnitario = Number(item.precioUnitario);

            if (isNaN(precioUnitario)) {
                const srv = await Servicio.findByPk(servicioId);
                if (srv) {
                    precioUnitario = Number(srv.precioActual);
                } else {
                    throw new AppError(`Servicio ID ${servicioId} no encontrado.`, 404, "SERVICE_NOT_FOUND");
                }
            }

            const cant = Number(item.cantidad);
            if (isNaN(cant) || cant <= 0 || isNaN(precioUnitario) || precioUnitario < 0) {
                 throw new AppError("Detalle de pedido con cantidad o precio corrupto.", 400, "INVALID_DATA");
            }
            subtotalTotal += (precioUnitario * cant);

            await DetallePedido.create({
                pedidoNumeroPedido: nuevoPedido.numeroPedido,
                servicioId: servicioId,
                cantidad: cant,
                precioHistorico: precioUnitario
            });
        }

        await nuevoPedido.update({ subtotal: subtotalTotal, total: subtotalTotal });

        // Asignar estado inicial PENDIENTE
        let estadoInicial = await Estado.findOne({ where: { nombre: "PENDIENTE" } });
        if (!estadoInicial) {
            estadoInicial = await Estado.create({ nombre: "PENDIENTE", descripcion: "Pedido recepcionado", ambito: "Pedido" });
        }

        await CambioEstadoPedido.create({
            pedidoNumeroPedido: nuevoPedido.numeroPedido,
            estadoId: estadoInicial.id,
            fechaHoraInicio: new Date()
        });

        const res = await this.obtenerPedidoPorNumero(negocioId, nuevoPedido.numeroPedido);
        pedidosSocket.emitirPedidoCreado(negocioId, res);
        return res;
    }

    // Marcar ticket como impreso
    async marcarTicketImpreso(negocioId, numeroPedido) {
        const { Pedido } = await this._getModels(negocioId);

        const pedido = await Pedido.findByPk(numeroPedido);
        if (!pedido) {
            throw new AppError("Pedido no encontrado.", 404, "ORDER_NOT_FOUND");
        }

        await pedido.update({ ticketImpreso: true });
        return { message: "Ticket marcado como impreso correctamente." };
    }
}

export const pedidosService = new PedidosService();

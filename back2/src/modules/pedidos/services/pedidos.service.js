import { Op } from "sequelize";
import { connectionManager } from "../../../models/connectionManager.js";
import { AppError } from "../../../utils/appError.js";
import { pedidosSocket } from "../sockets/pedidos.socket.js";

class PedidosService {

    async _getModels(negocioId) {
        const tenantDb = await connectionManager.getTenantDb(negocioId);
        return tenantDb.models;
    }

    // Formatea un pedido agregando totales calculados, estado actual y alias para el frontend
    _formatPedido(pedido) {
        const plain = pedido.get ? pedido.get({ plain: true }) : pedido;

        // Calcular total del pedido sumando ítems
        let subtotalItems = 0;
        const itemsFormatted = [];

        if (plain.detalles && Array.isArray(plain.detalles)) {
            for (const item of plain.detalles) {
                const precioUnitario = parseFloat(item.precioHistorico) || 0;
                const cant = parseInt(item.cantidad) || 1;
                const subtotal = precioUnitario * cant;
                subtotalItems += subtotal;

                itemsFormatted.push({
                    id: item.id,
                    productoId: item.servicioId,
                    cantidad: cant,
                    precioUnitario,
                    subtotal,
                    producto: item.servicio ? {
                        id: item.servicio.id,
                        nombre: item.servicio.nombre,
                        imagenUrl: item.servicio.imagenUrl
                    } : null
                });
            }
        }

        const costoEnvio = parseFloat(plain.costoEnvio) || 0;
        const total = subtotalItems + costoEnvio;

        // Calcular total cobrado
        let totalCobrado = 0;
        if (plain.cobros && Array.isArray(plain.cobros)) {
            totalCobrado = plain.cobros.reduce((sum, cobro) => sum + (parseFloat(cobro.montoAbonado || cobro.monto) || 0), 0);
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
        let estadoActual = "PENDIENTE";
        const historialFormatted = [];

        if (plain.cambiosEstado && Array.isArray(plain.cambiosEstado) && plain.cambiosEstado.length > 0) {
            const ultimoCambio = plain.cambiosEstado[plain.cambiosEstado.length - 1];
            if (ultimoCambio.estado) {
                estadoActual = ultimoCambio.estado.nombre || estadoActual;
            }

            for (let i = 0; i < plain.cambiosEstado.length; i++) {
                const ce = plain.cambiosEstado[i];
                const prev = i > 0 ? plain.cambiosEstado[i - 1] : null;
                historialFormatted.push({
                    id: ce.id,
                    estadoAnterior: prev && prev.estado ? prev.estado.nombre : null,
                    estadoNuevo: ce.estado ? ce.estado.nombre : "PENDIENTE",
                    comentario: ce.comentario || `Estado cambiado a ${ce.estado ? ce.estado.nombre : "PENDIENTE"}`,
                    createdAt: ce.fechaHoraInicio || ce.createdAt || plain.fechaHoraCreacion
                });
            }
        } else {
            historialFormatted.push({
                id: 1,
                estadoAnterior: null,
                estadoNuevo: estadoActual,
                comentario: "Pedido recepcionado en sistema",
                createdAt: plain.fechaHoraCreacion || plain.createdAt
            });
        }

        const fechaPedidoVal = plain.fechaHoraPedido || plain.fechaHoraCreacion || plain.createdAt;

        return {
            id: plain.numeroPedido,
            numeroPedido: plain.numeroPedido,
            codigoSeguimiento: `LAV-${plain.numeroPedido}`,
            fechaHoraCreacion: plain.fechaHoraCreacion || plain.createdAt,
            fechaHoraPedido: fechaPedidoVal,
            fechaPedido: fechaPedidoVal,
            fechaRecepcion: fechaPedidoVal,
            fecha: fechaPedidoVal,
            createdAt: plain.fechaHoraCreacion || plain.createdAt,
            fechaEntregaEstimada: plain.fechaHoraEntregaEstimada,
            observaciones: plain.observaciones,
            notas: plain.observaciones,
            origen: plain.origen,
            costoEnvio,
            subtotalItems,
            total,
            totalCobrado,
            saldoPendiente: cobrado ? 0 : Math.max(0, total - totalCobrado),
            cobrado,
            estadoPago,
            estado: estadoActual,
            estadoActual,
            ticketImpreso: plain.ticketImpreso,
            clienteId: plain.clienteId,
            cliente: plain.cliente,
            items: itemsFormatted,
            detalles: plain.detalles,
            cambiosEstado: plain.cambiosEstado,
            historial: historialFormatted,
            cobros: plain.cobros,
            factura: plain.factura
        };
    }

    // Listar pedidos con paginación, filtros de cliente, estado, fechas y ordenamiento
    async listarPedidos(negocioId, query) {
        const { Pedido, Cliente, DetallePedido, Servicio, CambioEstadoPedido, Estado, Cobro } = await this._getModels(negocioId);

        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 10;
        const offset = (page - 1) * limit;

        const where = {};

        // Filtro por número de pedido o nombre/teléfono de cliente
        if (query.search && query.search.trim() !== "") {
            const searchVal = query.search.trim();
            const searchNum = parseInt(searchVal);

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

        // Filtro por rango de fechas de creación
        if (query.fechaDesde || query.fechaInicio || query.fechaHasta || query.fechaFin) {
            const desde = query.fechaDesde || query.fechaInicio;
            const hasta = query.fechaHasta || query.fechaFin;
            where.fechaHoraCreacion = {};
            if (desde) where.fechaHoraCreacion[Op.gte] = new Date(desde);
            if (hasta) where.fechaHoraCreacion[Op.lte] = new Date(hasta);
        }

        // Ordenamiento
        let sortBy = "numeroPedido";
        if (query.sortBy === "id" || query.sortBy === "numeroPedido") sortBy = "numeroPedido";
        else if (query.sortBy === "fechaEntregaEstimada" || query.sortBy === "fechaHoraEntregaEstimada") sortBy = "fechaHoraEntregaEstimada";
        else if (query.sortBy === "createdAt" || query.sortBy === "fechaHoraCreacion") sortBy = "createdAt";
        else if (query.sortBy === "total") sortBy = "total";
        else if (query.sortBy === "estado") sortBy = "estado";
        else if (query.sortBy === "codigoSeguimiento") sortBy = "codigoSeguimiento";

        const sortOrder = (query.sortOrder || "DESC").toUpperCase();

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

        // Filtrar por estado actual
        let filteredItems = formattedItems;
        if (query.estado && query.estado !== "ALL") {
            filteredItems = formattedItems.filter(p => p.estadoActual === query.estado || p.estado === query.estado);
        }

        const totalPages = Math.ceil(count / limit) || 1;

        return {
            items: filteredItems,
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

        const itemsList = data.items || data.detalles || [];
        if (!Array.isArray(itemsList) || itemsList.length === 0) {
            throw new AppError("El pedido debe contener al menos un ítem o servicio.", 400, "MISSING_ORDER_ITEMS");
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

        const fechaPedidoRaw = data.fechaHoraPedido || data.fechaPedido || data.fechaRecepcion;
        const fechaHoraPedido = fechaPedidoRaw ? new Date(fechaPedidoRaw) : new Date();

        // Crear registro principal del pedido
        const nuevoPedido = await Pedido.create({
            clienteId: clienteId || null,
            origen: data.origen || "MOSTRADOR",
            observaciones: data.observaciones || data.notas || null,
            direccionEntrega: data.direccionEntrega || null,
            costoEnvio: parseFloat(data.costoEnvio || 0),
            fechaHoraCreacion: new Date(),
            fechaHoraPedido: fechaHoraPedido,
            fechaHoraEntregaEstimada: data.fechaEntregaEstimada || data.fechaHoraEntregaEstimada ? new Date(data.fechaEntregaEstimada || data.fechaHoraEntregaEstimada) : null,
            ticketImpreso: false,
            negocioId
        });

        // Insertar ítems y calcular subtotal total
        let subtotalTotal = 0;
        for (const item of itemsList) {
            const servicioId = item.servicioId || item.productoId;
            let precioUnitario = item.precio || item.precioUnitario;

            if (!precioUnitario && servicioId) {
                const srv = await Servicio.findByPk(servicioId);
                if (srv) precioUnitario = srv.precioActual;
            }

            const cant = parseInt(item.cantidad || 1);
            const pr = parseFloat(precioUnitario || 0);
            subtotalTotal += (pr * cant);

            await DetallePedido.create({
                pedidoNumeroPedido: nuevoPedido.numeroPedido,
                servicioId: servicioId || null,
                cantidad: cant,
                precioHistorico: pr
            });
        }

        const costoEnvio = parseFloat(data.costoEnvio || 0);
        const totalFinalCalculado = subtotalTotal + costoEnvio;
        await nuevoPedido.update({ subtotal: subtotalTotal, total: totalFinalCalculado });

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

    // Cambiar estado de un pedido (Trazabilidad)
    async cambiarEstado(negocioId, numeroPedido, nuevoEstadoNombre) {
        const { Pedido, Estado, CambioEstadoPedido } = await this._getModels(negocioId);

        const pedido = await Pedido.findByPk(numeroPedido);
        if (!pedido) {
            throw new AppError("Pedido no encontrado para cambiar estado.", 404, "ORDER_NOT_FOUND");
        }

        let estado = await Estado.findOne({ where: { nombre: nuevoEstadoNombre } });
        if (!estado) {
            estado = await Estado.create({ nombre: nuevoEstadoNombre, descripcion: `Estado ${nuevoEstadoNombre}`, ambito: "Pedido" });
        }

        // Cerrar el cambio de estado previo
        const ultimoCambio = await CambioEstadoPedido.findOne({
            where: { pedidoNumeroPedido: numeroPedido, fechaHoraFin: null },
            order: [["id", "DESC"]]
        });

        if (ultimoCambio) {
            await ultimoCambio.update({ fechaHoraFin: new Date() });
        }

        // Registrar nuevo estado
        await CambioEstadoPedido.create({
            pedidoNumeroPedido: numeroPedido,
            estadoId: estado.id,
            fechaHoraInicio: new Date()
        });

        const res = await this.obtenerPedidoPorNumero(negocioId, numeroPedido);
        pedidosSocket.emitirEstadoCambiado(negocioId, res, nuevoEstadoNombre);
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

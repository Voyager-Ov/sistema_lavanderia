import { AppError } from "../../utils/errors.js";
import { models, sequelize } from "../../models/index.js";
import { generarCodigoSeguimiento } from "../../utils/codeGenerator.util.js";
import { getPaginationParams, getPagingData } from "../../utils/pagination.util.js";
import { Op } from "sequelize";
import { emitToTenant } from "../../socket/socket.js";
import { generarFacturaPedido } from "../integraciones/afip.service.js";
import crypto from "crypto";

export const crearPedido = async (negocioId, usuarioId, data) => {
    const { clienteId, items, fechaEntregaEstimada } = data;
    const t = await sequelize.transaction();
    try {
        // 1. Validar Cliente
        const cliente = await models.Cliente.findOne({ where: { id: clienteId, negocioId }, transaction: t });
        if (!cliente) {
            throw new AppError("Cliente no encontrado.", 404);
        }

        // 2. Extraer productos y calcular total real
        let totalCalculado = 0;
        const itemsParaCrear = [];

        for (const item of items) {
            const producto = await models.Producto.findOne({ where: { id: item.productoId, negocioId }, transaction: t });
            if (!producto) {
                throw new AppError(`Producto con ID ${item.productoId} no encontrado o no pertenece al negocio.`, 404);
            }

            const subtotal = parseFloat(producto.precioActual) * item.cantidad;
            totalCalculado += subtotal;

            itemsParaCrear.push({
                productoId: producto.id,
                cantidad: item.cantidad,
                precioUnitario: producto.precioActual, // Guardamos la foto del precio en este momento
                subtotal
            });
        }

        // 3. Crear Pedido Base
        const codigoSeguimiento = generarCodigoSeguimiento();
        const nuevoPedido = await models.Pedido.create({
            negocioId,
            clienteId,
            creadoPorId: usuarioId,
            estado: "PENDIENTE",
            codigoSeguimiento,
            total: totalCalculado,
            fechaEntregaEstimada: fechaEntregaEstimada || null
        }, { transaction: t });

        // 4. Crear Ítems
        for (const itemData of itemsParaCrear) {
            itemData.pedidoId = nuevoPedido.id;
        }
        await models.PedidoItem.bulkCreate(itemsParaCrear, { transaction: t });

        // 5. Crear Historial Inicial
        await models.HistorialPedido.create({
            pedidoId: nuevoPedido.id,
            usuarioId,
            estadoAnterior: null,
            estadoNuevo: "PENDIENTE",
            comentario: "Pedido creado en el sistema"
        }, { transaction: t });

        // 6. Impactar en Cuenta Corriente (Generar Deuda / DEBITO)
        const saldoAnterior = parseFloat(cliente.saldoCuentaCorriente || 0);
        const nuevoSaldo = saldoAnterior + totalCalculado;
        
        await models.MovimientoCuentaCorriente.create({
            clienteId,
            negocioId,
            pedidoId: nuevoPedido.id,
            tipoMovimiento: "DEBITO",
            monto: totalCalculado,
            saldoResultante: nuevoSaldo,
            comentario: `Deuda por Pedido #${codigoSeguimiento}`
        }, { transaction: t });

        await cliente.update({ saldoCuentaCorriente: nuevoSaldo }, { transaction: t });

        await t.commit();
        
        // Emitir evento por WebSockets
        emitToTenant(negocioId, "pedido_actualizado", {
            action: "CREATE",
            pedidoId: nuevoPedido.id
        });
        
        return nuevoPedido;
    } catch (error) {
        await t.rollback();
        console.error("❌ Error al crear pedido:", error);
        throw error;
    }
};

export const obtenerPedidos = async (negocioId, queryParams = {}) => {
    const { limit, offset, page } = getPaginationParams(queryParams);
    const { estado, clienteId, fechaInicio, fechaFin, search, sortBy, sortOrder } = queryParams;

    const where = { negocioId };

    if (estado) {
        where.estado = estado;
    }
    if (clienteId) {
        where.clienteId = clienteId;
    }
    if (fechaInicio && fechaFin) {
        const endDate = new Date(fechaFin);
        endDate.setUTCHours(23, 59, 59, 999);
        where.createdAt = {
            [Op.between]: [new Date(fechaInicio), endDate]
        };
    } else if (fechaInicio) {
        where.createdAt = {
            [Op.gte]: new Date(fechaInicio)
        };
    } else if (fechaFin) {
        const endDate = new Date(fechaFin);
        endDate.setUTCHours(23, 59, 59, 999);
        where.createdAt = {
            [Op.lte]: endDate
        };
    }

    const include = [
        { model: models.Cliente, as: "cliente", attributes: ["id", "nombre", "telefono"] },
        { model: models.Usuario, as: "creador", attributes: ["id", "nombre"] },
        { 
            model: models.PedidoItem, 
            as: "items", 
            include: [{ model: models.Producto, as: "producto", attributes: ["nombre"] }]
        },
        {
            model: models.Pago,
            as: "pago",
            include: [{ model: models.MetodoPago, as: "metodoPago", attributes: ["nombre"] }]
        }
    ];

    if (search) {
        // Buscamos primero los IDs de los clientes que coincidan
        const clientesCoincidentes = await models.Cliente.findAll({
            where: {
                negocioId,
                [Op.or]: [
                    sequelize.where(
                        sequelize.fn('LOWER', sequelize.col('nombre')),
                        'LIKE',
                        `%${search.toLowerCase()}%`
                    ),
                    { telefono: { [Op.like]: `%${search}%` } }
                ]
            },
            attributes: ["id"],
            raw: true
        });
        const clientesIds = clientesCoincidentes.map(c => c.id);

        where[Op.or] = [
            sequelize.where(
                sequelize.fn('LOWER', sequelize.col('codigoSeguimiento')),
                'LIKE',
                `%${search.toLowerCase()}%`
            ),
            { clienteId: { [Op.in]: clientesIds } }
        ];
    }

    // Determinar el ordenamiento
    let order = [["createdAt", "DESC"]];
    if (sortBy) {
        const direction = sortOrder && sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";
        
        // Manejar columnas de tablas relacionadas si es necesario
        if (sortBy === "cliente") {
            order = [[{ model: models.Cliente, as: "cliente" }, "nombre", direction]];
        } else if (sortBy === "creador") {
            order = [[{ model: models.Usuario, as: "creador" }, "nombre", direction]];
        } else {
            // Columnas directas de Pedido
            order = [[sortBy, direction]];
        }
    }

    const data = await models.Pedido.findAndCountAll({
        where,
        include,
        order,
        limit,
        offset,
        distinct: true // Necesario cuando hay includes y limit
    });

    return getPagingData(data, page, limit);
};

export const generarTicketHTML = async (negocioId, pedidoId) => {
    const pedido = await obtenerPedidoPorId(negocioId, pedidoId);

    if (pedido.estado === "CANCELADO") {
        throw new AppError("No se puede imprimir el ticket de un pedido cancelado.", 400);
    }

    const { cliente, items } = pedido;

    const fecha = new Date(pedido.createdAt).toLocaleString("es-AR", {
        timeZone: "America/Argentina/Buenos_Aires",
    });

    let itemsHtml = items.map(item => `
        <tr>
            <td style="padding: 4px 0;">${item.cantidad}x ${item.producto?.nombre || 'Item'}</td>
            <td style="padding: 4px 0; text-align: right;">$${parseFloat(item.subtotal).toLocaleString("es-AR")}</td>
        </tr>
    `).join("");

    return `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <title>Ticket ${pedido.codigoSeguimiento}</title>
            <style>
                body {
                    font-family: 'Courier New', Courier, monospace;
                    font-size: 12px;
                    width: 300px;
                    margin: 0 auto;
                    padding: 10px;
                    color: #000;
                }
                .text-center { text-align: center; }
                .text-right { text-align: right; }
                .font-bold { font-weight: bold; }
                .divider { border-bottom: 1px dashed #000; margin: 10px 0; }
                table { width: 100%; border-collapse: collapse; }
                @media print {
                    body { margin: 0; padding: 0; width: 100%; }
                }
            </style>
        </head>
        <body onload="window.print()">
            <div class="text-center font-bold" style="font-size: 16px;">SISTEMA LAVANDERÍA</div>
            <div class="text-center">Ticket de Pedido</div>
            <div class="divider"></div>
            
            <div><strong>Ticket:</strong> #${pedido.codigoSeguimiento}</div>
            <div><strong>Fecha:</strong> ${fecha}</div>
            <div><strong>Cliente:</strong> ${cliente?.nombre || 'Consumidor Final'}</div>
            ${cliente?.telefono ? `<div><strong>Teléfono:</strong> ${cliente.telefono}</div>` : ''}
            
            <div class="divider"></div>
            
            <table>
                <tbody>
                    ${itemsHtml}
                </tbody>
            </table>
            
            <div class="divider"></div>
            
            <table>
                <tr>
                    <td class="font-bold" style="font-size: 14px;">TOTAL</td>
                    <td class="font-bold text-right" style="font-size: 14px;">$${parseFloat(pedido.total).toLocaleString("es-AR")}</td>
                </tr>
            </table>
            
            <div class="divider"></div>
            <div class="text-center">¡Gracias por su confianza!</div>
            <div class="text-center" style="font-size: 10px; margin-top: 5px;">Conserve este ticket para retirar.</div>
        </body>
        </html>
    `;
};

export const generarFacturaElectronica = async (negocioId, pedidoId) => {
    const pedido = await obtenerPedidoPorId(negocioId, pedidoId);
    
    // Validaciones Estrictas
    if (pedido.estado === "CANCELADO") {
        throw new AppError("No se puede facturar un pedido cancelado.", 400);
    }

    if (pedido.facturado) {
        throw new AppError("Este pedido ya posee una factura emitida.", 400);
    }
    
    if (!pedido.cobrado) {
        throw new AppError("No se puede facturar un pedido que aún no ha sido cobrado.", 400);
    }
    
    // Aquí llamamos a la integración AFIP
    // El servicio AFIP ya tira errores (e.g., 400 "Configuración de AFIP está incompleta", 400 "No está activo")
    // por lo que este controlador es robusto frente a la falta de certificados
    
    const factura = await generarFacturaPedido(negocioId, pedido, pedido.cliente, null);
    
    // Guardamos el CAE y el Nro de comprobante en la tabla Pedido
    await pedido.update({ 
        facturado: true, 
        facturaCae: factura.cae, 
        facturaVtoCae: factura.vencimientoCae,
        facturaNro: factura.nroComprobante 
    });

    return factura;
};


export const obtenerPedidoPorId = async (negocioId, pedidoId) => {
    const pedido = await models.Pedido.findOne({
        where: { id: pedidoId, negocioId },
        include: [
            { model: models.Cliente, as: "cliente" },
            { 
                model: models.PedidoItem, 
                as: "items",
                include: [{ model: models.Producto, as: "producto", attributes: ["id", "nombre"] }]
            },
            { 
                model: models.HistorialPedido, 
                as: "historial",
                include: [{ model: models.Usuario, as: "usuario", attributes: ["id", "nombre", "rol"] }]
            },
            { 
                model: models.Pago, 
                as: "pago",
                include: [{ model: models.MetodoPago, as: "metodoPago" }]
            }
        ],
        order: [[{ model: models.HistorialPedido, as: "historial" }, "createdAt", "DESC"]]
    });

    if (!pedido) {
        throw new AppError("Pedido no encontrado.", 404);
    }

    return pedido;
};

export const cambiarEstadoPedido = async (negocioId, usuarioId, rol, pedidoId, estado, comentario, motivoCancelacion, descripcionCancelacion) => {
    const t = await sequelize.transaction();
    try {
        const pedido = await models.Pedido.findOne({ where: { id: pedidoId, negocioId }, transaction: t });
        if (!pedido) {
            throw new AppError("Pedido no encontrado.", 404);
        }

        const estadoAnterior = pedido.estado;

        // Validaciones RBAC Empleado
        if (rol.toUpperCase() === "EMPLEADO") {
            // Empleado no puede cancelar un pedido entregado
            if (estado === "CANCELADO" && estadoAnterior === "ENTREGADO") {
                throw new AppError("No tienes permiso para cancelar un pedido que ya fue ENTREGADO.", 403);
            }
        }

        if (estadoAnterior === estado) {
            throw new AppError("No se puede cambiar el estado. El pedido ya se encuentra en ese estado.", 400);
        }

        if (estado === "CANCELADO") {
            if (!motivoCancelacion || !descripcionCancelacion) {
                throw new AppError("Motivo y descripción son obligatorios para cancelar un pedido.", 400);
            }
        }

        await pedido.update({ 
            estado,
            ...(estado === "CANCELADO" && { motivoCancelacion, descripcionCancelacion })
        }, { transaction: t });

        // Ajuste por Cancelación
        if (estado === "CANCELADO" && estadoAnterior !== "CANCELADO") {
            const cliente = await models.Cliente.findOne({ where: { id: pedido.clienteId, negocioId }, transaction: t });
            if (cliente) {
                const saldoAnterior = parseFloat(cliente.saldoCuentaCorriente || 0);
                const nuevoSaldo = saldoAnterior - parseFloat(pedido.total);

                await models.MovimientoCuentaCorriente.create({
                    clienteId: cliente.id,
                    negocioId,
                    pedidoId: pedido.id,
                    tipoMovimiento: "CREDITO",
                    monto: parseFloat(pedido.total),
                    saldoResultante: nuevoSaldo,
                    comentario: `Ajuste por cancelación del Pedido #${pedido.codigoSeguimiento}`
                }, { transaction: t });

                await cliente.update({ saldoCuentaCorriente: nuevoSaldo }, { transaction: t });

                // Si el pedido ya había sido cobrado (tiene un pago completado), le sumamos el total al saldoAFavorDisponible
                // del pago para que el cliente pueda utilizar este crédito en futuros pedidos a través del frontend.
                const pago = await models.Pago.findOne({
                    where: { pedidoId: pedido.id, estado: "COMPLETADO" },
                    transaction: t
                });

                if (pago) {
                    const nuevoSaldoAFavor = parseFloat(pago.saldoAFavorDisponible || 0) + parseFloat(pedido.total);
                    await pago.update({ saldoAFavorDisponible: nuevoSaldoAFavor }, { transaction: t });
                }
            }
        }

        await models.HistorialPedido.create({
            pedidoId: pedido.id,
            usuarioId,
            estadoAnterior,
            estadoNuevo: estado,
            comentario: comentario || `Cambio de estado manual a ${estado}`
        }, { transaction: t });

        await t.commit();

        // Emitir evento por WebSockets
        emitToTenant(negocioId, "pedido_actualizado", {
            action: "UPDATE_STATUS",
            pedidoId: pedido.id,
            estado
        });

        // --- Hook de WhatsApp para notificar "Pedido Listo" ---
        if (estadoAnterior !== "LISTO_PARA_RETIRAR" && estado === "LISTO_PARA_RETIRAR") {
            import("../integraciones/whatsapp.service.js").then(async ws => {
                try {
                    const { connectionManager } = await import("../../models/connectionManager.js");
                    
                    const cliente = await models.Cliente.findOne({ where: { id: pedido.clienteId, negocioId } });
                    if (cliente && cliente.telefono) {
                        const ConfiguracionNegocio = connectionManager.centralModels.ConfiguracionNegocio;
                        const config = await ConfiguracionNegocio.findOne({ where: { negocioId } });
                        
                        if (config && config.whatsappActivo && config.whatsappEstadoConexion === "CONECTADO") {
                            let mensaje = config.whatsappMensajeListo || "¡Hola {{nombre}}! Tu pedido en {{negocio}} ya está LISTO PARA RETIRAR. ¡Te esperamos!";
                            
                            const Negocio = connectionManager.centralModels.Negocio;
                            const negocioDb = await Negocio.findByPk(negocioId);
                            const nombreNegocio = negocioDb ? negocioDb.nombre : "nuestra sucursal";

                            mensaje = mensaje.replace("{{nombre}}", cliente.nombre).replace("{{negocio}}", nombreNegocio);
                            
                            ws.enviarMensajeWhatsApp(negocioId, cliente.telefono, mensaje);
                        }
                    }
                } catch (err) {
                    console.error("❌ Error en hook de WhatsApp:", err);
                }
            });
        }

        return pedido;
    } catch (error) {
        await t.rollback();
        throw error;
    }
};

export const generarTickets = async (negocioId, pedidoId, cantidad = 1) => {
    const t = await sequelize.transaction();
    try {
        const pedido = await models.Pedido.findOne({ where: { id: pedidoId, negocioId }, transaction: t });
        if (!pedido) {
            throw new AppError("Pedido no encontrado.", 404);
        }

        if (pedido.estado === "CANCELADO") {
            throw new AppError("No se puede generar tickets para un pedido cancelado.", 400);
        }

        const ticketsToCreate = [];
        for (let i = 0; i < cantidad; i++) {
            ticketsToCreate.push({
                pedidoId: pedido.id,
                codigo: crypto.randomUUID().substring(0, 8).toUpperCase()
            });
        }

        const tickets = await models.Ticket.bulkCreate(ticketsToCreate, { 
            transaction: t,
            validate: true
        });

        await t.commit();
        return tickets;
    } catch (error) {
        await t.rollback();
        throw error;
    }
};

export const getTicketsPedido = async (negocioId, pedidoId) => {
    // First, verify the order belongs to the tenant
    const pedido = await models.Pedido.findOne({ where: { id: pedidoId, negocioId } });
    if (!pedido) {
        throw new AppError("Pedido no encontrado.", 404);
    }

    const tickets = await models.Ticket.findAll({
        where: { pedidoId: pedido.id },
        order: [['createdAt', 'ASC']]
    });

    return tickets;
};

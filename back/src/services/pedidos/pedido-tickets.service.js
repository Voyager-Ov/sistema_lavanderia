import { AppError } from "../../utils/errors.js";
import { models, sequelize } from "../../models/index.js";
import crypto from "crypto";
import { obtenerPedidoPorId } from "./pedido-core.service.js";

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

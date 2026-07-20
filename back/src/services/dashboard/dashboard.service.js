import { models, sequelize } from "../../models/index.js";
import { Op } from "sequelize";

export const getDashboardStats = async (negocioId) => {
    const ahora = new Date();
    
    // Mes actual
    const inicioMesActual = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    const finMesActual = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0, 23, 59, 59);

    // Mes anterior
    const inicioMesAnterior = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
    const finMesAnterior = new Date(ahora.getFullYear(), ahora.getMonth(), 0, 23, 59, 59);

    // Hoy
    const inicioHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
    const finHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 23, 59, 59);

    // Ayer
    const inicioAyer = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() - 1);
    const finAyer = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() - 1, 23, 59, 59);

    // Hace 7 días
    const inicioUltimos7Dias = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() - 6);

    // 1. Ingresos Mensuales (Suma de los pagos COMPLETADOS)
    const ingresosActuales = await models.Pago.sum('monto', {
        where: {
            estado: 'COMPLETADO',
            createdAt: { [Op.between]: [inicioMesActual, finMesActual] }
        },
        include: [{ model: models.Pedido, as: 'pedido', where: { negocioId }, attributes: [] }]
    });

    const ingresosAnteriores = await models.Pago.sum('monto', {
        where: {
            estado: 'COMPLETADO',
            createdAt: { [Op.between]: [inicioMesAnterior, finMesAnterior] }
        },
        include: [{ model: models.Pedido, as: 'pedido', where: { negocioId }, attributes: [] }]
    });

    const ingresosHoyCobrado = await models.Pago.sum('monto', {
        where: {
            estado: 'COMPLETADO',
            createdAt: { [Op.between]: [inicioHoy, finHoy] }
        },
        include: [{ model: models.Pedido, as: 'pedido', where: { negocioId }, attributes: [] }]
    });

    const ingresosAyerCobrado = await models.Pago.sum('monto', {
        where: {
            estado: 'COMPLETADO',
            createdAt: { [Op.between]: [inicioAyer, finAyer] }
        },
        include: [{ model: models.Pedido, as: 'pedido', where: { negocioId }, attributes: [] }]
    });

    // Plata de pedidos del día (lo que se facturó hoy, cobrado o no)
    const ingresosHoyEsperado = await models.Pedido.sum('total', {
        where: {
            negocioId,
            estado: { [Op.notIn]: ['CANCELADO'] },
            createdAt: { [Op.between]: [inicioHoy, finHoy] }
        }
    });

    // 2. Pedidos activos por estado (solo para este negocio)
    const pedidosPorEstado = await models.Pedido.findAll({
        where: { negocioId },
        attributes: [
            'estado',
            [sequelize.fn('COUNT', sequelize.col('id')), 'cantidad']
        ],
        group: ['estado']
    });

    const estadosMap = {
        PENDIENTE: 0,
        EN_PROCESO: 0,
        LISTO_PARA_RETIRAR: 0,
        ENTREGADO: 0,
        PAGADO: 0,
        CANCELADO: 0
    };

    pedidosPorEstado.forEach(p => {
        const estado = p.getDataValue('estado');
        const cantidad = parseInt(p.getDataValue('cantidad'), 10);
        if (estadosMap.hasOwnProperty(estado)) {
            estadosMap[estado] = cantidad;
        }
    });

    // 2.1 Pedidos de Hoy vs Ayer
    const pedidosHoy = await models.Pedido.count({
        where: { negocioId, createdAt: { [Op.between]: [inicioHoy, finHoy] } }
    });
    const pedidosAyer = await models.Pedido.count({
        where: { negocioId, createdAt: { [Op.between]: [inicioAyer, finAyer] } }
    });

    // 3. Productos más vendidos este mes
    const productosMasVendidos = await models.PedidoItem.findAll({
        attributes: [
            'productoId',
            [sequelize.fn('SUM', sequelize.col('cantidad')), 'totalVendidos']
        ],
        include: [
            { 
                model: models.Pedido, 
                as: 'pedido', 
                where: { 
                    negocioId,
                    createdAt: { [Op.between]: [inicioMesActual, finMesActual] },
                    estado: { [Op.notIn]: ['CANCELADO'] }
                },
                attributes: []
            },
            {
                model: models.Producto,
                as: 'producto',
                attributes: ['nombre']
            }
        ],
        group: ['productoId', 'producto.id', 'producto.nombre'],
        order: [[sequelize.literal('SUM("cantidad")'), 'DESC']],
        limit: 5
    });

    const topProductos = productosMasVendidos.map(p => ({
        id: p.productoId,
        nombre: p.producto.nombre,
        vendidos: parseInt(p.getDataValue('totalVendidos'), 10)
    }));

    // 4. Ventas por Día (Últimos 7 días) - Plata ingresada por día (pagos completados)
    const pagosUltimos7Dias = await models.Pago.findAll({
        attributes: [
            [sequelize.fn('date', sequelize.col('Pago.createdAt')), 'fecha'],
            [sequelize.fn('SUM', sequelize.col('monto')), 'total']
        ],
        where: {
            estado: 'COMPLETADO',
            createdAt: { [Op.between]: [inicioUltimos7Dias, finHoy] }
        },
        include: [{ model: models.Pedido, as: 'pedido', where: { negocioId }, attributes: [] }],
        group: [sequelize.fn('date', sequelize.col('Pago.createdAt'))]
    });

    const ventasPorDiaMap = {};
    pagosUltimos7Dias.forEach(p => {
        ventasPorDiaMap[p.getDataValue('fecha')] = parseFloat(p.getDataValue('total'));
    });

    const diasSemana = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
    const ventasPorDia = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(inicioUltimos7Dias);
        d.setDate(d.getDate() + i);
        const fechaStr = d.toISOString().split('T')[0];
        ventasPorDia.push({
            name: diasSemana[d.getDay()],
            ventas: ventasPorDiaMap[fechaStr] || 0
        });
    }

    // 5. Top Clientes (Por cantidad de pedidos este mes)
    const clientesMasFrecuentes = await models.Pedido.findAll({
        attributes: [
            'clienteId',
            [sequelize.fn('COUNT', sequelize.col('Pedido.id')), 'totalPedidos']
        ],
        where: {
            negocioId,
            createdAt: { [Op.between]: [inicioMesActual, finMesActual] },
            estado: { [Op.notIn]: ['CANCELADO'] }
        },
        include: [{ model: models.Cliente, as: 'cliente', attributes: ['nombre'] }],
        group: ['clienteId', 'cliente.id', 'cliente.nombre'],
        order: [[sequelize.literal('COUNT("Pedido"."id")'), 'DESC']],
        limit: 4
    });

    const topClientes = clientesMasFrecuentes.map(c => ({
        id: c.clienteId,
        nombre: c.cliente ? c.cliente.nombre : 'Cliente Final',
        pedidos: parseInt(c.getDataValue('totalPedidos'), 10)
    }));

    // 6. Últimos Pedidos
    const ultimosPedidosQuery = await models.Pedido.findAll({
        where: { negocioId },
        include: [{ model: models.Cliente, as: 'cliente', attributes: ['nombre'] }],
        order: [['createdAt', 'DESC']],
        limit: 5
    });
    
    const ultimosPedidos = ultimosPedidosQuery.map(p => ({
        id: p.id,
        title: p.cliente ? p.cliente.nombre : 'Cliente Final',
        subtitle: `Ticket #${p.id}`,
        badgeText: p.estado,
        badgeColor: 
            p.estado === 'COMPLETADO' || p.estado === 'ENTREGADO' ? 'green' : 
            p.estado === 'PENDIENTE' ? 'yellow' : 
            p.estado === 'CANCELADO' ? 'red' : 'blue'
    }));

    // Retorno consolidado
    return {
        ingresos: {
            mesActual: parseFloat(ingresosActuales) || 0,
            mesAnterior: parseFloat(ingresosAnteriores) || 0,
            hoyCobrado: parseFloat(ingresosHoyCobrado) || 0,
            ayerCobrado: parseFloat(ingresosAyerCobrado) || 0,
            hoyTotalPedidos: parseFloat(ingresosHoyEsperado) || 0
        },
        pedidosDelDia: {
            hoy: pedidosHoy || 0,
            ayer: pedidosAyer || 0
        },
        pedidosActivos: estadosMap,
        topProductos,
        topClientes,
        ultimosPedidos,
        ventasPorDia
    };
};

export const getCierreDeCajaStats = async (negocioId, cajaId) => {
    const pagos = await models.Pago.findAll({
        where: { cajaId, estado: "COMPLETADO" },
        include: [{ 
            model: models.MetodoPago, 
            as: "metodoPago", 
            attributes: ["nombre"] 
        }, {
            model: models.Pedido,
            as: "pedido",
            where: { negocioId },
            attributes: ["id", "codigoSeguimiento"]
        }]
    });

    let totalRecaudado = 0;
    const desglosePorMetodo = {};

    pagos.forEach(pago => {
        const monto = parseFloat(pago.monto);
        totalRecaudado += monto;
        
        const metodo = pago.metodoPago ? pago.metodoPago.nombre : 'Desconocido';
        if (!desglosePorMetodo[metodo]) desglosePorMetodo[metodo] = 0;
        desglosePorMetodo[metodo] += monto;
    });

    return {
        totalRecaudado,
        desglosePorMetodo,
        pagosRegistrados: pagos.length
    };
};

import db from "../../models/index.js";
import { Op, Sequelize } from "sequelize";
import moment from "moment";

export const getServiciosReportData = async (negocioId, fechaInicioStr, fechaFinStr) => {
    const { Pedido, PedidoItem, Producto, CategoriaProducto } = db;
    // 1. Determinar el rango de fechas
    let fechaInicio, fechaFin;
    const now = moment();
    
    if (fechaInicioStr && fechaFinStr) {
        fechaInicio = moment(fechaInicioStr).startOf('day').toDate();
        fechaFin = moment(fechaFinStr).endOf('day').toDate();
    } else {
        // Por defecto: Este mes
        fechaInicio = now.clone().startOf('month').toDate();
        fechaFin = now.clone().endOf('month').toDate();
    }

    const wherePedidos = {
        negocioId,
        fechaRecepcion: {
            [Op.between]: [fechaInicio, fechaFin]
        },
        estado: {
            [Op.ne]: "CANCELADO" // Solo contamos pedidos que no estén cancelados para ingresos
        }
    };

    // 2. KPIS Generales
    const kpisData = await Pedido.findOne({
        where: wherePedidos,
        attributes: [
            [Sequelize.fn('COUNT', Sequelize.col('id')), 'totalPedidos'],
            [Sequelize.fn('SUM', Sequelize.col('total')), 'ingresosTotales'],
        ],
        raw: true
    });

    const ingresos = parseFloat(kpisData?.ingresosTotales || 0);
    const totalPedidos = parseInt(kpisData?.totalPedidos || 0, 10);
    const ticket = totalPedidos > 0 ? (ingresos / totalPedidos).toFixed(2) : "0.00";

    const canceladosCount = await Pedido.count({
        where: {
            negocioId,
            fechaRecepcion: { [Op.between]: [fechaInicio, fechaFin] },
            estado: "CANCELADO"
        }
    });

    // 3. Obtener todos los items vendidos en el rango (para Dona, Tabla y Trend)
    const itemsVendidos = await PedidoItem.findAll({
        include: [
            {
                model: Pedido,
                as: 'pedido',
                where: wherePedidos,
                attributes: ['fechaRecepcion']
            },
            {
                model: Producto,
                as: 'producto',
                include: [{ model: CategoriaProducto, as: 'categoria', attributes: ['id', 'nombre'] }]
            }
        ],
        where: { estado: 'ACTIVO' }
    });

    // Agrupar por Servicio para la Dona y Lista de todos los servicios
    const serviciosActivos = await Producto.findAll({
        where: { negocioId, activo: true },
        include: [{ model: CategoriaProducto, as: 'categoria' }],
        raw: true,
        nest: true
    });

    // Inicializar mapa de servicios con 0
    const servicesMap = new Map();
    serviciosActivos.forEach(p => {
        servicesMap.set(p.id, {
            id: p.id,
            nombre: p.nombre,
            categoria: p.categoria?.nombre || 'Sin Categoría',
            cantidad: 0,
            ingresos: 0,
        });
    });

    // Llenar datos de ventas
    itemsVendidos.forEach(item => {
        const prodId = item.productoId;
        if (servicesMap.has(prodId)) {
            const current = servicesMap.get(prodId);
            current.cantidad += item.cantidad;
            current.ingresos += parseFloat(item.subtotal);
        }
    });

    const servicesListRaw = Array.from(servicesMap.values());
    const totalVolumen = servicesListRaw.reduce((sum, s) => sum + s.cantidad, 0);

    // Formatear para Dona y Lista Top
    const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#14b8a6", "#f43f5e", "#6366f1"];
    let donut = [];
    
    // Sort by volumen (cantidad) desc
    const sortedServices = [...servicesListRaw].sort((a, b) => b.cantidad - a.cantidad);
    
    // Top 5 para la dona
    sortedServices.slice(0, 5).forEach((s, idx) => {
        if (s.cantidad > 0) {
            donut.push({
                name: s.nombre,
                value: s.cantidad,
                color: colors[idx % colors.length]
            });
        }
    });

    // Formatear Tabla con porcentajes
    const table = sortedServices.map(s => ({
        id: s.id.toString(),
        nombre: s.nombre,
        categoria: s.categoria,
        cantidad: s.cantidad,
        ingresos: s.ingresos,
        porcentajeVentas: totalVolumen > 0 ? Math.round((s.cantidad / totalVolumen) * 100) : 0,
        tendencia: "flat" // Calcular la tendencia real implicaría consultar el mes pasado. Lo dejamos en flat por ahora.
    }));

    // Formatear AllServicesProgress
    const servicesList = sortedServices.map(s => ({
        id: s.id,
        label: s.nombre,
        value: s.cantidad,
        displayValue: s.cantidad.toString()
    }));

    // 4. Calcular el Trend temporal cruzado con Categorías
    // Para simplificar, agruparemos por día si el rango es corto, o por mes si es muy largo.
    // Usaremos días.
    const trendMap = new Map();
    const categoriesSet = new Set();
    
    itemsVendidos.forEach(item => {
        const catName = item.producto.categoria?.nombre || 'General';
        const dateStr = moment(item.pedido.fechaRecepcion).format('YYYY-MM-DD');
        categoriesSet.add(catName);

        if (!trendMap.has(dateStr)) {
            trendMap.set(dateStr, { name: dateStr });
        }
        const dayData = trendMap.get(dateStr);
        if (!dayData[catName]) dayData[catName] = 0;
        
        dayData[catName] += parseFloat(item.subtotal);
    });

    // Rellenar días vacíos en el rango para que la gráfica no se corte
    let currentDay = moment(fechaInicio);
    const endDay = moment(fechaFin);
    const trend = [];

    while (currentDay.isSameOrBefore(endDay, 'day')) {
        const dateStr = currentDay.format('YYYY-MM-DD');
        const dayLabel = currentDay.format('DD/MM'); // Ej: 15/07
        
        if (trendMap.has(dateStr)) {
            const dayData = trendMap.get(dateStr);
            dayData.name = dayLabel; // Mostrar solo DD/MM en frontend
            trend.push(dayData);
        } else {
            const emptyDay = { name: dayLabel };
            categoriesSet.forEach(c => emptyDay[c] = 0);
            trend.push(emptyDay);
        }
        currentDay.add(1, 'day');
    }

    // Preparar metadatos de categorías para Recharts
    const categoriesMetaData = Array.from(categoriesSet).map((catName, idx) => ({
        key: catName,
        name: catName,
        color: colors[idx % colors.length]
    }));

    return {
        kpis: {
            ingresos: ingresos,
            ticket: parseFloat(ticket),
            capacidad: 85, // Simulado, requeriría lógica de máquinas
            cancelados: canceladosCount
        },
        trend: trend,
        categoriesMetaData,
        donut,
        servicesList,
        table
    };
};

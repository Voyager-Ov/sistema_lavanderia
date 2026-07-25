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
            costoTotal: 0,
            tiempoTotal: 0
        });
    });

    // Llenar datos de ventas
    itemsVendidos.forEach(item => {
        const prodId = item.productoId;
        if (servicesMap.has(prodId)) {
            const current = servicesMap.get(prodId);
            current.cantidad += item.cantidad;
            current.ingresos += parseFloat(item.subtotal);
            
            const costo = parseFloat(item.producto.costoEstimado || 0);
            const tiempo = parseInt(item.producto.tiempoEstimadoMinutos || 0, 10);
            current.costoTotal += (costo * item.cantidad);
            current.tiempoTotal += (tiempo * item.cantidad);
        }
    });

    const servicesListRaw = Array.from(servicesMap.values());
    const totalVolumen = servicesListRaw.reduce((sum, s) => sum + s.cantidad, 0);
    const margenBrutoTotal = servicesListRaw.reduce((sum, s) => sum + (s.ingresos - s.costoTotal), 0);
    const horasOperativasTotal = (servicesListRaw.reduce((sum, s) => sum + s.tiempoTotal, 0) / 60).toFixed(1);

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
        costos: s.costoTotal,
        margen: s.ingresos - s.costoTotal,
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

    const totalGeneral = totalPedidos + canceladosCount;
    const efectividad = totalGeneral > 0 ? Math.round((totalPedidos / totalGeneral) * 100) : 0;

    return {
        kpis: {
            ingresos: ingresos,
            ticket: parseFloat(ticket),
            margenBruto: margenBrutoTotal,
            horasOperativas: parseFloat(horasOperativasTotal),
            efectividad: efectividad,
            cancelados: canceladosCount
        },
        trend: trend,
        categoriesMetaData,
        donut,
        servicesList,
        table
    };
};

export const getPedidosReportData = async (negocioId, fechaInicioStr, fechaFinStr) => {
    const { Pedido, Cliente, Usuario } = db;
    // 1. Determinar el rango de fechas
    let fechaInicio, fechaFin;
    const now = moment();
    
    if (fechaInicioStr && fechaFinStr) {
        fechaInicio = moment(fechaInicioStr).startOf('day').toDate();
        fechaFin = moment(fechaFinStr).endOf('day').toDate();
    } else {
        fechaInicio = now.clone().startOf('month').toDate();
        fechaFin = now.clone().endOf('month').toDate();
    }

    const wherePedidos = {
        negocioId,
        fechaRecepcion: {
            [Op.between]: [fechaInicio, fechaFin]
        }
    };

    // Todos los pedidos en el rango (para poder armar tabla, graficos, etc)
    const pedidos = await Pedido.findAll({
        where: wherePedidos,
        include: [
            { model: Cliente, as: 'cliente', attributes: ['id', 'nombre'] },
            { model: Usuario, as: 'creador', attributes: ['id', 'nombre'], required: false }
        ],
        order: [['fechaRecepcion', 'DESC']]
    });

    let ingresosTotales = 0;
    let canceladosCount = 0;
    let completadosCount = 0;
    let pendienteCobro = 0;
    let sumTiemposEntrega = 0; // en horas
    let entregadosCount = 0;
    
    const estadosMap = {
        PENDIENTE: 0,
        EN_PROCESO: 0,
        LISTO_PARA_RETIRAR: 0,
        ENTREGADO: 0,
        CANCELADO: 0
    };

    const trendMap = new Map();
    const empleadosMap = new Map();

    pedidos.forEach(p => {
        const estado = p.estado;
        if (estadosMap[estado] !== undefined) {
            estadosMap[estado]++;
        }

        if (estado === "CANCELADO") {
            canceladosCount++;
        } else {
            ingresosTotales += parseFloat(p.total);
            completadosCount++;
            
            if (!p.cobrado) {
                pendienteCobro += parseFloat(p.total);
            }
            
            if (estado === "ENTREGADO" && p.fechaEntregadoReal) {
                const start = moment(p.fechaRecepcion);
                const end = moment(p.fechaEntregadoReal);
                const diffHours = end.diff(start, 'hours');
                sumTiemposEntrega += diffHours;
                entregadosCount++;
            }
        }
        
        // Empleados chart
        if (p.creador) {
            const nombreEmpleado = p.creador.nombre.trim();
            if (!empleadosMap.has(nombreEmpleado)) {
                empleadosMap.set(nombreEmpleado, { nombre: nombreEmpleado, pedidos: 0 });
            }
            empleadosMap.get(nombreEmpleado).pedidos++;
        }

        const dateStr = moment(p.fechaRecepcion).format('YYYY-MM-DD');
        if (!trendMap.has(dateStr)) {
            trendMap.set(dateStr, { name: dateStr, pedidos: 0, ingresos: 0 });
        }
        const dayData = trendMap.get(dateStr);
        dayData.pedidos++;
        if (estado !== "CANCELADO") {
            dayData.ingresos += parseFloat(p.total);
        }
    });

    const totalPedidos = pedidos.length;
    const ticket = completadosCount > 0 ? (ingresosTotales / completadosCount).toFixed(2) : "0.00";
    const tiempoMedioEntrega = entregadosCount > 0 ? (sumTiemposEntrega / entregadosCount).toFixed(1) : "0.0";
    
    const chartEmpleados = Array.from(empleadosMap.values())
        .sort((a, b) => b.pedidos - a.pedidos)
        .slice(0, 8); // Top 8 empleados

    // Preparar Trend
    let currentDay = moment(fechaInicio);
    const endDay = moment(fechaFin);
    const trend = [];

    while (currentDay.isSameOrBefore(endDay, 'day')) {
        const dateStr = currentDay.format('YYYY-MM-DD');
        const dayLabel = currentDay.format('DD/MM');
        
        if (trendMap.has(dateStr)) {
            const dayData = trendMap.get(dateStr);
            dayData.name = dayLabel;
            trend.push(dayData);
        } else {
            trend.push({ name: dayLabel, pedidos: 0, ingresos: 0 });
        }
        currentDay.add(1, 'day');
    }

    const categoriesMetaData = [
        { key: "pedidos", name: "Cant. Pedidos", color: "#3b82f6" },
        { key: "ingresos", name: "Ingresos ($)", color: "#10b981" }
    ];

    const donut = [
        { name: "Pendiente", value: estadosMap.PENDIENTE, color: "#f59e0b" },
        { name: "En Proceso", value: estadosMap.EN_PROCESO, color: "#3b82f6" },
        { name: "Listo", value: estadosMap.LISTO_PARA_RETIRAR, color: "#8b5cf6" },
        { name: "Entregado", value: estadosMap.ENTREGADO, color: "#10b981" }
    ].filter(d => d.value > 0);

    const table = pedidos.map(p => ({
        id: p.id,
        codigoSeguimiento: p.codigoSeguimiento,
        cliente: p.cliente?.nombre || 'Cliente Final',
        estado: p.estado,
        total: parseFloat(p.total),
        fecha: p.fechaRecepcion,
        fechaEntrega: p.fechaEntregaEstimada
    }));

    return {
        kpis: {
            ingresos: ingresosTotales,
            totalPedidos,
            ticket: parseFloat(ticket),
            cancelados: canceladosCount,
            pendienteCobro: pendienteCobro,
            tiempoMedioEntrega: parseFloat(tiempoMedioEntrega)
        },
        trend,
        categoriesMetaData,
        donut,
        chartEmpleados,
        table
    };
};

export const getEmpleadosReportData = async (negocioId, fechaInicioStr, fechaFinStr) => {
    const { Usuario, Caja, Pedido, Pago } = db;
    let fechaInicio, fechaFin;
    const now = moment();
    
    if (fechaInicioStr && fechaFinStr) {
        fechaInicio = moment(fechaInicioStr).startOf('day').toDate();
        fechaFin = moment(fechaFinStr).endOf('day').toDate();
    } else {
        fechaInicio = now.clone().startOf('month').toDate();
        fechaFin = now.clone().endOf('month').toDate();
    }

    const whereFechas = {
        negocioId,
        createdAt: {
            [Op.between]: [fechaInicio, fechaFin]
        }
    };

    // 1. Empleados
    const empleados = await Usuario.findAll({
        where: { negocioId, activo: true },
        attributes: ['id', 'nombre', 'rol'],
        raw: true
    });

    const empleadosMap = new Map();
    empleados.forEach(emp => {
        empleadosMap.set(emp.id, {
            id: emp.id,
            nombre: emp.nombre,
            rol: emp.rol,
            cajasAbiertas: 0,
            pedidosGenerados: 0,
            pedidosCancelados: 0,
            totalCobrado: 0
        });
    });

    // 2. Cajas
    const cajas = await Caja.findAll({
        where: {
            negocioId,
            fechaApertura: { [Op.between]: [fechaInicio, fechaFin] }
        },
        include: [{ model: Usuario, as: 'cajero', attributes: ['id', 'nombre'] }],
        order: [['fechaApertura', 'DESC']]
    });

    cajas.forEach(caja => {
        if (caja.usuarioId && empleadosMap.has(caja.usuarioId)) {
            empleadosMap.get(caja.usuarioId).cajasAbiertas++;
        }
    });

    // 3. Pedidos (Generados y cancelados)
    const pedidos = await Pedido.findAll({
        where: {
            negocioId,
            fechaRecepcion: { [Op.between]: [fechaInicio, fechaFin] }
        },
        raw: true
    });

    let totalPedidosGenerados = 0;
    let totalCancelados = 0;

    pedidos.forEach(p => {
        totalPedidosGenerados++;
        if (p.creadoPorId && empleadosMap.has(p.creadoPorId)) {
            empleadosMap.get(p.creadoPorId).pedidosGenerados++;
            if (p.estado === 'CANCELADO') {
                empleadosMap.get(p.creadoPorId).pedidosCancelados++;
                totalCancelados++;
            }
        } else if (p.estado === 'CANCELADO') {
            totalCancelados++;
        }
    });

    // 4. Pagos (Metodos de pago y total cobrado)
    const cajasIds = cajas.map(c => c.id);
    const pagos = await Pago.findAll({
        where: {
            cajaId: { [Op.in]: cajasIds },
            estado: 'COMPLETADO'
        },
        include: [{ model: db.MetodoPago, as: 'metodoPago', attributes: ['nombre'] }],
        raw: true,
        nest: true
    });

    const metodosPagoMap = new Map();
    let ingresosEfectivo = 0;
    let ingresosTotales = 0;
    const trendMap = new Map();

    pagos.forEach(pago => {
        const monto = parseFloat(pago.monto);
        ingresosTotales += monto;
        
        // Asignar al empleado que lo registró
        if (pago.registradoPorId && empleadosMap.has(pago.registradoPorId)) {
            empleadosMap.get(pago.registradoPorId).totalCobrado += monto;
        }

        // Metodos de pago
        const nombreMetodo = pago.metodoPago?.nombre || 'OTRO';
        if (!metodosPagoMap.has(nombreMetodo)) {
            metodosPagoMap.set(nombreMetodo, 0);
        }
        metodosPagoMap.set(nombreMetodo, metodosPagoMap.get(nombreMetodo) + monto);

        if (nombreMetodo.toUpperCase() === 'EFECTIVO') {
            ingresosEfectivo += monto;
        }

        // Trend diario
        const dateStr = moment(pago.createdAt).format('YYYY-MM-DD');
        if (!trendMap.has(dateStr)) {
            trendMap.set(dateStr, { name: dateStr, ingresos: 0 });
        }
        trendMap.get(dateStr).ingresos += monto;
    });

    // Kpis
    const tasaCancelacion = totalPedidosGenerados > 0 ? ((totalCancelados / totalPedidosGenerados) * 100).toFixed(1) : "0.0";

    // Formatear Trend
    let currentDay = moment(fechaInicio);
    const endDay = moment(fechaFin);
    const trend = [];
    while (currentDay.isSameOrBefore(endDay, 'day')) {
        const dateStr = currentDay.format('YYYY-MM-DD');
        if (trendMap.has(dateStr)) {
            const data = trendMap.get(dateStr);
            data.name = currentDay.format('DD/MM');
            trend.push(data);
        } else {
            trend.push({ name: currentDay.format('DD/MM'), ingresos: 0 });
        }
        currentDay.add(1, 'day');
    }

    // Formatear Donut
    const colors = ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ef4444"];
    const donut = Array.from(metodosPagoMap.entries()).map(([name, value], idx) => ({
        name: name.replace(/_/g, ' '),
        value,
        color: colors[idx % colors.length]
    })).filter(d => d.value > 0);

    // Formatear tabla Empleados
    const tablaEmpleados = Array.from(empleadosMap.values())
        .sort((a, b) => b.totalCobrado - a.totalCobrado)
        .map(emp => ({
            id: emp.id.toString(),
            nombre: emp.nombre,
            rol: emp.rol,
            cajasAbiertas: emp.cajasAbiertas,
            pedidosGenerados: emp.pedidosGenerados,
            pedidosCancelados: emp.pedidosCancelados,
            totalCobrado: emp.totalCobrado
        }));

    // Formatear tabla ultimas Cajas
    const ultimasCajas = cajas.slice(0, 10).map(c => ({
        id: c.id.toString(),
        fechaApertura: c.fechaApertura,
        fechaCierre: c.fechaCierre,
        estado: c.estado,
        usuario: c.cajero?.nombre || 'Desconocido',
        montoInicial: parseFloat(c.montoInicial || 0),
        montoFinal: parseFloat(c.montoFinal || 0),
        diferencia: parseFloat(c.diferencia || 0)
    }));

    return {
        kpis: {
            totalCajas: cajas.length,
            tasaCancelacion: parseFloat(tasaCancelacion),
            ingresosEfectivo: ingresosEfectivo
        },
        trend,
        donut,
        tablaEmpleados,
        ultimasCajas
    };
};


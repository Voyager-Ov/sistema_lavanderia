import { models } from "../../models/index.js";
import { successResponse, errorResponse } from "../../utils/response.util.js";
import { Op } from "sequelize";

// Helper para construir el filtro de fechas
const buildDateFilter = (fechaDesde, fechaHasta, dateField = 'fecha') => {
    const where = {};
    if (fechaDesde || fechaHasta) {
        where[dateField] = {};
        if (fechaDesde) where[dateField][Op.gte] = new Date(fechaDesde);
        if (fechaHasta) {
            // Añadir 23:59:59 al final del día para incluirlo completo
            const dateHasta = new Date(fechaHasta);
            dateHasta.setUTCHours(23, 59, 59, 999);
            where[dateField][Op.lte] = dateHasta;
        }
    }
    return where;
};

export const getKPIs = async (req, res, next) => {
    try {
        const { negocioId } = req.user;
        const { fechaDesde, fechaHasta } = req.query;

        const dateFilterPagos = buildDateFilter(fechaDesde, fechaHasta, 'fechaPago');
        const dateFilterGastos = buildDateFilter(fechaDesde, fechaHasta, 'fecha');
        const dateFilterPedidos = buildDateFilter(fechaDesde, fechaHasta, 'createdAt');

        // 1. Total Ingresos (Pagos Completados)
        const pagos = await models.Pago.findAll({
            where: { estado: "COMPLETADO", ...dateFilterPagos },
            include: [
                {
                    model: models.Caja,
                    as: 'caja',
                    where: { negocioId },
                    attributes: []
                }
            ],
            attributes: ['monto']
        });
        const totalIngresos = pagos.reduce((sum, p) => sum + Number(p.monto), 0);

        // 2. Total Egresos (Gastos)
        const gastos = await models.Gasto.findAll({
            where: { negocioId, ...dateFilterGastos },
            attributes: ['monto']
        });
        const totalEgresos = gastos.reduce((sum, g) => sum + Number(g.monto), 0);

        // 3. Balance Neto
        const balanceNeto = totalIngresos - totalEgresos;

        // 4. Ingresos No Cobrados (Pedidos Entregados pero no cobrados)
        // Pedidos sin Pago asociado o con Pago Anulado
        const pedidosSinCobrar = await models.Pedido.findAll({
            where: { 
                negocioId, 
                estado: {
                    [Op.in]: ['LISTO_PARA_RETIRAR', 'ENTREGADO']
                },
                ...dateFilterPedidos
            },
            include: [{
                model: models.Pago,
                as: 'pago',
                required: false
            }]
        });

        const totalNoCobrado = pedidosSinCobrar
            .filter(p => !p.pago || p.pago.estado === 'ANULADO')
            .reduce((sum, p) => sum + Number(p.total), 0);

        return successResponse(res, 200, "KPIs calculados", {
            totalIngresos,
            totalEgresos,
            balanceNeto,
            totalNoCobrado
        });
    } catch (error) {
        next(error);
    }
};

export const getMovimientos = async (req, res, next) => {
    try {
        const { negocioId } = req.user;
        const { fechaDesde, fechaHasta, page = 1, limit = 50, search = '' } = req.query;

        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);

        const dateFilterPagos = buildDateFilter(fechaDesde, fechaHasta, 'fechaPago');
        const dateFilterGastos = buildDateFilter(fechaDesde, fechaHasta, 'fecha');

        // Traer pagos
        const pagos = await models.Pago.findAll({
            where: { estado: "COMPLETADO", ...dateFilterPagos },
            include: [
                {
                    model: models.Caja,
                    as: 'caja',
                    where: { negocioId },
                    attributes: []
                },
                { model: models.Pedido, as: 'pedido', attributes: ['id', 'clienteId'] },
                { model: models.MetodoPago, as: 'metodoPago', attributes: ['nombre'] },
                { model: models.Usuario, as: 'registradoPor', attributes: ['nombre'] }
            ]
        });

        // Traer gastos
        const gastos = await models.Gasto.findAll({
            where: { negocioId, ...dateFilterGastos },
            include: [
                { model: models.MetodoPago, as: 'metodoPago', attributes: ['nombre'] },
                { model: models.Usuario, as: 'registradoPor', attributes: ['nombre'] }
            ]
        });

        // Formatear e unificar
        let movimientos = [];

        pagos.forEach(p => {
            // Aplicar búsqueda simple en memoria
            const desc = `Cobro Pedido #${p.pedidoId}`;
            if (search && !desc.toLowerCase().includes(search.toLowerCase())) return;

            movimientos.push({
                id: `pago-${p.id}`,
                tipoMovimiento: 'INGRESO',
                monto: Number(p.monto),
                fecha: p.fechaPago,
                descripcion: desc,
                referenciaId: p.pedidoId,
                metodoPago: p.metodoPago?.nombre || 'N/A',
                registradoPor: p.registradoPor?.nombre || 'N/A',
                estado: p.estado,
                originalId: p.id
            });
        });

        gastos.forEach(g => {
            // Aplicar búsqueda simple en memoria
            const desc = g.descripcion ? `${g.categoria} - ${g.descripcion}` : g.categoria;
            if (search && !desc.toLowerCase().includes(search.toLowerCase()) && !g.categoria.toLowerCase().includes(search.toLowerCase())) return;

            movimientos.push({
                id: `gasto-${g.id}`,
                tipoMovimiento: 'EGRESO',
                monto: Number(g.monto),
                fecha: g.fecha,
                descripcion: desc,
                referenciaId: g.categoria,
                metodoPago: g.metodoPago?.nombre || 'N/A',
                registradoPor: g.registradoPor?.nombre || 'N/A',
                estado: 'COMPLETADO',
                originalId: g.id
            });
        });

        // Ordenar por fecha DESC
        movimientos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

        const totalRecords = movimientos.length;
        const totalPages = Math.ceil(totalRecords / limitNum);
        
        // Paginar
        const startIndex = (pageNum - 1) * limitNum;
        const endIndex = startIndex + limitNum;
        const pagedMovimientos = movimientos.slice(startIndex, endIndex);

        return successResponse(res, 200, "Movimientos obtenidos", {
            data: pagedMovimientos,
            pagination: {
                totalRecords,
                totalPages,
                currentPage: pageNum,
                limit: limitNum
            }
        });
    } catch (error) {
        next(error);
    }
};

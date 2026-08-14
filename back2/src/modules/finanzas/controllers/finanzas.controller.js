import { Op } from "sequelize";
import { connectionManager } from "../../../models/connectionManager.js";
import { successResponse } from "../../../utils/response.util.js";

const getModels = async (negocioId) => {
	const tenantDb = await connectionManager.getTenantDb(negocioId);
	return tenantDb.models;
};

export const getKPIs = async (req, res, next) => {
	try {
		const { fechaDesde, fechaHasta } = req.query;
		const negocioId = req.user.negocioId;

		const { Cobro, Gasto, Pedido } = await getModels(negocioId);

		const dateFilter = {};
		if (fechaDesde && fechaHasta) {
			dateFilter.fechaHora = {
				[Op.between]: [new Date(fechaDesde), new Date(fechaHasta)],
			};
		} else if (fechaDesde) {
			dateFilter.fechaHora = {
				[Op.gte]: new Date(fechaDesde),
			};
		} else if (fechaHasta) {
			dateFilter.fechaHora = {
				[Op.lte]: new Date(fechaHasta),
			};
		}

		// 1. Total Ingresos (Cobros)
		const ingresosQuery = {
			where: { ...dateFilter },
			include: [{ model: Pedido, as: "pedido", where: { negocioId }, attributes: [] }],
		};
		const totalIngresos = await Cobro.sum("montoAbonado", ingresosQuery) || 0;

		// 2. Total Egresos (Gastos) - Only "Pagado" as requested
		const egresosQuery = {
			where: { ...dateFilter, negocioId, estadoGasto: "Pagado" },
		};
		const totalEgresos = await Gasto.sum("montoTotal", egresosQuery) || 0;

		// 3. Balance Neto
		const balanceNeto = totalIngresos - totalEgresos;

		// 4. Total No Cobrado (Pedidos no cobrados y no cancelados)
		const noCobradoQuery = {
			where: {
				negocioId,
				cobrado: false,
				estado: {
					[Op.ne]: "CANCELADO"
				}
			}
		};
		const totalNoCobrado = await Pedido.sum("total", noCobradoQuery) || 0;

		return successResponse(res, 200, "KPIs de finanzas recuperados exitosamente", {
			totalIngresos,
			totalEgresos,
			balanceNeto,
			totalNoCobrado
		});
	} catch (error) {
		console.error("Error en getKPIs:", error);
		if (next) next(error);
		else return res.status(500).json({ error: "Error interno del servidor", details: error.message });
	}
};

export const getMovimientos = async (req, res, next) => {
	try {
		const { fechaDesde, fechaHasta, page = 1, limit = 10, search } = req.query;
		const negocioId = req.user.negocioId;

		const { Cobro, Gasto, Pedido, Empleado, MetodoPago, MovimientoCaja, Caja } = await getModels(negocioId);

		const dateFilter = {};
		if (fechaDesde && fechaHasta) {
			dateFilter.fechaHora = {
				[Op.between]: [new Date(fechaDesde), new Date(fechaHasta)],
			};
		} else if (fechaDesde) {
			dateFilter.fechaHora = {
				[Op.gte]: new Date(fechaDesde),
			};
		} else if (fechaHasta) {
			dateFilter.fechaHora = {
				[Op.lte]: new Date(fechaHasta),
			};
		}

		const searchFilter = search ? {
			[Op.or]: [
				{ descripcion: { [Op.like]: `%${search}%` } },
			]
		} : {};

		// Get all Cobros
		const cobros = await Cobro.findAll({
			where: { ...dateFilter },
			include: [
				{ model: Pedido, as: "pedido", where: { negocioId }, attributes: ["numeroPedido", "clienteId"] },
				{ model: MetodoPago, as: "metodoPago", attributes: ["nombre"] },
				{ 
					model: MovimientoCaja, as: "movimientoCaja", include: [
						{ model: Caja, as: "caja", include: [{ model: Empleado, as: "empleado", attributes: ["nombre", "apellido"] }] }
					] 
				}
			],
			order: [["fechaHora", "DESC"]]
		});

		// Get all Gastos
		const gastos = await Gasto.findAll({
			where: { ...dateFilter, negocioId, ...searchFilter },
			include: [
				{ model: MetodoPago, as: "metodoPago", attributes: ["nombre"] },
				{ 
					model: MovimientoCaja, as: "movimientoCaja", include: [
						{ model: Caja, as: "caja", include: [{ model: Empleado, as: "empleado", attributes: ["nombre", "apellido"] }] }
					] 
				}
			],
			order: [["fechaHora", "DESC"]]
		});

		// Format and combine
		let movimientos = [];

		cobros.forEach(c => {
			let registradoPor = "Sistema";
			if (c.movimientoCaja && c.movimientoCaja.caja && c.movimientoCaja.caja.empleado) {
				registradoPor = `${c.movimientoCaja.caja.empleado.nombre} ${c.movimientoCaja.caja.empleado.apellido || ''}`.trim();
			}

			// Applying search filter manually for cobros since search by 'descripcion' isn't natively in the Cobro model
			const descripcion = `Cobro de Pedido #${c.pedidoNumeroPedido}`;
			if (search && !descripcion.toLowerCase().includes(search.toLowerCase())) return;

			movimientos.push({
				id: `cobro-${c.id}`,
				originalId: c.id,
				tipoMovimiento: "INGRESO",
				monto: c.montoAbonado,
				fecha: c.fechaHora,
				descripcion: descripcion,
				referenciaId: c.pedidoNumeroPedido,
				metodoPago: c.metodoPago ? c.metodoPago.nombre : "Desconocido",
				registradoPor: registradoPor,
				estado: "COMPLETADO",
			});
		});

		gastos.forEach(g => {
			let registradoPor = "Sistema";
			if (g.movimientoCaja && g.movimientoCaja.caja && g.movimientoCaja.caja.empleado) {
				registradoPor = `${g.movimientoCaja.caja.empleado.nombre} ${g.movimientoCaja.caja.empleado.apellido || ''}`.trim();
			}

			movimientos.push({
				id: `gasto-${g.id}`,
				originalId: g.id,
				tipoMovimiento: "EGRESO",
				monto: g.montoTotal,
				fecha: g.fechaHora,
				descripcion: g.descripcion || "Gasto sin descripción",
				referenciaId: g.categoriaGastoId,
				metodoPago: g.metodoPago ? g.metodoPago.nombre : "Desconocido",
				registradoPor: registradoPor,
				estado: g.estadoGasto,
			});
		});

		// Sort all by fecha descending
		movimientos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

		// Pagination
		const totalRecords = movimientos.length;
		const totalPages = Math.ceil(totalRecords / limit) || 1;
		const offset = (page - 1) * limit;
		
		const paginatedData = movimientos.slice(offset, offset + Number(limit));

		return successResponse(res, 200, "Movimientos financieros recuperados exitosamente", {
			data: paginatedData,
			pagination: {
				totalRecords,
				totalPages,
				currentPage: Number(page),
				limit: Number(limit)
			}
		});

	} catch (error) {
		console.error("Error en getMovimientos:", error);
		if (next) next(error);
		else return res.status(500).json({ error: "Error interno del servidor", details: error.message });
	}
};

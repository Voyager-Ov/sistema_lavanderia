import { Op } from "sequelize";
import { connectionManager } from "../../../models/connectionManager.js";
import { successResponse } from "../../../utils/response.util.js";
import { parseDateRange } from "../../../utils/date.util.js";

const getModels = async (negocioId) => {
	const tenantDb = await connectionManager.getTenantDb(negocioId);
	return tenantDb.models;
};

export const getKPIs = async (req, res, next) => {
	try {
		const { fechaDesde, fechaHasta } = req.query;
		const negocioId = req.user.negocioId;

		const { Cobro, Gasto, Pedido } = await getModels(negocioId);

		const parsedRange = parseDateRange(fechaDesde, fechaHasta);
		const dateFilter = parsedRange ? { fechaHora: parsedRange } : {};

		// 1. Total Ingresos (Cobros donde montoAbonado > 0)
		const ingresosQuery = {
			where: { ...dateFilter, montoAbonado: { [Op.gt]: 0 } },
			include: [{ model: Pedido, as: "pedido", where: { negocioId }, attributes: [] }],
		};
		const totalIngresos = await Cobro.sum("montoAbonado", ingresosQuery) || 0;

		// 2. Total Egresos (Gastos "Pagado" + Devoluciones por cancelación donde montoAbonado < 0)
		const egresosQuery = {
			where: { ...dateFilter, negocioId, estadoGasto: "Pagado" },
		};
		const totalGastos = await Gasto.sum("montoTotal", egresosQuery) || 0;

		const devolucionesQuery = {
			where: { ...dateFilter, montoAbonado: { [Op.lt]: 0 } },
			include: [{ model: Pedido, as: "pedido", where: { negocioId }, attributes: [] }],
		};
		const totalDevoluciones = Math.abs(await Cobro.sum("montoAbonado", devolucionesQuery) || 0);

		const totalEgresos = totalGastos + totalDevoluciones;

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

		const { Cobro, Gasto, Pedido, Empleado, MetodoPago, MovimientoCaja, Caja, CategoriaGasto } = await getModels(negocioId);

		const parsedRange = parseDateRange(fechaDesde, fechaHasta);
		const dateFilter = parsedRange ? { fechaHora: parsedRange } : {};

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
				{ model: CategoriaGasto, as: "categoria", attributes: ["nombre"] },
				{ 
					model: MovimientoCaja, as: "movimientoCaja", include: [
						{ model: Caja, as: "caja", include: [{ model: Empleado, as: "empleado", attributes: ["nombre", "apellido"] }] }
					] 
				}
			],
			order: [["fechaHora", "DESC"]]
		});

		// Map of category IDs to names as fallback
		const categoriasGastoMap = {};
		if (CategoriaGasto) {
			const todasCat = await CategoriaGasto.findAll();
			todasCat.forEach(cat => {
				categoriasGastoMap[cat.id] = cat.nombre;
			});
		}

		// Fetch all Cajas with Empleado to resolve historic transactions without explicit movimientoCaja link
		const cajas = await Caja.findAll({
			where: { negocioId },
			include: [{ model: Empleado, as: "empleado", attributes: ["nombre", "apellido"] }]
		});

		// Fetch first active Empleado of current tenant as fallback if historic caja records lacked an explicit link
		const primerEmpleado = await Empleado.findOne({ where: { negocioId }, order: [["id", "ASC"]] });
		const defaultNombreEmpleado = primerEmpleado 
			? `${primerEmpleado.nombre} ${primerEmpleado.apellido || ''}`.trim() 
			: "Sistema / Mostrador";

		// Helper to resolve real Empleado name for a transaction based on its specific Caja turn
		const resolveRegistradoPor = (movimientoCajaObj, fechaHoraMov) => {
			if (movimientoCajaObj?.caja?.empleado) {
				const emp = movimientoCajaObj.caja.empleado;
				const full = `${emp.nombre || ''} ${emp.apellido || ''}`.trim();
				if (full) return full;
			}

			// Match by timestamp range in historic cajas if explicit link is missing
			if (fechaHoraMov) {
				const fMov = new Date(fechaHoraMov);
				const matchingCaja = cajas.find(cj => {
					const fApertura = new Date(cj.fechaHoraApertura);
					const fCierre = cj.fechaHoraCierre ? new Date(cj.fechaHoraCierre) : new Date();
					return fMov >= fApertura && fMov <= fCierre;
				});
				if (matchingCaja?.empleado) {
					const emp = matchingCaja.empleado;
					const full = `${emp.nombre || ''} ${emp.apellido || ''}`.trim();
					if (full) return full;
				}
			}

			return defaultNombreEmpleado;
		};

		// Format and combine
		let movimientos = [];

		cobros.forEach(c => {
			const registradoPor = resolveRegistradoPor(c.movimientoCaja, c.fechaHora);

			const isRefund = parseFloat(c.montoAbonado) < 0 || (c.movimientoCaja && parseFloat(c.movimientoCaja.monto) < 0);
			const descripcionBase = isRefund 
				? `Devolución por Cancelación del Pedido #${c.pedidoNumeroPedido}`
				: `Cobro de Pedido #${c.pedidoNumeroPedido}`;

			if (search && !descripcionBase.toLowerCase().includes(search.toLowerCase())) return;

			let montoAbs = 0;
			if (c.movimientoCaja) {
				montoAbs = Math.abs(parseFloat(c.movimientoCaja.monto) || 0);
			} else {
				montoAbs = Math.abs(parseFloat(c.montoAbonado) || 0);
			}

			movimientos.push({
				id: `cobro-${c.id}`,
				originalId: c.id,
				tipoMovimiento: isRefund ? "EGRESO" : "INGRESO",
				monto: montoAbs,
				fecha: c.fechaHora,
				descripcion: isRefund 
					? descripcionBase
					: (montoAbs === 0 && parseFloat(c.montoAbonado) > 0
						? `${descripcionBase} (Saldado con Saldo a Favor)`
						: descripcionBase),
				referenciaId: c.pedidoNumeroPedido,
				metodoPago: c.metodoPago ? c.metodoPago.nombre : "Efectivo",
				registradoPor: registradoPor,
				estado: "COMPLETADO",
			});
		});

		gastos.forEach(g => {
			const registradoPor = resolveRegistradoPor(g.movimientoCaja, g.fechaHora);
			let nombreCategoria = g.categoria?.nombre;
			if (!nombreCategoria && g.categoriaGastoId) {
				nombreCategoria = categoriasGastoMap[g.categoriaGastoId];
			}
			if (!nombreCategoria) {
				nombreCategoria = "Gastos Generales";
			}

			movimientos.push({
				id: `gasto-${g.id}`,
				originalId: g.id,
				tipoMovimiento: "EGRESO",
				monto: g.montoTotal,
				fecha: g.fechaHora,
				descripcion: g.descripcion || "Gasto sin descripción",
				referenciaId: nombreCategoria,
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

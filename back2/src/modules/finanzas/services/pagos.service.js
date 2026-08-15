import { connectionManager } from "../../../models/connectionManager.js";
import { AppError } from "../../../utils/appError.js";

class PagosService {

    async _getModels(negocioId) {
        const tenantDb = await connectionManager.getTenantDb(negocioId);
        return tenantDb.models;
    }

    // Métodos de pago base iniciales sugeridos por tenant
    _getMetodosBase(negocioId) {
        return [
            { nombre: "Efectivo", activo: true, icono: "Banknote", esFijo: true, negocioId },
            { nombre: "Mercado Pago / QR", activo: true, icono: "QrCode", esFijo: true, negocioId },
            { nombre: "Tarjeta de Débito", activo: true, icono: "CreditCard", esFijo: true, negocioId },
            { nombre: "Tarjeta de Crédito", activo: true, icono: "CreditCard", esFijo: true, negocioId },
            { nombre: "Transferencia Bancaria", activo: true, icono: "Landmark", esFijo: true, negocioId }
        ];
    }

    // Listar métodos de pago del negocio
    async obtenerMetodosPago(negocioId) {
        if (!negocioId) {
            throw new AppError("ID de negocio es requerido.", 400, "MISSING_TENANT_ID");
        }
        const { MetodoPago } = await this._getModels(negocioId);

        let metodos = await MetodoPago.findAll({
            order: [["id", "ASC"]]
        });

        // Si el negocio aún no tiene métodos de pago configurados, sembramos los métodos iniciales sugeridos
        if (metodos.length === 0) {
            const base = this._getMetodosBase(negocioId);
            for (const m of base) {
                await MetodoPago.findOrCreate({
                    where: { nombre: m.nombre },
                    defaults: m
                });
            }
            metodos = await MetodoPago.findAll({
                order: [["id", "ASC"]]
            });
        }

        return metodos;
    }

    // Crear método de pago personalizado por el Admin del negocio
    async crearMetodoPago(negocioId, data) {
        if (!negocioId) {
            throw new AppError("ID de negocio es requerido.", 400, "MISSING_TENANT_ID");
        }
        const { MetodoPago } = await this._getModels(negocioId);

        if (!data.nombre || data.nombre.trim() === "") {
            throw new AppError("El nombre del método de pago es obligatorio.", 400, "MISSING_PAYMENT_METHOD_NAME");
        }

        const nuevoMetodo = await MetodoPago.create({
            nombre: data.nombre.trim(),
            icono: data.icono || "CreditCard",
            activo: true,
            esFijo: false,
            negocioId
        });

        return nuevoMetodo;
    }

    // Actualizar nombre/icono del método de pago
    async actualizarMetodoPago(negocioId, id, data) {
        if (!negocioId) {
            throw new AppError("ID de negocio es requerido.", 400, "MISSING_TENANT_ID");
        }
        const { MetodoPago } = await this._getModels(negocioId);

        const metodo = await MetodoPago.findByPk(id);
        if (!metodo) {
            throw new AppError("Método de pago no encontrado.", 404, "PAYMENT_METHOD_NOT_FOUND");
        }

        const updateFields = {};
        if (data.nombre !== undefined && data.nombre.trim() !== "") updateFields.nombre = data.nombre.trim();
        if (data.icono !== undefined) updateFields.icono = data.icono;
        if (data.activo !== undefined) updateFields.activo = !!data.activo;

        await metodo.update(updateFields);
        return metodo;
    }

    // Activar / Desactivar método de pago
    async toggleMetodoPago(negocioId, id) {
        if (!negocioId) {
            throw new AppError("ID de negocio es requerido.", 400, "MISSING_TENANT_ID");
        }
        const { MetodoPago } = await this._getModels(negocioId);

        const metodo = await MetodoPago.findByPk(id);
        if (!metodo) {
            throw new AppError("Método de pago no encontrado.", 404, "PAYMENT_METHOD_NOT_FOUND");
        }

        await metodo.update({ activo: !metodo.activo });
        return metodo;
    }

    // Eliminar método de pago del negocio
    async eliminarMetodoPago(negocioId, id) {
        if (!negocioId) {
            throw new AppError("ID de negocio es requerido.", 400, "MISSING_TENANT_ID");
        }
        const { MetodoPago } = await this._getModels(negocioId);

        const metodo = await MetodoPago.findByPk(id);
        if (!metodo) {
            throw new AppError("Método de pago no encontrado.", 404, "PAYMENT_METHOD_NOT_FOUND");
        }

        if (metodo.esFijo) {
            throw new AppError("No se puede eliminar un método de pago fijo del sistema.", 400, "CANNOT_DELETE_FIXED_PAYMENT_METHOD");
        }

        await metodo.destroy();
        return { message: "Método de pago eliminado exitosamente." };
    }

    // Método Único y Centralizado para procesar Cobros (1 o N pedidos, saldo a favor y transacción ACID)
    async procesarCobro(negocioId, params, options = {}) {
        if (!negocioId) {
            throw new AppError("ID de negocio es requerido.", 400, "MISSING_TENANT_ID");
        }
        const tenantContext = await connectionManager.getTenantDb(negocioId);
        const sequelize = tenantContext.sequelize || tenantContext;
        const outerTransaction = options.transaction;

        const executeTransaction = async (t) => {
            const { Pedido, DetallePedido, Cobro, Caja, MovimientoCaja, MetodoPago, CuentaCorriente } = await this._getModels(negocioId);

            let pedidosIds = params.pedidosIds || params.pedidoIds || [];
            if (!Array.isArray(pedidosIds) && (params.pedidoId || params.pedidoNumeroPedido)) {
                pedidosIds = [params.pedidoId || params.pedidoNumeroPedido];
            }

            if (!Array.isArray(pedidosIds) || pedidosIds.length === 0) {
                throw new AppError("Debe especificar al menos un pedido para cobrar.", 400, "MISSING_ORDER_ID");
            }

            // Buscar pedidos con sus detalles
            const pedidosTarget = await Pedido.findAll({
                where: { numeroPedido: pedidosIds },
                include: [{ model: DetallePedido, as: "detalles" }],
                transaction: t
            });

            if (pedidosTarget.length === 0) {
                throw new AppError("No se encontraron los pedidos especificados.", 404, "ORDER_NOT_FOUND");
            }

            for (const p of pedidosTarget) {
                const estadoVal = typeof p.estado === "object" ? p.estado?.nombre : p.estado;
                const estUpper = (estadoVal || "").toString().toUpperCase();
                if (estUpper.includes("CANCELAD")) {
                    throw new AppError(`No se puede cobrar el pedido #${p.numeroPedido} porque se encuentra cancelado.`, 400, "CANNOT_CHARGE_CANCELLED_ORDER");
                }
                if (p.cobrado) {
                    throw new AppError(`El pedido #${p.numeroPedido} ya se encuentra cobrado.`, 400, "ORDER_ALREADY_PAID");
                }
            }

            // Función de cálculo de monto real
            const calcularMontoReal = (p) => {
                let subtotalItems = 0;
                if (p.detalles && Array.isArray(p.detalles)) {
                    subtotalItems = p.detalles.reduce((acc, d) => {
                        const precio = parseFloat(d.precioHistorico) || parseFloat(d.precioUnitario) || 0;
                        const cant = parseInt(d.cantidad) || 1;
                        return acc + (precio * cant);
                    }, 0);
                }
                return parseFloat(p.total) > 0 ? parseFloat(p.total) : subtotalItems;
            };

            const totalMontoPedidos = pedidosTarget.reduce((acc, p) => acc + calcularMontoReal(p), 0);
            
            // Cliente asociado (si viene o de los pedidos)
            const clienteId = params.clienteId || pedidosTarget[0]?.clienteId;

            // Obtener saldo a favor disponible si fue solicitado
            let saldoAFavorDisponible = 0;
            if (params.aplicarSaldoAFavor && clienteId) {
                const cc = await CuentaCorriente.findOne({ where: { clienteId }, transaction: t });
                if (cc) saldoAFavorDisponible = Math.max(0, parseFloat(cc.saldo) || 0);
            }

            const creditoTotalUtilizable = params.aplicarSaldoAFavor ? Math.min(saldoAFavorDisponible, totalMontoPedidos) : 0;
            const remanenteTotalEfectivo = Math.max(0, totalMontoPedidos - creditoTotalUtilizable);

            const numRecibido = parseFloat(params.montoRecibido);
            const cashRecibidoReal = remanenteTotalEfectivo > 0 && !isNaN(numRecibido) ? numRecibido : 0;
            const permitirSaldoAFavorFinal = remanenteTotalEfectivo > 0 && !!params.dejarVueltoAFavor;

            // Método de pago
            let metodoId = params.metodoPagoId;
            if (!metodoId) {
                const metodoDefault = await MetodoPago.findOne({ where: { activo: true }, order: [["id", "ASC"]], transaction: t });
                if (metodoDefault) metodoId = metodoDefault.id;
            }

            // Buscar caja abierta obligatoria para registrar el cobro y asociar el movimiento
            const cajaAbierta = await Caja.findOne({ where: { estadoCaja: "Abierta" }, transaction: t });
            if (!cajaAbierta) {
                throw new AppError("No hay una caja abierta actualmente. Debe abrir la caja antes de registrar un cobro.", 400, "NO_OPEN_CASH_REGISTER");
            }

            const cobrosResultados = [];
            let saldoAFavorConsumidoTotal = 0;

            for (let i = 0; i < pedidosTarget.length; i++) {
                const p = pedidosTarget[i];
                const isLast = i === pedidosTarget.length - 1;
                const montoPedido = calcularMontoReal(p);

                // Si el total en la tabla figuraba en 0, actualizamos transparentemente el comprobante
                if (parseFloat(p.total || 0) === 0 && montoPedido > 0) {
                    await p.update({ total: montoPedido }, { transaction: t });
                }

                // Crédito aplicado a este pedido particular
                let creditoUsadoPedido = 0;
                if (params.aplicarSaldoAFavor && saldoAFavorDisponible > 0) {
                    creditoUsadoPedido = Math.min(saldoAFavorDisponible, montoPedido);
                    saldoAFavorDisponible -= creditoUsadoPedido;
                    saldoAFavorConsumidoTotal += creditoUsadoPedido;
                }

                // Descontar del saldo en Cuenta Corriente si aplicó crédito
                if (creditoUsadoPedido > 0 && clienteId) {
                    let cuenta = await CuentaCorriente.findOne({ where: { clienteId }, transaction: t });
                    if (cuenta) {
                        const nuevoSaldo = Math.max(0, (parseFloat(cuenta.saldo) || 0) - creditoUsadoPedido);
                        await cuenta.update({ saldo: nuevoSaldo }, { transaction: t });
                    }
                }

                const remanenteAbonarPedido = Math.max(0, montoPedido - creditoUsadoPedido);
                let pRecibido = remanenteAbonarPedido;
                let vueltoPedido = 0;
                let saldoGeneradoPedido = 0;

                if (isLast && remanenteTotalEfectivo > 0 && cashRecibidoReal > remanenteAbonarPedido) {
                    pRecibido = cashRecibidoReal;
                    const diferencia = cashRecibidoReal - remanenteAbonarPedido;
                    if (permitirSaldoAFavorFinal) {
                        saldoGeneradoPedido = diferencia;
                    } else {
                        vueltoPedido = diferencia;
                    }
                }

                // Generar movimiento de caja solo por dinero en efectivo físico recibido hoy
                let movimientoCajaId = null;
                if (cajaAbierta && remanenteAbonarPedido > 0) {
                    const numPed = p.numeroPedido || p.id;
                    const obsText = creditoUsadoPedido > 0
                        ? `Cobro Pedido #${numPed} (Crédito a favor aplicado: $${creditoUsadoPedido})`
                        : `Cobro Pedido #${numPed}`;

                    const nuevoMovimiento = await MovimientoCaja.create({
                        monto: remanenteAbonarPedido,
                        tipoMovimiento: "Ingreso por Venta",
                        observacion: obsText,
                        cajaIdCaja: cajaAbierta.idCaja
                    }, { transaction: t });
                    movimientoCajaId = nuevoMovimiento.id;
                }

                const nuevoCobro = await Cobro.create({
                    montoAbonado: montoPedido,
                    montoRecibidoEfectivo: pRecibido,
                    vueltoEntregado: vueltoPedido,
                    fechaHora: new Date(),
                    pedidoNumeroPedido: p.numeroPedido,
                    metodoPagoId: metodoId,
                    movimientoCajaId
                }, { transaction: t });

                // Marcar pedido como cobrado
                await p.update({ cobrado: true }, { transaction: t });

                // Si se generó saldo a favor por vuelto excedente, actualizar cuenta corriente
                if (saldoGeneradoPedido > 0 && clienteId) {
                    let cuenta = await CuentaCorriente.findOne({ where: { clienteId }, transaction: t });
                    if (cuenta) {
                        await cuenta.update({ saldo: (parseFloat(cuenta.saldo) || 0) + saldoGeneradoPedido }, { transaction: t });
                    } else {
                        await CuentaCorriente.create({ clienteId, saldo: saldoGeneradoPedido }, { transaction: t });
                    }
                }

                cobrosResultados.push({
                    id: nuevoCobro.id,
                    pedidoId: p.numeroPedido,
                    monto: montoPedido,
                    creditoUsado: creditoUsadoPedido,
                    remanenteAbonado: remanenteAbonarPedido,
                    vueltoEntregado: vueltoPedido,
                    saldoAFavorGenerado: saldoGeneradoPedido
                });
            }

            return {
                clienteId: clienteId ? parseInt(clienteId) : null,
                pedidosCobradosCount: cobrosResultados.length,
                totalMontoCobrado: totalMontoPedidos,
                creditoConsumidoTotal: saldoAFavorConsumidoTotal,
                cobros: cobrosResultados
            };
        };

        if (outerTransaction) {
            return await executeTransaction(outerTransaction);
        } else {
            return await sequelize.transaction(executeTransaction);
        }
    }

    // Registrar pago individual (Delegado al método único procesarCobro)
    async registrarPago(negocioId, params, options = {}) {
        const res = await this.procesarCobro(negocioId, params, options);
        const cobro = res.cobros[0];
        return {
            id: cobro?.id,
            pedidoId: cobro?.pedidoId,
            monto: cobro?.monto,
            montoAFavorGenerado: cobro?.saldoAFavorGenerado,
            vueltoEntregado: cobro?.vueltoEntregado,
            estado: "COMPLETADO"
        };
    }

    // Obtener saldos a favor de un cliente
    async obtenerSaldosAFavorCliente(negocioId, clienteId) {
        if (!negocioId) {
            throw new AppError("ID de negocio es requerido.", 400, "MISSING_TENANT_ID");
        }
        const { CuentaCorriente } = await this._getModels(negocioId);

        const cuenta = await CuentaCorriente.findOne({ where: { clienteId } });
        if (!cuenta || (parseFloat(cuenta.saldo) || 0) <= 0) {
            return [];
        }

        return [
            {
                id: cuenta.id,
                clienteId,
                montoDisponible: parseFloat(cuenta.saldo),
                descripcion: "Saldo acumulado en cuenta corriente"
            }
        ];
    }
}

export const pagosService = new PagosService();

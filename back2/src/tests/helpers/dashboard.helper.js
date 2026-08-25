import { connectionManager } from "../../models/connectionManager.js";
import { createTestTenantWithAdmin } from "./auth.helper.js";

/**
 * Aprovisiona un tenant completo para tests de Dashboard con Admin y modelos tenant
 */
export const setupTenantForDashboardTest = async (options = {}) => {
    const fixture = await createTestTenantWithAdmin(options);
    const tenantDb = await connectionManager.getTenantDb(fixture.negocio.id);
    return {
        ...fixture,
        adminToken: fixture.token,
        tenantDb,
        models: tenantDb.models
    };
};

/**
 * Crea un cliente en el tenant especificado
 */
export const createDashboardClienteFixture = async (negocioId, data = {}) => {
    const tenantDb = await connectionManager.getTenantDb(negocioId);
    const { Cliente, CuentaCorriente } = tenantDb.models;

    const uniqueSuffix = `${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const nombre = data.nombre || `Cliente_${uniqueSuffix}`;
    const apellido = data.apellido !== undefined ? data.apellido : "Dashboard";
    const telefono = data.telefono || `11${Math.floor(10000000 + Math.random() * 90000000)}`;
    const email = data.email || `dash_${uniqueSuffix}@test.com`;

    const cliente = await Cliente.create({
        nombre,
        apellido,
        telefono,
        email,
        direccion: "Av. Corrientes 1234",
        activo: true,
        negocioId
    });

    await CuentaCorriente.findOrCreate({
        where: { clienteId: cliente.id },
        defaults: { clienteId: cliente.id, saldo: 0 }
    });

    return cliente;
};

/**
 * Crea un pedido con fecha y estado específicos para pruebas de métricas
 */
export const createDashboardPedidoFixture = async (negocioId, clienteId, data = {}) => {
    const tenantDb = await connectionManager.getTenantDb(negocioId);
    const { Pedido, DetallePedido, Servicio } = tenantDb.models;

    const numeroPedido = data.numeroPedido || Math.floor(100000 + Math.random() * 900000);
    const total = data.total !== undefined ? parseFloat(data.total) : 1000;
    const estado = data.estado || "Entregado";
    const cobrado = data.cobrado !== undefined ? data.cobrado : true;
    const fechaHoraCreacion = data.fechaHoraCreacion || new Date();
    const fechaHoraPedido = data.fechaHoraPedido || fechaHoraCreacion;
    const fechaHoraEntregaEstimada = data.fechaHoraEntregaEstimada || null;

    let servicio = await Servicio.findOne({ where: { negocioId } });
    if (!servicio) {
        servicio = await Servicio.create({
            nombre: "Lavado Estándar",
            precio: total,
            activo: true,
            negocioId
        });
    }

    const pedido = await Pedido.create({
        numeroPedido,
        clienteId,
        total,
        costoEnvio: 0,
        estado,
        cobrado,
        fechaHoraPedido,
        fechaHoraCreacion,
        fechaHoraEntregaEstimada,
        negocioId
    });

    await DetallePedido.create({
        pedidoId: pedido.id || pedido.numeroPedido,
        servicioId: servicio.id,
        cantidad: 1,
        precioHistorico: total
    });

    return pedido;
};

/**
 * Registra un movimiento de caja ('Ingreso por Venta' o similar) con fecha específica
 */
export const createDashboardMovimientoCajaFixture = async (negocioId, idCaja, data = {}) => {
    const tenantDb = await connectionManager.getTenantDb(negocioId);
    const { MovimientoCaja } = tenantDb.models;

    const monto = data.monto !== undefined ? parseFloat(data.monto) : 1000;
    const tipoMovimiento = data.tipoMovimiento || "Ingreso por Venta";
    const concepto = data.concepto || "Cobro de pedido de prueba";
    const metodoPago = data.metodoPago || "Efectivo";
    const fechaHora = data.fechaHora || new Date();

    const movimiento = await MovimientoCaja.create({
        idCaja: idCaja || 1,
        monto,
        tipoMovimiento,
        concepto,
        metodoPago,
        fechaHora,
        negocioId
    });

    return movimiento;
};

/**
 * Abre una caja para el empleado en el tenant
 */
export const openDashboardCajaFixture = async (negocioId, empleadoId, montoInicial = 5000) => {
    const tenantDb = await connectionManager.getTenantDb(negocioId);
    const { Caja } = tenantDb.models;

    await Caja.update(
        { estadoCaja: "Cerrada", fechaCierre: new Date() },
        { where: { negocioId, empleadoId, estadoCaja: "Abierta" } }
    );

    const caja = await Caja.create({
        negocioId,
        empleadoId,
        fechaApertura: new Date(),
        montoInicial,
        montoFinal: null,
        estadoCaja: "Abierta"
    });

    return caja;
};

/**
 * Cierra todas las cajas activas para el tenant
 */
export const closeDashboardCajaFixture = async (negocioId) => {
    const tenantDb = await connectionManager.getTenantDb(negocioId);
    const { Caja } = tenantDb.models;

    await Caja.update(
        { estadoCaja: "Cerrada", fechaCierre: new Date() },
        { where: { negocioId, estadoCaja: "Abierta" } }
    );
};

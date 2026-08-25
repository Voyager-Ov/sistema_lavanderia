import { connectionManager } from "../../models/connectionManager.js";
import { createTestTenantWithAdmin, buildValidJwt, generateUniqueEmail } from "./auth.helper.js";

/**
 * Aprovisiona un tenant completo para tests con Admin y modelos tenant inicializados
 */
export const setupTenantForTest = async (options = {}) => {
    const fixture = await createTestTenantWithAdmin(options);
    const tenantDb = await connectionManager.getTenantDb(fixture.negocio.id);
    return {
        ...fixture,
        tenantDb,
        models: tenantDb.models
    };
};

/**
 * Crea un cliente con su CuentaCorriente inicial en el tenant especificado
 */
export const createClienteFixture = async (negocioId, data = {}) => {
    const tenantDb = await connectionManager.getTenantDb(negocioId);
    const { Cliente, CuentaCorriente } = tenantDb.models;

    const uniqueSuffix = `${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const nombre = data.nombre || `Cliente_${uniqueSuffix}`;
    const apellido = data.apellido !== undefined ? data.apellido : "Test";
    const telefono = data.telefono !== undefined ? data.telefono : `11${Math.floor(10000000 + Math.random() * 90000000)}`;
    const email = data.email !== undefined ? data.email : `cliente_${uniqueSuffix}@lavanderia.test`;
    const direccion = data.direccion !== undefined ? data.direccion : "Calle Falsa 123";

    const cliente = await Cliente.create({
        nombre,
        apellido,
        telefono,
        email,
        direccion,
        activo: data.activo !== undefined ? data.activo : true,
        negocioId
    });

    const saldoInicial = data.saldoInicial !== undefined ? parseFloat(data.saldoInicial) : 0;
    const [cuentaCorriente] = await CuentaCorriente.findOrCreate({
        where: { clienteId: cliente.id },
        defaults: { clienteId: cliente.id, saldo: saldoInicial }
    });

    if (saldoInicial !== 0) {
        await cuentaCorriente.update({ saldo: saldoInicial });
    }

    return {
        cliente,
        cuentaCorriente,
        id: cliente.id
    };
};

/**
 * Crea un pedido con sus detalles y estado en el tenant especificado
 */
export const createPedidoFixture = async (negocioId, clienteId, data = {}) => {
    const tenantDb = await connectionManager.getTenantDb(negocioId);
    const { Pedido, DetallePedido, Servicio } = tenantDb.models;

    const numeroPedido = data.numeroPedido || Math.floor(100000 + Math.random() * 900000);
    const total = data.total !== undefined ? parseFloat(data.total) : 1000;
    const estado = data.estado || "Entregado";
    const cobrado = data.cobrado !== undefined ? data.cobrado : false;

    // Crear un servicio de soporte si no existe
    let servicio = await Servicio.findOne({ where: { negocioId } });
    if (!servicio) {
        servicio = await Servicio.create({
            nombre: "Lavado General Test",
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
        fechaHoraPedido: data.fechaHoraPedido || new Date(),
        fechaHoraCreacion: data.fechaHoraCreacion || new Date(),
        negocioId
    });

    const items = data.items || [{ cantidad: 1, precioHistorico: total }];
    for (const it of items) {
        await DetallePedido.create({
            pedidoId: pedido.id || pedido.numeroPedido,
            servicioId: servicio.id,
            cantidad: it.cantidad || 1,
            precioHistorico: it.precioHistorico !== undefined ? it.precioHistorico : total
        });
    }

    return pedido;
};

/**
 * Abre una caja para el empleado en el tenant
 */
export const openCajaFixture = async (negocioId, empleadoId, montoInicial = 5000) => {
    const tenantDb = await connectionManager.getTenantDb(negocioId);
    const { Caja } = tenantDb.models;

    // Cerrar cajas previas abiertas
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
 * Cierra todas las cajas activas para probar compuertas 400
 */
export const closeCajaFixture = async (negocioId, empleadoId) => {
    const tenantDb = await connectionManager.getTenantDb(negocioId);
    const { Caja } = tenantDb.models;

    await Caja.update(
        { estadoCaja: "Cerrada", fechaCierre: new Date() },
        { where: { negocioId, ...(empleadoId ? { empleadoId } : {}) } }
    );
};

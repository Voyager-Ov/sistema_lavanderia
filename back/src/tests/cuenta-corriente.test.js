import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import request from 'supertest';
import app from '../app.js';
import { sequelize, connectionManager } from '../models/index.js';
import bcrypt from 'bcryptjs';

jest.setTimeout(25000);

describe('Pruebas de Cuenta Corriente y Gestión de Saldos a Favor (Libro Mayor)', () => {
    let tenantModels, adminToken, empleadoToken, cliente, metodoEfectivo, cajaAbierta;

    beforeAll(async () => {
        await connectionManager.initCentral();
        await connectionManager.centralDb.sync({ force: true });

        const negocio = await connectionManager.centralModels.Negocio.create({
            nombre: 'Lavandería Test Cuenta Corriente',
            estadoSuscripcion: 'ACTIVA'
        });

        // Inicializar Tenant DB
        const tenantContext = await connectionManager.getTenantDb(negocio.id, true);
        tenantModels = tenantContext.models;

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash('Password123', salt);

        await connectionManager.centralModels.Usuario.create({
            negocioId: negocio.id,
            nombre: 'Admin CC',
            email: 'admin_cc@test.com',
            passwordHash,
            rol: 'ADMIN',
            activo: true,
            emailVerificado: true
        });

        const empleado = await connectionManager.centralModels.Usuario.create({
            negocioId: negocio.id,
            nombre: 'Emp CC',
            email: 'emp_cc@test.com',
            passwordHash,
            rol: 'EMPLEADO',
            activo: true,
            emailVerificado: true
        });

        const resAdmin = await request(app).post('/api/auth/login').send({ email: 'admin_cc@test.com', password: 'Password123' });
        adminToken = resAdmin.body.data.token;

        const resEmp = await request(app).post('/api/auth/login').send({ email: 'emp_cc@test.com', password: 'Password123' });
        empleadoToken = resEmp.body.data.token;

        // Crear Cliente
        cliente = await tenantModels.Cliente.create({
            negocioId: negocio.id,
            nombre: 'Carlos Gómez',
            telefono: '3519998888',
            email: 'carlos@test.com'
        });

        // Crear Método de Pago Efectivo
        metodoEfectivo = await tenantModels.MetodoPago.create({
            negocioId: negocio.id,
            nombre: 'Efectivo',
            activo: true
        });

        // Abrir Caja para el empleado
        cajaAbierta = await tenantModels.Caja.create({
            negocioId: negocio.id,
            usuarioId: empleado.id,
            montoInicial: 10000.00,
            estado: 'ABIERTA'
        });
    });

    afterAll(async () => {
        await sequelize.close();
    });

    it('1. Debe calcular estado de cuenta en 0 para un cliente nuevo', async () => {
        const res = await request(app)
            .get(`/api/clientes/${cliente.id}/cuenta-corriente/estado-cuenta`)
            .set('Authorization', `Bearer ${empleadoToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data.resumen.deudaExigible).toBe(0);
        expect(res.body.data.resumen.totalCreditoDisponible).toBe(0);
        expect(res.body.data.resumen.saldoNeto).toBe(0);
    });

    it('2. Admin puede emitir un ajuste manual de crédito a favor (201)', async () => {
        const res = await request(app)
            .post(`/api/clientes/${cliente.id}/cuenta-corriente/ajuste-credito`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                monto: 3000.00,
                motivo: 'Compensación por prenda demorada'
            });

        expect(res.status).toBe(201);
        expect(parseFloat(res.body.data.montoOriginal)).toBe(3000);
        expect(parseFloat(res.body.data.montoDisponible)).toBe(3000);
        expect(res.body.data.estado).toBe('DISPONIBLE');
    });

    it('3. Debe reflejar el crédito a favor en el estado de cuenta', async () => {
        const res = await request(app)
            .get(`/api/clientes/${cliente.id}/cuenta-corriente/estado-cuenta`)
            .set('Authorization', `Bearer ${empleadoToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data.resumen.totalCreditoDisponible).toBe(3000);
        expect(res.body.data.resumen.saldoNeto).toBe(3000);
    });

    it('4. Debe cobrar un pedido aplicando saldo a favor de forma transparente', async () => {
        // Crear un pedido entregado de $5000 sin cobrar
        const pedido = await tenantModels.Pedido.create({
            codigoSeguimiento: 'PED-CC-001',
            negocioId: cliente.negocioId,
            clienteId: cliente.id,
            estado: 'ENTREGADO',
            total: 5000.00,
            cobrado: false
        });

        // Cobrar aplicando $3000 de saldo a favor + $2000 en efectivo
        const resPago = await request(app)
            .post('/api/pagos')
            .set('Authorization', `Bearer ${empleadoToken}`)
            .send({
                pedidoId: pedido.id,
                metodoPagoId: metodoEfectivo.id,
                montoRecibido: 2000.00,
                aplicarSaldoAFavor: true
            });

        expect(resPago.status).toBe(201);
        expect(parseFloat(resPago.body.data.monto)).toBe(5000);
        expect(parseFloat(resPago.body.data.montoEfectivoTarjeta)).toBe(2000);
        expect(parseFloat(resPago.body.data.montoCreditoAplicado)).toBe(3000);

        // Verificar que el crédito anterior quedó en CONSUMIDO_TOTAL
        const creditosRes = await request(app)
            .get(`/api/clientes/${cliente.id}/cuenta-corriente/creditos`)
            .set('Authorization', `Bearer ${empleadoToken}`);

        expect(creditosRes.body.data.length).toBe(0); // Ya no hay créditos disponibles > 0
    });

    it('5. Debe permitir sobrepago en efectivo dejando vuelto a favor del cliente', async () => {
        const pedido2 = await tenantModels.Pedido.create({
            codigoSeguimiento: 'PED-CC-002',
            negocioId: cliente.negocioId,
            clienteId: cliente.id,
            estado: 'ENTREGADO',
            total: 4000.00,
            cobrado: false
        });

        // Cliente paga $5000 en efectivo para un pedido de $4000 y pide dejar $1000 a favor
        const resPago = await request(app)
            .post('/api/pagos')
            .set('Authorization', `Bearer ${empleadoToken}`)
            .send({
                pedidoId: pedido2.id,
                metodoPagoId: metodoEfectivo.id,
                montoRecibido: 5000.00,
                dejarVueltoAFavor: true
            });

        expect(resPago.status).toBe(201);
        expect(parseFloat(resPago.body.data.montoAFavorGenerado)).toBe(1000);
        expect(parseFloat(resPago.body.data.montoEfectivoTarjeta)).toBe(5000);

        // Verificar estado de cuenta con nuevo crédito de $1000
        const estadoRes = await request(app)
            .get(`/api/clientes/${cliente.id}/cuenta-corriente/estado-cuenta`)
            .set('Authorization', `Bearer ${empleadoToken}`);

        expect(estadoRes.body.data.resumen.totalCreditoDisponible).toBe(1000);
    });

    it('6. Liquidación masiva de deudas (cobrar-deuda) para múltiples pedidos entregados', async () => {
        // Crear 2 pedidos entregados adeudados
        const pedidoA = await tenantModels.Pedido.create({
            codigoSeguimiento: 'PED-CC-003',
            negocioId: cliente.negocioId,
            clienteId: cliente.id,
            estado: 'ENTREGADO',
            total: 2000.00,
            cobrado: false
        });

        const pedidoB = await tenantModels.Pedido.create({
            codigoSeguimiento: 'PED-CC-004',
            negocioId: cliente.negocioId,
            clienteId: cliente.id,
            estado: 'ENTREGADO',
            total: 3000.00,
            cobrado: false
        });

        // Deuda total = $5000. Disponemos de $1000 de saldo a favor + aportamos $4000 en efectivo
        const resCobro = await request(app)
            .post(`/api/clientes/${cliente.id}/cuenta-corriente/cobrar-deuda`)
            .set('Authorization', `Bearer ${empleadoToken}`)
            .send({
                pedidosIds: [pedidoA.id, pedidoB.id],
                metodoPagoId: metodoEfectivo.id,
                montoRecibido: 4000.00,
                aplicarSaldoAFavor: true
            });

        expect(resCobro.status).toBe(200);
        expect(resCobro.body.data.pedidosSaldadosCount).toBe(2);
        expect(resCobro.body.data.totalLiquidado).toBe(5000);

        // Verificar ambos pedidos como cobrados en la BD
        const pARefresh = await tenantModels.Pedido.findByPk(pedidoA.id);
        const pBRefresh = await tenantModels.Pedido.findByPk(pedidoB.id);
        expect(pARefresh.cobrado).toBe(true);
        expect(pBRefresh.cobrado).toBe(true);
    });

    it('7. Cancelación de pedido cobrado con política de reintegro a saldo a favor', async () => {
        const pedidoC = await tenantModels.Pedido.create({
            codigoSeguimiento: 'PED-CC-005',
            negocioId: cliente.negocioId,
            clienteId: cliente.id,
            estado: 'PENDIENTE',
            total: 2500.00,
            cobrado: false
        });

        // Se cobra por adelantado
        await request(app)
            .post('/api/pagos')
            .set('Authorization', `Bearer ${empleadoToken}`)
            .send({
                pedidoId: pedidoC.id,
                metodoPagoId: metodoEfectivo.id,
                montoRecibido: 2500.00
            });

        // Se cancela el pedido solicitando reintegro a saldo a favor
        const resCancel = await request(app)
            .patch(`/api/pedidos/${pedidoC.id}/estado`)
            .set('Authorization', `Bearer ${empleadoToken}`)
            .send({
                estado: 'CANCELADO',
                motivoCancelacion: 'Imposible remover mancha difícil',
                accionDinero: 'SALDO_A_FAVOR'
            });

        expect(resCancel.status).toBe(200);
        expect(resCancel.body.data.estado).toBe('CANCELADO');

        // Verificar que se acreditó $2500 como nuevo saldo a favor
        const estadoRes = await request(app)
            .get(`/api/clientes/${cliente.id}/cuenta-corriente/estado-cuenta`)
            .set('Authorization', `Bearer ${empleadoToken}`);

        expect(estadoRes.body.data.resumen.totalCreditoDisponible).toBe(2500);
    });

    it('8. Debe listar los movimientos cronológicos en el Libro Mayor', async () => {
        const res = await request(app)
            .get(`/api/clientes/${cliente.id}/cuenta-corriente/movimientos`)
            .set('Authorization', `Bearer ${empleadoToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data.items.length).toBeGreaterThan(0);
        expect(res.body.data.meta).toHaveProperty('total');
    });
});

import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import request from 'supertest';
import app from '../app.js';
import { sequelize, models, connectionManager } from '../models/index.js';
import bcrypt from 'bcryptjs';


jest.setTimeout(15000);

describe('Pruebas del Módulo Financiero (Cajas, Pagos, Gastos)', () => {
    let tenantModels, adminToken, empleadoToken, negocioId, empleadoId, metodoPagoId, pedidoId, cajaId;

    beforeAll(async () => {
        await connectionManager.initCentral();
        await connectionManager.centralDb.sync({ force: true });
        
        const negocio = await connectionManager.centralModels.Negocio.create({ nombre: 'Lavandería Finanzas', estadoSuscripcion: 'ACTIVA' });
        
        // Inicializar Tenant DB
        await connectionManager.getTenantDb(negocio.id);
        tenantModels = (await connectionManager.getTenantDb(negocio.id)).models;
        negocioId = negocio.id;
        
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash('Password123', salt);
        
        await connectionManager.centralModels.Usuario.create({ negocioId: negocio.id, nombre: 'Admin', email: 'admin_fin@test.com', passwordHash, rol: 'ADMIN', activo: true, emailVerificado: true });
        const empleado = await connectionManager.centralModels.Usuario.create({ negocioId: negocio.id, nombre: 'Emp', email: 'emp_fin@test.com', passwordHash, rol: 'EMPLEADO', activo: true, emailVerificado: true });
        empleadoId = empleado.id;

        const metodo = await tenantModels.MetodoPago.create({ negocioId, nombre: 'Efectivo', esFijo: true });
        metodoPagoId = metodo.id;

        const cliente = await tenantModels.Cliente.create({ negocioId, nombre: "Cliente F", telefono: "1231231" });
        const pedido = await tenantModels.Pedido.create({ 
            negocioId, 
            clienteId: cliente.id,
            creadoPorId: empleado.id, 
            estado: 'PENDIENTE', 
            codigoSeguimiento: 'FIN-123',
            total: 5000 
        });
        pedidoId = pedido.id;

        const resAdmin = await request(app).post('/api/auth/login').send({ email: 'admin_fin@test.com', password: 'Password123' });
        adminToken = resAdmin.body.data.token;

        const resEmp = await request(app).post('/api/auth/login').send({ email: 'emp_fin@test.com', password: 'Password123' });
        empleadoToken = resEmp.body.data.token;
    });

    afterAll(async () => {
        await sequelize.close();
    });

    // --- CAJAS ---
    it('Debe rechazar registrar gasto si NO hay caja abierta (400)', async () => {
        const response = await request(app).post('/api/gastos').set('Authorization', `Bearer ${empleadoToken}`).send({ 
            monto: 500, categoria: 'Insumos' 
        });
        expect(response.status).toBe(400);
        expect(response.body.error).toMatch(/Debe abrir una caja/i);
    });

    it('El Empleado debe poder abrir una caja con monto inicial (201)', async () => {
        const response = await request(app).post('/api/cajas/abrir').set('Authorization', `Bearer ${empleadoToken}`).send({ 
            montoInicial: 1000 
        });
        expect(response.status).toBe(201);
        expect(response.body.data.estado).toBe('ABIERTA');
        expect(parseFloat(response.body.data.montoInicial)).toBe(1000);
        cajaId = response.body.data.id;
    });

    // --- GASTOS CON RBAC ---
    it('Un empleado NO debe poder registrar gastos de "Nomina" (403)', async () => {
        const response = await request(app).post('/api/gastos').set('Authorization', `Bearer ${empleadoToken}`).send({ 
            monto: 5000, categoria: 'Nomina', descripcion: 'Sueldo' 
        });
        expect(response.status).toBe(403);
    });

    it('Un empleado DEBE poder registrar gastos de "Insumos" (201)', async () => {
        const response = await request(app).post('/api/gastos').set('Authorization', `Bearer ${empleadoToken}`).send({ 
            monto: 200, categoria: 'Insumos', descripcion: 'Compre jabón' 
        });
        expect(response.status).toBe(201);
    });

    // --- PAGOS ---
    it('El Empleado debe poder cobrar un Pedido (201)', async () => {
        const response = await request(app).post('/api/pagos').set('Authorization', `Bearer ${empleadoToken}`).send({ 
            pedidoId, metodoPagoId, monto: 5000 
        });
        expect(response.status).toBe(201);
        expect(response.body.data.estado).toBe('COMPLETADO');
    });

    it('Consultar Caja Actual debe reflejar los totales en vivo (200)', async () => {
        const response = await request(app).get('/api/cajas/actual').set('Authorization', `Bearer ${empleadoToken}`);
        expect(response.status).toBe(200);
        // Monto Inicial (1000) + Ingresos (5000) - Egresos (200) = 5800
        expect(response.body.data.totalIngresosEnVivo).toBe(5000);
        expect(response.body.data.totalEgresosEnVivo).toBe(200);
        expect(response.body.data.efectivoEsperadoEnVivo).toBe(5800);
    });

    // --- ANULACIÓN DE PAGOS ---
    it('El Empleado debe poder anular un cobro y que el estado sea ANULADO (200)', async () => {
        // Obtenemos el pago
        const pagoAbierto = await tenantModels.Pago.findOne({ where: { pedidoId } });
        const response = await request(app).patch(`/api/pagos/${pagoAbierto.id}/anular`).set('Authorization', `Bearer ${empleadoToken}`);
        expect(response.status).toBe(200);
        
        // Verificamos caja en vivo
        const cajaRes = await request(app).get('/api/cajas/actual').set('Authorization', `Bearer ${empleadoToken}`);
        expect(cajaRes.body.data.totalIngresosEnVivo).toBe(0); // El pago fue anulado
        expect(cajaRes.body.data.efectivoEsperadoEnVivo).toBe(800); // 1000 - 200
    });

    // --- CIERRE DE CAJA ---
    it('El Empleado debe poder cerrar su caja con arqueo (200)', async () => {
        const response = await request(app).post(`/api/cajas/${cajaId}/cerrar`).set('Authorization', `Bearer ${empleadoToken}`).send({ 
            efectivoReal: 800 
        });
        expect(response.status).toBe(200);
        expect(response.body.data.estado).toBe('CERRADA');
        expect(response.body.data.diferenciaEfectivo).toBe(0); // 800 - 800 = 0
    });
});

import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import request from 'supertest';
import app from '../app.js';
import { sequelize, connectionManager } from '../models/index.js';
import bcrypt from 'bcryptjs';

jest.setTimeout(15000);

describe('Pruebas del Módulo Dashboard y WebSockets', () => {
    let tenantModels, adminToken, negocioId, cajaId, metodoPagoId, pedidoId;

    beforeAll(async () => {
        await connectionManager.initCentral();
        await connectionManager.centralDb.sync({ force: true });
        
        const negocio = await connectionManager.centralModels.Negocio.create({ nombre: 'Lavandería Dashboard', estadoSuscripcion: 'ACTIVA' });
        
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash('Password123!', salt);
        
        await connectionManager.centralModels.Usuario.create({ 
            negocioId: negocio.id, nombre: 'Admin', email: 'admin_dash@test.com', 
            passwordHash, rol: 'ADMIN', activo: true, emailVerificado: true 
        });
        
        // Inicializar Tenant DB y Semillas
        await connectionManager.getTenantDb(negocio.id);
        tenantModels = (await connectionManager.getTenantDb(negocio.id)).models;
        negocioId = negocio.id;

        const resAdmin = await request(app).post('/api/auth/login').send({
            email: 'admin_dash@test.com',
            password: 'Password123!'
        });
        if (!resAdmin.body.data) {
            console.error("LOGIN FAILED:", resAdmin.body);
        }
        adminToken = resAdmin.body.data.token;

        // Semillas operativas
        const metodo = await tenantModels.MetodoPago.create({ negocioId, nombre: 'MercadoPago QR', esFijo: false });
        metodoPagoId = metodo.id;

        const caja = await tenantModels.Caja.create({
            negocioId,
            usuarioId: 1, // ID temporal
            montoInicial: 1000,
            estado: 'ABIERTA'
        });
        cajaId = caja.id;

        const cliente = await tenantModels.Cliente.create({ negocioId, nombre: "Cliente D", telefono: "111" });
        const pedido = await tenantModels.Pedido.create({ 
            negocioId, 
            clienteId: cliente.id,
            creadoPorId: 1, 
            estado: 'PENDIENTE', 
            codigoSeguimiento: 'DASH-123',
            total: 5000 
        });
        pedidoId = pedido.id;

        // Registrar un pago
        await tenantModels.Pago.create({
            pedidoId,
            registradoPorId: 1,
            metodoPagoId,
            cajaId,
            monto: 5000,
            estado: "COMPLETADO"
        });
    });

    afterAll(async () => {
        await sequelize.close();
    });

    it('Debe obtener las estadísticas principales del Dashboard (200)', async () => {
        const response = await request(app)
            .get('/api/dashboard/stats')
            .set('Authorization', `Bearer ${adminToken}`);
        
        expect(response.status).toBe(200);
        expect(response.body.data).toHaveProperty('ingresos');
        expect(response.body.data.ingresos.mesActual).toBe(5000); // El pago que registramos
        expect(response.body.data).toHaveProperty('pedidosActivos');
        expect(response.body.data.pedidosActivos.PENDIENTE).toBe(1);
    });

    it('Debe obtener el Cierre de Caja agrupado por método de pago (200)', async () => {
        const response = await request(app)
            .get(`/api/dashboard/caja/${cajaId}`)
            .set('Authorization', `Bearer ${adminToken}`);
        
        expect(response.status).toBe(200);
        expect(response.body.data.totalRecaudado).toBe(5000);
        
        // Comprobamos el agrupamiento dinámico que pidió el usuario
        expect(response.body.data.desglosePorMetodo).toHaveProperty('MercadoPago QR');
        expect(response.body.data.desglosePorMetodo['MercadoPago QR']).toBe(5000);
    });
});

import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import request from 'supertest';
import app from '../app.js';
import { sequelize, models, connectionManager } from '../models/index.js';
import bcrypt from 'bcryptjs';

jest.setTimeout(15000);


describe('Pruebas del Módulo de Clientes', () => {
    let tenantModels, adminToken, empleadoToken, clienteId;

    beforeAll(async () => {
        await connectionManager.initCentral();
        await connectionManager.centralDb.sync({ force: true });
        
        const negocio = await connectionManager.centralModels.Negocio.create({ nombre: 'Lavandería Test Clientes', estadoSuscripcion: 'ACTIVA' });
        
        // Inicializar Tenant DB
        await connectionManager.getTenantDb(negocio.id);
        tenantModels = (await connectionManager.getTenantDb(negocio.id)).models;
        
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash('Password123', salt);
        
        await connectionManager.centralModels.Usuario.create({ negocioId: negocio.id, nombre: 'Admin', email: 'admin_cli@test.com', passwordHash, rol: 'ADMIN', activo: true, emailVerificado: true });
        await connectionManager.centralModels.Usuario.create({ negocioId: negocio.id, nombre: 'Emp', email: 'emp_cli@test.com', passwordHash, rol: 'EMPLEADO', activo: true, emailVerificado: true });

        const resAdmin = await request(app).post('/api/auth/login').send({ email: 'admin_cli@test.com', password: 'Password123' });
        adminToken = resAdmin.body.data.token;

        const resEmp = await request(app).post('/api/auth/login').send({ email: 'emp_cli@test.com', password: 'Password123' });
        empleadoToken = resEmp.body.data.token;
    });

    afterAll(async () => {
        await sequelize.close();
    });

    it('Un empleado debe poder crear un Cliente (201)', async () => {
        const response = await request(app)
            .post('/api/clientes')
            .set('Authorization', `Bearer ${empleadoToken}`)
            .send({ nombre: 'Cliente Uno', telefono: '111111111', email: 'cliente@test.com' });

        expect(response.status).toBe(201);
        expect(response.body.data).toHaveProperty('id');
        clienteId = response.body.data.id;
    });

    it('No debe permitir crear cliente sin teléfono (400 - Validación)', async () => {
        const response = await request(app)
            .post('/api/clientes')
            .set('Authorization', `Bearer ${empleadoToken}`)
            .send({ nombre: 'Sin Telefono' });

        expect(response.status).toBe(400);
        expect(response.body.detalles[0].mensaje).toMatch(/teléfono es obligatorio/i);
    });

    it('No debe permitir crear un cliente con el mismo teléfono (400 Lógica)', async () => {
        const response = await request(app)
            .post('/api/clientes')
            .set('Authorization', `Bearer ${adminToken}`) // Admin intenta crear
            .send({ nombre: 'Copia', telefono: '111111111' });

        expect(response.status).toBe(400);
        expect(response.body.error).toMatch(/Ya existe un cliente con ese teléfono/i);
    });

    it('Un empleado debe poder consultar los clientes (200)', async () => {
        const response = await request(app).get('/api/clientes').set('Authorization', `Bearer ${empleadoToken}`);
        expect(response.status).toBe(200);
        expect(response.body.data.items.length).toBe(1);
    });

    it('Un empleado debe poder consultar el detalle del cliente y sus pedidos (200)', async () => {
        const response = await request(app).get(`/api/clientes/${clienteId}`).set('Authorization', `Bearer ${empleadoToken}`);
        expect(response.status).toBe(200);
        expect(response.body.data).toHaveProperty('pedidos');
    });

    it('Debe poder actualizar los datos del cliente (200)', async () => {
        const response = await request(app).put(`/api/clientes/${clienteId}`).set('Authorization', `Bearer ${empleadoToken}`).send({ 
            nombre: 'Cliente Actualizado' 
        });
        expect(response.status).toBe(200);
        expect(response.body.data.nombre).toBe('Cliente Actualizado');
    });

    it('Debe fallar al dar de baja sin enviar motivoBaja (400 - Validación)', async () => {
        const response = await request(app).patch(`/api/clientes/${clienteId}/estado`).set('Authorization', `Bearer ${empleadoToken}`).send({});
        expect(response.status).toBe(400);
    });

    it('Debe aplicar Soft Delete con motivo (200)', async () => {
        const response = await request(app).patch(`/api/clientes/${clienteId}/estado`).set('Authorization', `Bearer ${empleadoToken}`).send({ 
            motivoBaja: 'Ya no viene' 
        });
        expect(response.status).toBe(200);
        
        // Verificamos que ya no salga en el listado general
        const getRes = await request(app).get('/api/clientes').set('Authorization', `Bearer ${empleadoToken}`);
        const found = getRes.body.data.items.find(c => c.id === clienteId);
        expect(found).toBeUndefined();
    });
});

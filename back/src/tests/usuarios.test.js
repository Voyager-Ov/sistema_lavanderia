import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import request from 'supertest';
import app from '../app.js';
import { sequelize, models, connectionManager } from '../models/index.js';
import bcrypt from 'bcryptjs';


jest.setTimeout(15000);

describe('Pruebas del Módulo de Usuarios (Empleados)', () => {
    let tenantModels, adminToken, empleadoToken, negocioIdCreado, empleadoId;

    beforeAll(async () => {
        await connectionManager.initCentral();
        await connectionManager.centralDb.sync({ force: true });
        
        const negocio = await connectionManager.centralModels.Negocio.create({
            nombre: 'Lavandería Test Usuarios',
            estadoSuscripcion: 'ACTIVA'
        });
        
        // Inicializar Tenant DB
        await connectionManager.getTenantDb(negocio.id);
        tenantModels = (await connectionManager.getTenantDb(negocio.id)).models;
        negocioIdCreado = negocio.id;

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash('Password123', salt);
        
        const admin = await connectionManager.centralModels.Usuario.create({
            negocioId: negocio.id,
            nombre: 'Admin Test',
            email: 'admin_users@test.com',
            passwordHash,
            rol: 'ADMIN',
            activo: true,
            emailVerificado: true
        });

        const empleado = await connectionManager.centralModels.Usuario.create({
            negocioId: negocio.id,
            nombre: 'Empleado Test',
            email: 'empleado_users@test.com',
            passwordHash,
            rol: 'EMPLEADO',
            activo: true,
            emailVerificado: true
        });
        empleadoId = empleado.id;

        // Login para obtener tokens
        const resAdmin = await request(app).post('/api/auth/login').send({ email: 'admin_users@test.com', password: 'Password123' });
        adminToken = resAdmin.body.data.token;

        const resEmpleado = await request(app).post('/api/auth/login').send({ email: 'empleado_users@test.com', password: 'Password123' });
        empleadoToken = resEmpleado.body.data.token;
    });

    afterAll(async () => {
        await sequelize.close();
    });

    it('El Admin debe poder crear un nuevo empleado (201)', async () => {
        const response = await request(app)
            .post('/api/usuarios')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                nombre: 'Nuevo Empleado',
                email: 'nuevo_emp@test.com',
                password: 'Password123',
                rol: 'EMPLEADO'
            });

        expect(response.status).toBe(201);
        expect(response.body.data.email).toBe('nuevo_emp@test.com');
    });

    it('Un empleado NO debe poder crear otro usuario (403 Seguridad)', async () => {
        const response = await request(app).post('/api/usuarios').set('Authorization', `Bearer ${empleadoToken}`).send({
            nombre: 'Hacker',
            email: 'hacker@test.com',
            password: 'hack',
            rol: 'ADMIN'
        });

        expect(response.status).toBe(403);
        expect(response.body.error).toMatch(/Acceso denegado/i);
    });

    it('Un empleado NO debe poder consultar el perfil de otro empleado (403 Seguridad)', async () => {
        // Obtenemos todos primero (el admin puede)
        const resAdmin = await request(app).get('/api/usuarios').set('Authorization', `Bearer ${adminToken}`);
        const otroEmpleadoId = resAdmin.body.data.items.find(u => u.email === 'nuevo_emp@test.com').id;

        const response = await request(app)
            .get(`/api/usuarios/${otroEmpleadoId}`)
            .set('Authorization', `Bearer ${empleadoToken}`);

        expect(response.status).toBe(403);
        expect(response.body.error).toMatch(/No tienes permiso/i);
    });

    it('Un empleado SI debe poder consultar su propio perfil (200)', async () => {
        const response = await request(app)
            .get(`/api/usuarios/${empleadoId}`)
            .set('Authorization', `Bearer ${empleadoToken}`);

        expect(response.status).toBe(200);
        expect(response.body.data.id).toBe(empleadoId);
    });

    it('El Admin debe poder dar de baja (soft delete) a un empleado (200)', async () => {
        const response = await request(app)
            .patch(`/api/usuarios/${empleadoId}/estado`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ motivoBaja: 'Despido' });

        expect(response.status).toBe(200);
        
        // Verificamos que el empleado ya no venga en el GET general
        const resAdmin = await request(app).get('/api/usuarios').set('Authorization', `Bearer ${adminToken}`);
        const existe = resAdmin.body.data.items.find(u => u.id === empleadoId);
        expect(existe).toBeUndefined(); // Por defecto findAll trae activo: true
    });

    it('Debe rechazar peticiones sin Token JWT (401 Seguridad)', async () => {
        const response = await request(app).get('/api/usuarios');
        expect(response.status).toBe(401);
        expect(response.body.error).toMatch(/No se proporcionó token/i);
    });
});

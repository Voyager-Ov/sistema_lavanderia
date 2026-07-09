import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import request from 'supertest';
import app from '../app.js';
import { sequelize, models, connectionManager } from '../models/index.js';
import bcrypt from 'bcryptjs';

jest.setTimeout(15000);

describe('Pruebas del Módulo de Autenticación (Lavandería SaaS)', () => {
    
    let adminEmail = 'testadmin@lavanderia.com';
    let adminPassword = 'Password123'; // Cumple con 8 chars y alfanumérica
    let negocioIdCreado;

    beforeAll(async () => {
        // Inicializamos la BD Central
        await connectionManager.initCentral();
        
        // Limpiamos y recreamos las tablas de la BD de prueba
        await connectionManager.centralDb.sync({ force: true });
        
        // Creamos un negocio y usuario semilla explícitamente para las pruebas
        const negocio = await connectionManager.centralModels.Negocio.create({
            nombre: 'Lavandería Test',
            estadoSuscripcion: 'ACTIVA'
        });
        negocioIdCreado = negocio.id;

        // Inicializamos la BD del Tenant para este negocio
        const tenant = await connectionManager.getTenantDb(negocio.id);

        await tenant.models.MetodoPago.create({
            negocioId: negocio.id,
            nombre: 'Efectivo',
            esFijo: true
        });

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(adminPassword, salt);
        
        await models.Usuario.create({
            negocioId: negocio.id,
            nombre: 'Admin Test',
            email: adminEmail,
            passwordHash,
            rol: 'ADMIN',
            activo: true,
            emailVerificado: true
        });
    });

    afterAll(async () => {
        // Cerramos la conexión para que Jest pueda terminar limpio
        await sequelize.close();
    });

    it('Debe registrar un nuevo admin y su negocio, y retornar 201', async () => {
        const response = await request(app)
            .post('/api/auth/register')
            .send({
                negocioNombre: 'Nueva Lavandería',
                usuarioNombre: 'Nuevo Dueño',
                email: 'nuevo@lavanderia.com',
                password: 'Password456'
            });

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveProperty('mensaje'); // Ahora devuelve mensaje de verificar email
        expect(response.body.data).toHaveProperty('usuario');
        expect(response.body.data.usuario.email).toBe('nuevo@lavanderia.com');
        
        // Regla de seguridad: nunca debe retornar la contraseña hasheada
        expect(response.body.data.usuario).not.toHaveProperty('passwordHash'); 
    });

    it('No debe permitir registrar un admin con un email existente (400)', async () => {
        const response = await request(app)
            .post('/api/auth/register')
            .send({
                negocioNombre: 'Copia Lavandería',
                usuarioNombre: 'Copia Dueño',
                email: adminEmail, // Este email ya lo insertamos en el beforeAll
                password: 'Password456'
            });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toMatch(/email ya está en uso/i);
    });

    it('No debe permitir contraseñas cortas o con caracteres especiales (400 - Validación)', async () => {
        const response = await request(app)
            .post('/api/auth/register')
            .send({
                negocioNombre: 'Lavandería Fallida',
                usuarioNombre: 'Fallido',
                email: 'fallido@test.com',
                password: '123' // Muy corta
            });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('detalles');
        expect(response.body.detalles[0].mensaje).toMatch(/al menos 8 caracteres/i);

        const response2 = await request(app)
            .post('/api/auth/register')
            .send({
                negocioNombre: 'Lavandería Fallida 2',
                usuarioNombre: 'Fallido 2',
                email: 'fallido2@test.com',
                password: 'Password_123!' // Caracteres especiales
            });

        expect(response2.status).toBe(400);
        expect(response2.body).toHaveProperty('detalles');
        expect(response2.body.detalles[0].mensaje).toMatch(/estrictamente alfanumérica/i);
    });

    it('Debe iniciar sesión correctamente y retornar token (200)', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({
                email: adminEmail,
                password: adminPassword
            });

        expect(response.status).toBe(200);
        
        // Verificamos el payload JSON
        expect(response.body.data).toHaveProperty('token');
        expect(response.body.data.usuario.email).toBe(adminEmail);
    });

    it('No debe iniciar sesión si el email no está verificado (403)', async () => {
        // Le quitamos el verificado temporalmente
        await connectionManager.centralModels.Usuario.update({ emailVerificado: false }, { where: { email: adminEmail } });

        const response = await request(app)
            .post('/api/auth/login')
            .send({
                email: adminEmail,
                password: adminPassword
            });

        expect(response.status).toBe(403);
        expect(response.body.error).toMatch(/Debes verificar tu email/i);

        // Se lo devolvemos para que no rompa otros tests
        await connectionManager.centralModels.Usuario.update({ emailVerificado: true }, { where: { email: adminEmail } });
    });

    it('No debe iniciar sesión con contraseña incorrecta (401)', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({
                email: adminEmail,
                password: 'ClaveIncorrecta999'
            });

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toMatch(/Credenciales inválidas/i);
    });

});

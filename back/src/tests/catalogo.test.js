import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import request from 'supertest';
import app from '../app.js';
import { sequelize, models, connectionManager } from '../models/index.js';
import bcrypt from 'bcryptjs';


jest.setTimeout(15000);

describe('Pruebas del Módulo de Catálogo (RBAC Empleados)', () => {
    let tenantModels, adminToken, empleadoToken, categoriaId, productoId;

    beforeAll(async () => {
        await connectionManager.initCentral();
        await connectionManager.centralDb.sync({ force: true });
        
        const negocio = await connectionManager.centralModels.Negocio.create({ nombre: 'Lavandería Test Catalogo', estadoSuscripcion: 'ACTIVA' });
        
        // Inicializar Tenant DB
        await connectionManager.getTenantDb(negocio.id);
        tenantModels = (await connectionManager.getTenantDb(negocio.id)).models;
        
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash('Password123', salt);
        
        await connectionManager.centralModels.Usuario.create({ negocioId: negocio.id, nombre: 'Admin', email: 'admin_cat@test.com', passwordHash, rol: 'ADMIN', activo: true, emailVerificado: true });
        await connectionManager.centralModels.Usuario.create({ negocioId: negocio.id, nombre: 'Emp', email: 'emp_cat@test.com', passwordHash, rol: 'EMPLEADO', activo: true, emailVerificado: true });

        const resAdmin = await request(app).post('/api/auth/login').send({ email: 'admin_cat@test.com', password: 'Password123' });
        adminToken = resAdmin.body.data.token;

        const resEmp = await request(app).post('/api/auth/login').send({ email: 'emp_cat@test.com', password: 'Password123' });
        empleadoToken = resEmp.body.data.token;
    });

    afterAll(async () => {
        await sequelize.close();
    });

    // --- CATEGORÍAS ---
    it('Un empleado NO debe poder crear una categoría (403)', async () => {
        const response = await request(app).post('/api/categorias').set('Authorization', `Bearer ${empleadoToken}`).send({ nombre: 'Lavado' });
        expect(response.status).toBe(403);
    });

    it('El Admin debe poder crear una categoría (201)', async () => {
        const response = await request(app).post('/api/categorias').set('Authorization', `Bearer ${adminToken}`).send({ nombre: 'Lavado' });
        expect(response.status).toBe(201);
        categoriaId = response.body.data.id;
    });

    // --- PRODUCTOS ---
    it('Un empleado NO debe poder crear un Producto (403)', async () => {
        const response = await request(app).post('/api/productos').set('Authorization', `Bearer ${empleadoToken}`).send({ categoriaId, nombre: 'Acolchado', precioActual: 1000 });
        expect(response.status).toBe(403);
    });

    it('El Admin debe poder crear un Producto (201)', async () => {
        const response = await request(app).post('/api/productos').set('Authorization', `Bearer ${adminToken}`).send({ 
            nombre: 'Acolchado', 
            categoriaId, 
            precioActual: 1000,
            costoEstimado: 300 
        });
        expect(response.status).toBe(201);
        productoId = response.body.data.id;
    });

    it('Al consultar productos, un Admin DEBE ver el costoEstimado', async () => {
        const response = await request(app).get('/api/productos').set('Authorization', `Bearer ${adminToken}`);
        expect(response.status).toBe(200);
        expect(response.body.data.items[0]).toHaveProperty('costoEstimado');
        expect(response.body.data.items[0].costoEstimado).toBe(300);
    });

    it('Al consultar productos, un Empleado NO DEBE ver el costoEstimado', async () => {
        const response = await request(app).get('/api/productos').set('Authorization', `Bearer ${empleadoToken}`);
        expect(response.status).toBe(200);
        expect(response.body.data.items[0]).not.toHaveProperty('costoEstimado');
    });

    it('Un Empleado NO DEBE poder editar el precio de un Producto (403)', async () => {
        const response = await request(app).put(`/api/productos/${productoId}`).set('Authorization', `Bearer ${empleadoToken}`).send({
            precioActual: 2000
        });
        expect(response.status).toBe(403);
        expect(response.body.error).toMatch(/Acceso denegado/i);
    });

    it('El Admin debe poder actualizar una categoría (200)', async () => {
        const response = await request(app).put(`/api/categorias/${categoriaId}`).set('Authorization', `Bearer ${adminToken}`).send({
            nombre: 'Ropa Blanca Nueva'
        });
        expect(response.status).toBe(200);
        expect(response.body.data.nombre).toBe('Ropa Blanca Nueva');
    });

    it('El Admin NO debe poder eliminar una categoría con productos activos (400)', async () => {
        const response = await request(app).delete(`/api/categorias/${categoriaId}`).set('Authorization', `Bearer ${adminToken}`);
        expect(response.status).toBe(400);
    });

    it('El Admin debe poder actualizar un Producto completo (200)', async () => {
        const response = await request(app).put(`/api/productos/${productoId}`).set('Authorization', `Bearer ${adminToken}`).send({
            nombre: 'Acolchado 2 Plazas',
            precioActual: 4500
        });
        expect(response.status).toBe(200);
        expect(response.body.data.nombre).toBe('Acolchado 2 Plazas');
        expect(response.body.data.precioActual).toBe(4500);
    });

    it('Un Empleado DEBE poder editar la disponibilidad de un Producto (200)', async () => {
        const response = await request(app).patch(`/api/productos/${productoId}/disponibilidad`).set('Authorization', `Bearer ${empleadoToken}`).send({ 
            disponible: false 
        });
        expect(response.status).toBe(200);
        expect(response.body.data.disponible).toBe(false);
    });

    it('El Admin debe poder eliminar un Producto (Soft Delete - 200)', async () => {
        const response = await request(app).delete(`/api/productos/${productoId}`).set('Authorization', `Bearer ${adminToken}`);
        expect(response.status).toBe(200);
    });

    it('El Admin debe poder eliminar una categoría vacía (200)', async () => {
        // Ahora que el producto fue eliminado, la categoría debería poder eliminarse
        const response = await request(app).delete(`/api/categorias/${categoriaId}`).set('Authorization', `Bearer ${adminToken}`);
        expect(response.status).toBe(200);
    });
});

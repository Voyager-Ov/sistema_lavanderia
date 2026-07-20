import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import request from 'supertest';
import app from '../app.js';
import { sequelize, models, connectionManager } from '../models/index.js';
import bcrypt from 'bcryptjs';

jest.setTimeout(15000);


describe('Pruebas del Módulo de Pedidos', () => {
    let tenantModels, adminToken, empleadoToken, negocioId, empleadoId, clienteId, producto1Id, producto2Id, pedidoId;

    beforeAll(async () => {
        await connectionManager.initCentral();
        await connectionManager.centralDb.sync({ force: true });
        
        const negocio = await connectionManager.centralModels.Negocio.create({ nombre: 'Lavandería Pedidos', estadoSuscripcion: 'ACTIVA' });
        
        // Inicializar Tenant DB
        await connectionManager.getTenantDb(negocio.id);
        tenantModels = (await connectionManager.getTenantDb(negocio.id)).models;
        negocioId = negocio.id;
        
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash('Password123', salt);
        
        await connectionManager.centralModels.Usuario.create({ negocioId, nombre: 'Admin', email: 'admin_ped@test.com', passwordHash, rol: 'ADMIN', activo: true, emailVerificado: true });
        const empleado = await connectionManager.centralModels.Usuario.create({ negocioId, nombre: 'Emp', email: 'emp_ped@test.com', passwordHash, rol: 'EMPLEADO', activo: true, emailVerificado: true });
        empleadoId = empleado.id;

        const cliente = await tenantModels.Cliente.create({ negocioId, nombre: 'Juan Cliente', telefono: '123' });
        clienteId = cliente.id;

        const cat = await tenantModels.CategoriaProducto.create({ negocioId, nombre: 'Ropa' });
        const prod1 = await tenantModels.Producto.create({ negocioId, categoriaId: cat.id, nombre: 'Remera', precioActual: 1000 });
        const prod2 = await tenantModels.Producto.create({ negocioId, categoriaId: cat.id, nombre: 'Pantalon', precioActual: 2000 });
        producto1Id = prod1.id;
        producto2Id = prod2.id;

        const resAdmin = await request(app).post('/api/auth/login').send({ email: 'admin_ped@test.com', password: 'Password123' });
        adminToken = resAdmin.body.data.token;

        const resEmp = await request(app).post('/api/auth/login').send({ email: 'emp_ped@test.com', password: 'Password123' });
        empleadoToken = resEmp.body.data.token;
    });

    afterAll(async () => {
        await sequelize.close();
    });

    it('El empleado debe poder crear un pedido y el sistema debe calcular el total (201)', async () => {
        const response = await request(app).post('/api/pedidos').set('Authorization', `Bearer ${empleadoToken}`).send({
            clienteId,
            items: [
                { productoId: producto1Id, cantidad: 2 }, // 2 * 1000 = 2000
                { productoId: producto2Id, cantidad: 1 }  // 1 * 2000 = 2000
            ],
            fechaEntregaEstimada: "2026-07-20T14:30:00Z"
        });
        
        if (response.status !== 201) {
            throw new Error("POST /api/pedidos FAIL: " + JSON.stringify(response.body) + " | Status: " + response.status);
        }
        
        expect(response.status).toBe(201);
        expect(response.body.data.estado).toBe('PENDIENTE');
        expect(response.body.data.total).toBe(4000); // 2000 + 2000
        expect(response.body.data).toHaveProperty('codigoSeguimiento');
        expect(new Date(response.body.data.fechaEntregaEstimada).toISOString()).toBe(new Date("2026-07-20T14:30:00Z").toISOString());
        
        pedidoId = response.body.data.id;
    });

    it('Debe generar el historial inicial automáticamente', async () => {
        const historial = await tenantModels.HistorialPedido.findAll({ where: { pedidoId } });
        expect(historial.length).toBe(1);
        expect(historial[0].estadoNuevo).toBe('PENDIENTE');
    });

    it('El empleado debe poder pasar el pedido a EN_PROCESO', async () => {
        const response = await request(app).patch(`/api/pedidos/${pedidoId}/estado`).set('Authorization', `Bearer ${empleadoToken}`).send({
            estado: 'EN_PROCESO'
        });
        expect(response.status).toBe(200);
        expect(response.body.data.estado).toBe('EN_PROCESO');
    });

    it('El empleado debe poder pasar el pedido a ENTREGADO', async () => {
        await request(app).patch(`/api/pedidos/${pedidoId}/estado`).set('Authorization', `Bearer ${empleadoToken}`).send({ estado: 'LISTO_PARA_RETIRAR' });
        const response = await request(app).patch(`/api/pedidos/${pedidoId}/estado`).set('Authorization', `Bearer ${empleadoToken}`).send({
            estado: 'ENTREGADO'
        });
        expect(response.status).toBe(200);
        expect(response.body.data.estado).toBe('ENTREGADO');
    });

    it('Un empleado NO debe poder CANCELAR un pedido que ya está ENTREGADO (403)', async () => {
        const response = await request(app).patch(`/api/pedidos/${pedidoId}/estado`).set('Authorization', `Bearer ${empleadoToken}`).send({
            estado: 'CANCELADO'
        });
        expect(response.status).toBe(403);
        expect(response.body.error).toMatch(/cancelar un pedido que ya fue ENTREGADO/i);
    });

    it('Un Admin SI debe poder CANCELAR un pedido ENTREGADO (200)', async () => {
        const response = await request(app).patch(`/api/pedidos/${pedidoId}/estado`).set('Authorization', `Bearer ${adminToken}`).send({
            estado: 'CANCELADO',
            comentario: 'Fraude detectado, anulando.',
            motivoCancelacion: 'Fraude',
            descripcionCancelacion: 'Se detectó fraude en el pedido.'
        });
        expect(response.status).toBe(200);
        expect(response.body.data.estado).toBe('CANCELADO');
    });
});

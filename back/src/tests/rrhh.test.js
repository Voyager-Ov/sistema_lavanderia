import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import request from 'supertest';
import app from '../app.js';
import { sequelize, models, connectionManager } from '../models/index.js';
import bcrypt from 'bcryptjs';


jest.setTimeout(15000);

describe('Pruebas del Módulo de RRHH (Fichaje)', () => {
    let empleadoToken, tenantModels;

    beforeAll(async () => {
        await connectionManager.initCentral();
        await connectionManager.centralDb.sync({ force: true });
        
        const negocio = await connectionManager.centralModels.Negocio.create({ nombre: 'Lavandería RRHH', estadoSuscripcion: 'ACTIVA' });
        
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash('Password123!', salt);
        
        // Inicializar Tenant DB y Semillas
        await connectionManager.getTenantDb(negocio.id);
        tenantModels = (await connectionManager.getTenantDb(negocio.id)).models;

        await connectionManager.centralModels.Usuario.create({ negocioId: negocio.id, nombre: 'Admin', email: 'admin_rh@test.com', passwordHash, rol: 'ADMIN', activo: true, emailVerificado: true });
        const emp1 = await connectionManager.centralModels.Usuario.create({ negocioId: negocio.id, nombre: 'Juan', email: 'emp1_rh@test.com', passwordHash, rol: 'EMPLEADO', activo: true, emailVerificado: true, sueldoBase: 100000 });
        
        const resEmpleado = await request(app).post('/api/auth/login').send({
            email: 'emp1_rh@test.com',
            password: 'Password123!'
        });
        empleadoToken = resEmpleado.body.data.token;
    });

    afterAll(async () => {
        await sequelize.close();
    });

    it('El Empleado debe poder fichar entrada (201)', async () => {
        const response = await request(app)
            .post('/api/rrhh/asistencias/entrada')
            .set('Authorization', `Bearer ${empleadoToken}`);
        
        expect(response.status).toBe(201);
        expect(response.body.data).toHaveProperty('fechaHoraEntrada');
        expect(response.body.data.fechaHoraSalida).toBeFalsy();
    });

    it('Debe fallar al intentar fichar entrada si ya tiene un turno abierto (400)', async () => {
        const response = await request(app)
            .post('/api/rrhh/asistencias/entrada')
            .set('Authorization', `Bearer ${empleadoToken}`);
        
        expect(response.status).toBe(400);
        expect(response.body.error).toMatch(/Ya tienes un turno abierto/i);
    });

    it('El Empleado debe poder fichar salida (200)', async () => {
        const response = await request(app)
            .post('/api/rrhh/asistencias/salida')
            .set('Authorization', `Bearer ${empleadoToken}`);
        
        expect(response.status).toBe(200);
        expect(response.body.data).toHaveProperty('fechaHoraSalida');
        expect(response.body.data.fechaHoraSalida).not.toBeNull();
    });

    it('Debe fallar al intentar fichar salida si NO tiene un turno abierto (400)', async () => {
        const response = await request(app)
            .post('/api/rrhh/asistencias/salida')
            .set('Authorization', `Bearer ${empleadoToken}`);
        
        expect(response.status).toBe(400);
        expect(response.body.error).toMatch(/No tienes ningún turno abierto/i);
    });

    it('El Empleado debe poder ver su historial de asistencias (200)', async () => {
        const response = await request(app)
            .get('/api/rrhh/asistencias')
            .set('Authorization', `Bearer ${empleadoToken}`);
        
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.data.items)).toBe(true);
        expect(response.body.data.items.length).toBe(1);
    });

    it('El Admin debe poder generar el reporte mensual de sueldos y horas (200)', async () => {
        // Necesitamos autenticarnos como admin
        const adminRes = await request(app).post('/api/auth/login').send({
            email: 'admin_users@test.com', // Usaremos un admin temporal para esta prueba
            password: 'Password123!'
        });
        let adminToken = adminRes.body?.data?.token;

        // Si no existe, lo creamos
        if (!adminToken) {
            const salt = await bcrypt.genSalt(10);
            const passHash = await bcrypt.hash('Password123!', salt);
            const admin = await connectionManager.centralModels.Usuario.create({
                negocioId: 1, // Asumiendo negocio de la prueba
                nombre: 'Admin RRHH',
                email: 'admin_rrhh@test.com',
                passwordHash: passHash,
                rol: 'ADMIN',
                activo: true,
                emailVerificado: true
            });
            const login = await request(app).post('/api/auth/login').send({
                email: 'admin_rrhh@test.com',
                password: 'Password123!'
            });
            adminToken = login.body.data.token;
        }

        // Configurar sueldo base al empleado
        const empleado = await connectionManager.centralModels.Usuario.findOne({ where: { email: 'emp1_rh@test.com' } });
        await empleado.update({ sueldoBase: 100000, horasSemanalesObjetivo: 40 }); // Valor hora = 100000 / 160 = 625

        // Ajustar fechas del turno para que sea exactamente 8 horas de duración
        const asistencia = await tenantModels.RegistroAsistencia.findOne({ where: { usuarioId: empleado.id } });
        const entrada = new Date();
        const salida = new Date(entrada.getTime() + (8 * 60 * 60 * 1000)); // +8 horas
        await asistencia.update({ fechaHoraEntrada: entrada, fechaHoraSalida: salida });

        const mesActual = entrada.getMonth() + 1;
        const anioActual = entrada.getFullYear();

        const response = await request(app)
            .get(`/api/rrhh/reportes/sueldos?mes=${mesActual}&anio=${anioActual}`)
            .set('Authorization', `Bearer ${adminToken}`);
        
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.data)).toBe(true);
        
        const reporteEmpleado = response.body.data.find(r => r.email === 'emp1_rh@test.com');
        expect(reporteEmpleado).toBeDefined();
        
        // 8 horas a 625/hora = 5000
        expect(reporteEmpleado.totalHorasTrabajadas).toBe(8);
        expect(reporteEmpleado.sueldoEstimado).toBe(5000);
        expect(reporteEmpleado.valorHoraEstimado).toBe(625);
    });
});

import request from 'supertest';
import app from './src/app.js';
import { sequelize, connectionManager } from './src/models/index.js';
import bcrypt from 'bcryptjs';

async function run() {
    process.env.JWT_SECRET = 'test_secret_para_jest_123';
    
    await connectionManager.initCentral();
    await connectionManager.centralDb.sync({ force: true });
    
    const negocio = await connectionManager.centralModels.Negocio.create({ nombre: 'Lavandería Pedidos', estadoSuscripcion: 'ACTIVA' });
    
    await connectionManager.getTenantDb(negocio.id);
    const tenantModels = (await connectionManager.getTenantDb(negocio.id)).models;
    const negocioId = negocio.id;
    
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Password123', salt);
    
    await connectionManager.centralModels.Usuario.create({ negocioId, nombre: 'Admin', email: 'admin_ped@test.com', passwordHash, rol: 'ADMIN', activo: true, emailVerificado: true });
    
    const resAdmin = await request(app).post('/api/auth/login').send({ email: 'admin_ped@test.com', password: 'Password123' });
    console.log("LOGIN RESPONSE:", resAdmin.body);
    
    await sequelize.close();
}

run().catch(console.error);

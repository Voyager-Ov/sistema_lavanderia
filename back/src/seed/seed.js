import "dotenv/config";
import bcrypt from "bcryptjs";
import { connectionManager } from "../models/connectionManager.js";

async function runSeed() {
    try {
        console.log("Limpiando esquemas de Postgres...");
        await connectionManager.initCentral();
        await connectionManager.centralDb.query('DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;');
        await connectionManager.centralDb.query('DROP SCHEMA IF EXISTS tenant_1 CASCADE;');
        
        console.log("Iniciando sincronización de Base de Datos Central...");
        try {
            await connectionManager.centralDb.sync({ force: true });
        } catch (e) {
            console.log("Fallo force: true, usando force: false");
            await connectionManager.centralDb.sync();
        }
        console.log("Tablas centrales creadas correctamente.");

        console.log("Insertando Negocio...");
        const negocio = await connectionManager.centralModels.Negocio.create({
            nombre: "Lavandería Demo",
            estadoSuscripcion: "ACTIVA"
        });

        console.log(`Iniciando Base de Datos del Tenant ${negocio.id}...`);
        const { models: tenantModels } = await connectionManager.getTenantDb(negocio.id, true);

        console.log("Insertando Método de Pago Efectivo...");
        const metodoEfectivo = await tenantModels.MetodoPago.create({
            negocioId: negocio.id,
            nombre: "Efectivo",
            esFijo: true
        });

        console.log("Insertando Método de Pago Tarjeta...");
        const metodoTarjeta = await tenantModels.MetodoPago.create({
            negocioId: negocio.id,
            nombre: "Tarjeta de Crédito",
            esFijo: false
        });

        console.log("Hasheando contraseñas...");
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash("Admin123", salt);

        console.log("Insertando Usuario Admin...");
        const admin = await connectionManager.centralModels.Usuario.create({
            negocioId: negocio.id,
            nombre: "Administrador",
            email: "admin@demo.com",
            passwordHash,
            rol: "ADMIN",
            sueldoBase: 500000,
            horasSemanalesObjetivo: 45,
            emailVerificado: true
        });

        console.log("Insertando Usuario Empleado...");
        const empleado = await connectionManager.centralModels.Usuario.create({
            negocioId: negocio.id,
            nombre: "Empleado Juan",
            email: "empleado@demo.com",
            passwordHash,
            rol: "EMPLEADO",
            sueldoBase: 300000,
            horasSemanalesObjetivo: 40,
            emailVerificado: true
        });

        console.log("Insertando Cliente...");
        const cliente = await tenantModels.Cliente.create({
            negocioId: negocio.id,
            nombre: "Cliente Frecuente",
            telefono: "3510000000",
            email: "cliente@demo.com"
        });

        console.log("Insertando Categoría de Producto...");
        const categoria = await tenantModels.CategoriaProducto.create({
            negocioId: negocio.id,
            nombre: "Lavado Ropa de Cama"
        });

        console.log("Insertando Producto...");
        const producto = await tenantModels.Producto.create({
            negocioId: negocio.id,
            nombre: "Lavado Acolchado 2 Plazas",
            categoriaId: categoria.id,
            precioActual: 8500,
            costoEstimado: 1200,
            tiempoEstimadoMinutos: 90
        });

        console.log("Insertando Caja Abierta para Empleado...");
        const cajaAbierta = await tenantModels.Caja.create({
            negocioId: negocio.id,
            usuarioId: empleado.id,
            estado: "ABIERTA",
            montoInicial: 5000,
            fechaApertura: new Date()
        });

        console.log("Insertando Pedido PENDIENTE...");
        const pedido = await tenantModels.Pedido.create({
            negocioId: negocio.id,
            clienteId: cliente.id,
            creadoPorId: empleado.id,
            estado: "PENDIENTE",
            codigoSeguimiento: "LAV-TEST1",
            total: 17000
        });

        console.log("Insertando Ítems del Pedido...");
        await tenantModels.PedidoItem.create({
            pedidoId: pedido.id,
            productoId: producto.id,
            cantidad: 2,
            precioUnitario: 8500,
            subtotal: 17000
        });

        console.log("Insertando Historial del Pedido...");
        await tenantModels.HistorialPedido.create({
            pedidoId: pedido.id,
            usuarioId: empleado.id,
            estadoAnterior: null,
            estadoNuevo: "PENDIENTE",
            comentario: "Pedido creado inicialmente"
        });

        console.log("\n✅ SEED COMPLETADO CON ÉXITO ✅");
        console.log("-------------------------------------------------");
        console.log("Puedes probar el login con:");
        console.log("Email: admin@demo.com o empleado@demo.com");
        console.log("Password: Admin123");
        console.log("-------------------------------------------------");
        process.exit(0);

    } catch (error) {
        console.error("❌ Error ejecutando el seed:", error);
        process.exit(1);
    }
}

runSeed();

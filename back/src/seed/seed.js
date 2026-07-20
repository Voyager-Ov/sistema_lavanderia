import "dotenv/config";
import bcrypt from "bcryptjs";
import { connectionManager } from "../models/connectionManager.js";

async function runSeed() {
    try {
        await connectionManager.initCentral();
        
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
            nombre: "Lavandería Octavio",
            estadoSuscripcion: "ACTIVA"
        });

        console.log(`Iniciando Base de Datos del Tenant ${negocio.id}...`);
        const { models: tenantModels } = await connectionManager.getTenantDb(negocio.id, true);

        // ==== PAYMENT METHODS ====
        console.log("Insertando Métodos de Pago...");
        const mEfectivo = await tenantModels.MetodoPago.create({ negocioId: negocio.id, nombre: "Efectivo", icono: "Banknote", esFijo: true });
        const mTarjetaC = await tenantModels.MetodoPago.create({ negocioId: negocio.id, nombre: "Tarjeta de Crédito", icono: "CreditCard", esFijo: false });
        const mTarjetaD = await tenantModels.MetodoPago.create({ negocioId: negocio.id, nombre: "Tarjeta de Débito", icono: "CreditCard", esFijo: false });
        const mMercadoPago = await tenantModels.MetodoPago.create({ negocioId: negocio.id, nombre: "Mercado Pago", icono: "QrCode", esFijo: false });
        const mTransferencia = await tenantModels.MetodoPago.create({ negocioId: negocio.id, nombre: "Transferencia Bancaria", icono: "Smartphone", esFijo: false });

        // ==== USERS ====
        console.log("Hasheando contraseñas...");
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash("dimelo98", salt);

        console.log("Insertando Usuario Admin...");
        const admin = await connectionManager.centralModels.Usuario.create({
            negocioId: negocio.id,
            nombre: "Octavio",
            email: "octavio.velo2022@gmail.com",
            passwordHash,
            rol: "ADMIN",
            sueldoBase: 500000,
            horasSemanalesObjetivo: 45,
            emailVerificado: true
        });

        const passwordEmp = await bcrypt.hash("empleado123", salt);
        console.log("Insertando Usuario Empleado...");
        const empleado = await connectionManager.centralModels.Usuario.create({
            negocioId: negocio.id,
            nombre: "Juan Perez (Cajero)",
            email: "empleado@lavanderia.com",
            passwordHash: passwordEmp,
            rol: "EMPLEADO",
            sueldoBase: 350000,
            horasSemanalesObjetivo: 40,
            emailVerificado: true
        });

        // ==== CLIENTS ====
        console.log("Insertando Clientes...");
        const clientes = await Promise.all([
            tenantModels.Cliente.create({ negocioId: negocio.id, nombre: "María González", telefono: "3511111111", email: "maria@test.com" }),
            tenantModels.Cliente.create({ negocioId: negocio.id, nombre: "Carlos Rodriguez", telefono: "3512222222", email: "carlos@test.com" }),
            tenantModels.Cliente.create({ negocioId: negocio.id, nombre: "Hotel Las Palmas", telefono: "3513333333", email: "hotel@test.com" }),
            tenantModels.Cliente.create({ negocioId: negocio.id, nombre: "Lucía Fernandez", telefono: "3514444444" }),
            tenantModels.Cliente.create({ negocioId: negocio.id, nombre: "Javier Sanchez", telefono: "3515555555" })
        ]);

        // ==== CATEGORIES ====
        console.log("Insertando Categorías de Producto...");
        const catLavadoPeso = await tenantModels.CategoriaProducto.create({ negocioId: negocio.id, nombre: "Lavado al Peso" });
        const catCama = await tenantModels.CategoriaProducto.create({ negocioId: negocio.id, nombre: "Ropa de Cama" });
        const catPlanchado = await tenantModels.CategoriaProducto.create({ negocioId: negocio.id, nombre: "Planchado" });
        const catTintoreria = await tenantModels.CategoriaProducto.create({ negocioId: negocio.id, nombre: "Tintorería" });

        // ==== PRODUCTS ====
        console.log("Insertando Productos...");
        const pRopaMixta = await tenantModels.Producto.create({ negocioId: negocio.id, nombre: "Ropa Mixta (Canasto 5kg)", categoriaId: catLavadoPeso.id, precioActual: 5000, costoEstimado: 1000, tiempoEstimadoMinutos: 90 });
        const pRopaBlanca = await tenantModels.Producto.create({ negocioId: negocio.id, nombre: "Ropa Blanca (Lavado Especial)", categoriaId: catLavadoPeso.id, precioActual: 6500, costoEstimado: 1200, tiempoEstimadoMinutos: 120 });
        const pAcolchado = await tenantModels.Producto.create({ negocioId: negocio.id, nombre: "Lavado Acolchado 2 Plazas", categoriaId: catCama.id, precioActual: 8500, costoEstimado: 1500, tiempoEstimadoMinutos: 180 });
        const pFrazada = await tenantModels.Producto.create({ negocioId: negocio.id, nombre: "Lavado Frazada", categoriaId: catCama.id, precioActual: 7000, costoEstimado: 1200, tiempoEstimadoMinutos: 150 });
        const pCamisa = await tenantModels.Producto.create({ negocioId: negocio.id, nombre: "Planchado de Camisa", categoriaId: catPlanchado.id, precioActual: 2000, costoEstimado: 500, tiempoEstimadoMinutos: 15 });
        const pTraje = await tenantModels.Producto.create({ negocioId: negocio.id, nombre: "Traje Completo (Saco y Pantalón)", categoriaId: catTintoreria.id, precioActual: 15000, costoEstimado: 3000, tiempoEstimadoMinutos: 2880 }); // 2 dias

        // ==== CASH REGISTER ====
        console.log("Insertando Caja Abierta...");
        const cajaAbierta = await tenantModels.Caja.create({
            negocioId: negocio.id,
            usuarioId: empleado.id,
            estado: "ABIERTA",
            montoInicial: 10000,
            fechaApertura: new Date(new Date().setHours(8, 0, 0, 0)) // hoy a las 8am
        });

        // ==== EXPENSES ====
        console.log("Insertando Gastos...");
        await tenantModels.Gasto.create({ negocioId: negocio.id, categoria: "Insumos", descripcion: "Compra de Jabón Líquido Ala", monto: 12000, cajaId: cajaAbierta.id, registradoPorId: admin.id });
        await tenantModels.Gasto.create({ negocioId: negocio.id, categoria: "Otros", descripcion: "Papel para ticketera", monto: 4500, cajaId: cajaAbierta.id, registradoPorId: empleado.id });

        // ==== ORDERS ====
        console.log("Insertando Pedidos (Distintos Estados)...");
        
        // 1. ENTREGADO (Pagado en efectivo por Hotel)
        const pedido1 = await tenantModels.Pedido.create({ negocioId: negocio.id, clienteId: clientes[2].id, creadoPorId: admin.id, estado: "ENTREGADO", codigoSeguimiento: "LAV-1001", total: 42500 });
        await tenantModels.PedidoItem.create({ pedidoId: pedido1.id, productoId: pAcolchado.id, cantidad: 5, precioUnitario: 8500, subtotal: 42500 });
        await tenantModels.Pago.create({ negocioId: negocio.id, pedidoId: pedido1.id, monto: 42500, metodoPagoId: mTransferencia.id, cajaId: cajaAbierta.id, registradoPorId: admin.id });
        await tenantModels.HistorialPedido.create({ pedidoId: pedido1.id, usuarioId: admin.id, estadoAnterior: null, estadoNuevo: "ENTREGADO", comentario: "Entregado y pagado por transferencia" });

        // 2. LISTO_PARA_RETIRAR (Esperando retiro, pago pendiente)
        const pedido2 = await tenantModels.Pedido.create({ negocioId: negocio.id, clienteId: clientes[0].id, creadoPorId: empleado.id, estado: "LISTO_PARA_RETIRAR", codigoSeguimiento: "LAV-1002", total: 10000 });
        await tenantModels.PedidoItem.create({ pedidoId: pedido2.id, productoId: pRopaMixta.id, cantidad: 2, precioUnitario: 5000, subtotal: 10000 });
        await tenantModels.HistorialPedido.create({ pedidoId: pedido2.id, usuarioId: empleado.id, estadoAnterior: "EN_PROCESO", estadoNuevo: "LISTO_PARA_RETIRAR", comentario: "Ropa limpia y doblada" });

        // 3. EN_PROCESO (Lavándose actualmente)
        const pedido3 = await tenantModels.Pedido.create({ negocioId: negocio.id, clienteId: clientes[1].id, creadoPorId: empleado.id, estado: "EN_PROCESO", codigoSeguimiento: "LAV-1003", total: 15000 });
        await tenantModels.PedidoItem.create({ pedidoId: pedido3.id, productoId: pTraje.id, cantidad: 1, precioUnitario: 15000, subtotal: 15000 });
        await tenantModels.HistorialPedido.create({ pedidoId: pedido3.id, usuarioId: empleado.id, estadoAnterior: "PENDIENTE", estadoNuevo: "EN_PROCESO", comentario: "Enviado a tintorería" });

        // 4. PENDIENTE (Recién ingresado)
        const pedido4 = await tenantModels.Pedido.create({ negocioId: negocio.id, clienteId: clientes[3].id, creadoPorId: empleado.id, estado: "PENDIENTE", codigoSeguimiento: "LAV-1004", total: 11000 });
        await tenantModels.PedidoItem.create({ pedidoId: pedido4.id, productoId: pRopaMixta.id, cantidad: 1, precioUnitario: 5000, subtotal: 5000 });
        await tenantModels.PedidoItem.create({ pedidoId: pedido4.id, productoId: pCamisa.id, cantidad: 3, precioUnitario: 2000, subtotal: 6000 });
        await tenantModels.HistorialPedido.create({ pedidoId: pedido4.id, usuarioId: empleado.id, estadoAnterior: null, estadoNuevo: "PENDIENTE", comentario: "Recién recibido en mostrador" });

        // 5. CANCELADO
        const pedido5 = await tenantModels.Pedido.create({ negocioId: negocio.id, clienteId: clientes[4].id, creadoPorId: empleado.id, estado: "CANCELADO", codigoSeguimiento: "LAV-1005", total: 8500 });
        await tenantModels.PedidoItem.create({ pedidoId: pedido5.id, productoId: pAcolchado.id, cantidad: 1, precioUnitario: 8500, subtotal: 8500 });
        await tenantModels.HistorialPedido.create({ pedidoId: pedido5.id, usuarioId: empleado.id, estadoAnterior: "PENDIENTE", estadoNuevo: "CANCELADO", comentario: "El cliente se arrepintió por el precio" });

        console.log("\n✅ SEED REALISTA COMPLETADO CON ÉXITO ✅");
        console.log("-------------------------------------------------");
        console.log("Puedes probar el login con:");
        console.log("Email Admin: octavio.velo2022@gmail.com (Pass: dimelo98)");
        console.log("Email Empleado: empleado@lavanderia.com (Pass: empleado123)");
        console.log("-------------------------------------------------");
        process.exit(0);

    } catch (error) {
        console.error("❌ Error ejecutando el seed:", error);
        process.exit(1);
    }
}

runSeed();

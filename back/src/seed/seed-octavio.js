import "dotenv/config";
import { connectionManager } from "../models/connectionManager.js";
import { Op } from "sequelize";
import { generarCodigoSeguimiento } from "../utils/codeGenerator.util.js";

async function runSeedOctavio() {
    try {
        console.log("Inicializando base de datos central...");
        await connectionManager.initCentral();
        
        // 1. Encontrar al usuario Octavio
        console.log("Buscando cuenta octavio.velo2024@gmail.com...");
        let usuario = await connectionManager.centralModels.Usuario.findOne({
            where: { email: "octavio.velo2024@gmail.com" }
        });

        if (!usuario) {
            console.error("❌ No se encontró el usuario octavio.velo2024@gmail.com");
            const todos = await connectionManager.centralModels.Usuario.findAll();
            console.log("Usuarios existentes:", todos.map(u => u.email));
            
            // Try fallback
            const octavio = todos.find(u => u.email.includes("octavio"));
            if (octavio) {
                console.log(`Usando fallback: ${octavio.email}`);
                usuario = octavio;
            } else {
                process.exit(1);
            }
        }

        const negocioId = usuario.negocioId;
        console.log(`✅ Usuario encontrado. Negocio ID: ${negocioId}`);

        // 2. Conectar a los modelos del tenant
        const { models: tenantModels } = await connectionManager.getTenantDb(negocioId, true);

        // 3. Crear Clientes Falsos
        console.log("Creando 10 clientes realistas...");
        const nombresClientes = [
            "María González", "Carlos Rodríguez", "Lucía Fernández", "Jorge Pérez",
            "Ana Silva", "Martín Gómez", "Sofía López", "Diego Martínez",
            "Valentina Sánchez", "Mateo Díaz"
        ];
        
        const clientesCreados = [];
        for (const nombre of nombresClientes) {
            const cliente = await tenantModels.Cliente.create({
                negocioId,
                nombre,
                telefono: "351" + Math.floor(1000000 + Math.random() * 9000000),
                email: nombre.split(" ")[0].toLowerCase() + "@ejemplo.com"
            });
            clientesCreados.push(cliente);
        }

        // 4. Crear Categorías y Productos
        console.log("Creando Categorías y Productos...");
        const catLavado = await tenantModels.CategoriaProducto.create({ negocioId, nombre: "Lavado Básico" });
        const catHogar = await tenantModels.CategoriaProducto.create({ negocioId, nombre: "Ropa de Hogar" });
        const catPremium = await tenantModels.CategoriaProducto.create({ negocioId, nombre: "Lavado Premium" });

        const productos = await tenantModels.Producto.bulkCreate([
            { negocioId, nombre: "Lavado y Secado (Canasto 5kg)", categoriaId: catLavado.id, precioActual: 5000, costoEstimado: 800, tiempoEstimadoMinutos: 90 },
            { negocioId, nombre: "Planchado por docena", categoriaId: catLavado.id, precioActual: 4500, costoEstimado: 500, tiempoEstimadoMinutos: 60 },
            { negocioId, nombre: "Lavado Acolchado 2 Plazas", categoriaId: catHogar.id, precioActual: 8500, costoEstimado: 1200, tiempoEstimadoMinutos: 120 },
            { negocioId, nombre: "Lavado Alfombra pequeña", categoriaId: catHogar.id, precioActual: 6000, costoEstimado: 1000, tiempoEstimadoMinutos: 150 },
            { negocioId, nombre: "Limpieza Traje Completo", categoriaId: catPremium.id, precioActual: 12000, costoEstimado: 2000, tiempoEstimadoMinutos: 240 }
        ], { returning: true });

        // 4.5 Crear una caja para asociar a los pagos
        let caja = await tenantModels.Caja.findOne({ where: { estado: "ABIERTA" } });
        if (!caja) {
            caja = await tenantModels.Caja.create({
                negocioId,
                usuarioId: usuario.id,
                estado: "ABIERTA",
                montoInicial: 0,
                fechaApertura: new Date()
            });
        }

        // 5. Crear Pedidos simulando los últimos 7 días
        console.log("Creando 30 pedidos simulados para los últimos 7 días...");
        const estados = ["PENDIENTE", "EN_PROCESO", "LISTO_PARA_RETIRAR", "ENTREGADO", "CANCELADO"];
        
        for (let i = 0; i < 30; i++) {
            // Seleccionar cliente y producto al azar
            const cliente = clientesCreados[Math.floor(Math.random() * clientesCreados.length)];
            const producto = productos[Math.floor(Math.random() * productos.length)];
            const cantidad = Math.floor(Math.random() * 3) + 1;
            const subtotal = producto.precioActual * cantidad;
            
            // Determinar estado al azar, sesgado hacia ENTREGADO para días pasados
            let estado = estados[Math.floor(Math.random() * estados.length)];
            
            // Fecha de creación: entre 7 días atrás y hoy
            const diasAtras = Math.floor(Math.random() * 7);
            const fechaCreacion = new Date();
            fechaCreacion.setDate(fechaCreacion.getDate() - diasAtras);
            
            // Si fue creado hace más de 2 días, forzarlo a ENTREGADO casi siempre
            if (diasAtras >= 2 && Math.random() > 0.1) {
                estado = "ENTREGADO";
            }
            // Si es de hoy, más chance de que sea PENDIENTE o EN_PROCESO
            if (diasAtras === 0) {
                estado = estados[Math.floor(Math.random() * 3)]; // solo los primeros 3 estados
            }

            // Crear el Pedido
            const pedido = await tenantModels.Pedido.create({
                negocioId,
                clienteId: cliente.id,
                creadoPorId: usuario.id,
                estado,
                codigoSeguimiento: generarCodigoSeguimiento(),
                total: subtotal,
                createdAt: fechaCreacion,
                updatedAt: fechaCreacion
            });

            // Crear el Ítem
            await tenantModels.PedidoItem.create({
                pedidoId: pedido.id,
                productoId: producto.id,
                cantidad,
                precioUnitario: producto.precioActual,
                subtotal
            });

            // Crear Historial Base
            await tenantModels.HistorialPedido.create({
                pedidoId: pedido.id,
                usuarioId: usuario.id,
                estadoAnterior: null,
                estadoNuevo: estado,
                comentario: "Pedido ingresado (Seed)",
                createdAt: fechaCreacion
            });

            // Si está entregado, simular un pago
            if (estado === "ENTREGADO" || Math.random() > 0.5) {
                await tenantModels.Pago.create({
                    negocioId,
                    pedidoId: pedido.id,
                    metodoPagoId: 1, // Asumiendo Efectivo que se crea en seed original
                    monto: subtotal,
                    cajaId: caja.id,
                    registradoPorId: usuario.id,
                    createdAt: fechaCreacion
                });
            }
        }

        console.log("✅ Seed completado con éxito para Octavio.");
        process.exit(0);
    } catch (error) {
        console.error("❌ Error ejecutando seed:", error);
        process.exit(1);
    }
}

runSeedOctavio();

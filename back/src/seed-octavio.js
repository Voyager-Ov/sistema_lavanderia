import 'dotenv/config';
import { connectionManager } from './models/connectionManager.js';
import { Op } from 'sequelize';

async function seed() {
    try {
        console.log("Iniciando Seed para Octavio...");
        await connectionManager.initCentral();
        await connectionManager.centralDb.authenticate();
        const models = connectionManager.centralModels;

        const emailAlternativo = "octaviovelo2024@gmail.com";
        const usuario = await models.Usuario.findOne({ where: { email: emailAlternativo } });

        if (!usuario) {
            console.log("No se encontró el usuario.");
            process.exit(1);
        }

        const negocioId = usuario.negocioId;
        const usuarioId = usuario.id;
        
        console.log(`Poblando datos para el negocioId: ${negocioId} (Usuario: ${usuario.email})...`);

        // 1. Crear Clientes
        const clientesData = [
            { nombre: "Juan Pérez", telefono: "1122334455", email: "juan@test.com", activo: true, negocioId },
            { nombre: "María Gómez", telefono: "1199887766", email: "maria@test.com", activo: true, negocioId },
            { nombre: "Carlos López", telefono: "1144556677", email: "carlos@test.com", activo: true, negocioId },
            { nombre: "Ana Martínez", telefono: "1133221100", email: "ana@test.com", activo: true, negocioId },
            { nombre: "Pedro Sánchez", telefono: "1188776655", email: "pedro@test.com", activo: true, negocioId }
        ];
        
        const clientesCreados = await models.Cliente.bulkCreate(clientesData, { returning: true });
        console.log(`✅ ${clientesCreados.length} Clientes creados.`);

        // 2. Crear Categoría de Producto
        let categoria = await models.CategoriaProducto.findOne({ where: { nombre: "Lavado Estándar", negocioId }});
        if (!categoria) {
            categoria = await models.CategoriaProducto.create({ nombre: "Lavado Estándar", negocioId, activo: true });
        }

        // 3. Crear Productos
        const productosData = [
            { nombre: "Lavado Ropa Blanca", precioActual: 2500, costoEstimado: 500, disponible: true, activo: true, negocioId, categoriaId: categoria.id },
            { nombre: "Lavado Ropa Color", precioActual: 2500, costoEstimado: 500, disponible: true, activo: true, negocioId, categoriaId: categoria.id },
            { nombre: "Planchado Camisas", precioActual: 1500, costoEstimado: 300, disponible: true, activo: true, negocioId, categoriaId: categoria.id },
            { nombre: "Lavado Acolchado", precioActual: 5000, costoEstimado: 1000, disponible: true, activo: true, negocioId, categoriaId: categoria.id },
            { nombre: "Lavado Express", precioActual: 3500, costoEstimado: 700, disponible: true, activo: true, negocioId, categoriaId: categoria.id }
        ];

        const productosCreados = await models.Producto.bulkCreate(productosData, { returning: true });
        console.log(`✅ ${productosCreados.length} Productos creados.`);

        // 4. Crear Caja (Para que haya ingresos)
        const caja = await models.Caja.create({
            negocioId,
            usuarioId,
            montoInicial: 10000,
            estado: "ABIERTA"
        });

        // 5. Crear Metodo de Pago
        let metodoPago = await models.MetodoPago.findOne({ where: { nombre: "Efectivo", negocioId }});
        if (!metodoPago) {
            metodoPago = await models.MetodoPago.create({ nombre: "Efectivo", negocioId, activo: true });
        }
        let metodoTransferencia = await models.MetodoPago.findOne({ where: { nombre: "Transferencia", negocioId }});
        if (!metodoTransferencia) {
            metodoTransferencia = await models.MetodoPago.create({ nombre: "Transferencia", negocioId, activo: true });
        }

        const estados = ["PENDIENTE", "EN_PROCESO", "LISTO_PARA_RETIRAR", "ENTREGADO", "CANCELADO"];
        
        // 6. Crear 35 Pedidos variados
        console.log("Generando 35 pedidos...");
        for (let i = 0; i < 35; i++) {
            const cliente = clientesCreados[Math.floor(Math.random() * clientesCreados.length)];
            const producto1 = productosCreados[Math.floor(Math.random() * productosCreados.length)];
            
            const cantidad1 = Math.floor(Math.random() * 3) + 1;
            const total = (producto1.precioActual * cantidad1);
            
            // Distribuir en fechas de los ultimos 7 dias
            const diasAtras = Math.floor(Math.random() * 7);
            const fechaCreacion = new Date();
            fechaCreacion.setDate(fechaCreacion.getDate() - diasAtras);
            
            // Estado aleatorio
            let estado = estados[Math.floor(Math.random() * estados.length)];
            if (i < 5) estado = "PENDIENTE";
            if (i >= 5 && i < 10) estado = "EN_PROCESO";
            if (i >= 10 && i < 15) estado = "LISTO_PARA_RETIRAR";
            if (i >= 15 && i < 20) estado = "ENTREGADO";
            
            const isPagado = (estado === "ENTREGADO" || Math.random() > 0.5);

            const pedido = await models.Pedido.create({
                negocioId,
                clienteId: cliente.id,
                registradoPorId: usuarioId,
                estado,
                total,
                cobrado: isPagado,
                codigoSeguimiento: `OCT-${Math.floor(Math.random() * 100000)}`,
                createdAt: fechaCreacion,
                updatedAt: fechaCreacion
            });

            await models.PedidoItem.create({
                pedidoId: pedido.id,
                productoId: producto1.id,
                cantidad: cantidad1,
                precioUnitario: producto1.precioActual,
                subtotal: (producto1.precioActual * cantidad1)
            });

            // Si está cobrado, generamos un pago asociado
            if (isPagado) {
                await models.Pago.create({
                    negocioId,
                    cajaId: caja.id,
                    pedidoId: pedido.id,
                    metodoPagoId: Math.random() > 0.5 ? metodoPago.id : metodoTransferencia.id,
                    monto: total,
                    registradoPorId: usuarioId,
                    estado: "COMPLETADO",
                    createdAt: fechaCreacion,
                    updatedAt: fechaCreacion
                });
            }
        }
        
        console.log("✅ 35 Pedidos generados con sus ítems y pagos.");
        console.log("¡Seed Finalizado con Éxito! Ya puedes ver los datos en el Frontend.");
        
    } catch (error) {
        console.error("Error durante el seed:", error);
    } finally {
        process.exit(0);
    }
}

seed();

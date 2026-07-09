import 'dotenv/config';
import { connectionManager } from './models/connectionManager.js';
import * as clienteService from './services/clientes/cliente.service.js';
import * as productoService from './services/productos/producto.service.js';
import * as gastoService from './services/gastos/gasto.service.js';
import * as usuarioService from './services/usuarios/usuario.service.js';

async function test() {
    try {
        console.log("Conectando a BD...");
        await connectionManager.initCentral();
        await connectionManager.centralDb.authenticate();
        const models = connectionManager.centralModels;

        const emailABuscar = "octavio.velo2024@gmail.com";
        const emailAlternativo = "octaviovelo2024@gmail.com";

        let usuario = await models.Usuario.findOne({ where: { email: emailABuscar } });
        if (!usuario) {
            console.log(`No se encontró ${emailABuscar}. Buscando ${emailAlternativo}...`);
            usuario = await models.Usuario.findOne({ where: { email: emailAlternativo } });
        }

        if (!usuario) {
            console.log("No se encontró ningún usuario con esos correos.");
            process.exit(0);
        }

        console.log(`Usuario encontrado: ${usuario.nombre} (${usuario.email}), Negocio ID: ${usuario.negocioId}`);
        const negocioId = usuario.negocioId;
        const usuarioId = usuario.id;
        const rol = usuario.rol;

        console.log("\n--- Probando Clientes ---");
        const clientes = await clienteService.obtenerClientes(negocioId, { limit: 2, page: 1, sortBy: 'nombre', sortOrder: 'DESC' });
        console.log(`Total Clientes: ${clientes.meta.totalItems}`);
        console.log("Muestra:", clientes.items.map(c => ({ id: c.id, nombre: c.nombre })));

        console.log("\n--- Probando Productos ---");
        const productos = await productoService.obtenerProductos(negocioId, rol, { limit: 2, page: 1, sortBy: 'createdAt', sortOrder: 'ASC' });
        console.log(`Total Productos: ${productos.meta.totalItems}`);
        console.log("Muestra:", productos.items.map(p => ({ id: p.id, nombre: p.nombre, createdAt: p.createdAt })));

        console.log("\n--- Probando Gastos (Pagos) ---");
        const gastos = await gastoService.obtenerGastos(negocioId, usuarioId, rol, { limit: 2, page: 1, sortBy: 'monto', sortOrder: 'DESC' });
        console.log(`Total Gastos: ${gastos.meta.totalItems}`);
        console.log("Muestra:", gastos.items.map(g => ({ id: g.id, monto: g.monto, categoria: g.categoria })));

        console.log("\n--- Probando Pedidos ---");
        // Ver pedidos de ese negocio
        const pedidos = await models.Pedido.findAndCountAll({
            where: { negocioId: usuario.negocioId }
        });

        console.log(`Total Pedidos: ${pedidos.count}`);
        
        if (pedidos.count > 0) {
            console.log("Muestra de pedidos:", pedidos.rows.slice(0, 3).map(p => ({ id: p.id, estado: p.estado, total: p.total })));
        } else {
            console.log("Realmente no hay ningún pedido cargado en la base de datos para esta cuenta.");
        }

    } catch (error) {
        console.error("Error en las pruebas:", error);
    } finally {
        process.exit(0);
    }
}

test();

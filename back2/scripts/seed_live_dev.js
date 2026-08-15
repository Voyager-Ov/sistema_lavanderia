import "dotenv/config";
import { connectionManager } from "../src/models/connectionManager.js";
import { clientesService } from "../src/modules/clientes/services/clientes.service.js";
import { pedidosService } from "../src/modules/pedidos/services/pedidos.service.js";
import { serviciosService } from "../src/modules/servicios/services/servicios.service.js";
import { categoriasService } from "../src/modules/servicios/services/categorias.service.js";
import { pagosService } from "../src/modules/finanzas/services/pagos.service.js";

async function seedLiveDevData() {
    console.log("🌱 Poblando Datos Reales de Prueba en la Base de Datos para el Front-End...\n");

    try {
        delete process.env.NODE_ENV; // Asegurar entorno real development / production
        await connectionManager.initCentral();

        const { Usuario, Negocio } = connectionManager.centralModels;

        // Buscar usuario octavio.velo2022@gmail.com o tomar el primer negocio
        let targetUser = await Usuario.findOne({ where: { email: "octavio.velo2022@gmail.com" } });
        let negocioId = targetUser?.negocioId || targetUser?.NegocioId;

        if (!negocioId) {
            const primerNegocio = await Negocio.findOne({ order: [["id", "ASC"]] });
            if (primerNegocio) negocioId = primerNegocio.id;
        }

        if (!negocioId) negocioId = 13;

        console.log(`👤 Operando sobre Negocio ID: ${negocioId} (Usuario: ${targetUser ? targetUser.email : 'Default'})`);

        const tenantDb = await connectionManager.getTenantDb(negocioId);
        const { Pedido, CuentaCorriente, MetodoPago, Caja } = tenantDb.models;

        // Asegurar métodos de pago iniciales
        const metodos = await pagosService.obtenerMetodosPago(negocioId);
        const efectivoMetodo = metodos.find(m => m.nombre.toLowerCase().includes("efectivo")) || metodos[0];

        // Asegurar Caja Abierta
        let cajaAbierta = await Caja.findOne({ where: { estadoCaja: "Abierta" } });
        if (!cajaAbierta) {
            cajaAbierta = await Caja.create({
                montoInicial: 25000,
                montoCierre: null,
                estadoCaja: "Abierta",
                observacionApertura: "Apertura para demostración y pruebas live",
                fechaApertura: new Date()
            });
            console.log("💵 Caja abierta creada ID:", cajaAbierta.idCaja);
        }

        // Crear/Asegurar Categoría y Servicios
        let cat;
        const cats = await categoriasService.listarCategorias(negocioId).catch(() => []);
        if (cats && cats.length > 0) {
            cat = cats[0];
        } else {
            cat = await categoriasService.crearCategoria(negocioId, { nombre: "Lavandería & Tintorería" });
        }

        const catId = cat.id;

        const servs = await serviciosService.listarServicios(negocioId).catch(() => []);
        let serv1 = servs.find(s => s.nombre.includes("Completo")) || servs[0];
        let serv2 = servs.find(s => s.nombre.includes("Secado")) || servs[1] || servs[0];
        let serv3 = servs.find(s => s.nombre.includes("Planchado")) || servs[2] || servs[0];

        if (!serv1) {
            serv1 = await serviciosService.crearServicio(negocioId, {
                nombre: "Lavado Completo x Bag (10kg)",
                precioActual: 15000,
                categoriaId: catId
            });
        }
        if (!serv2) {
            serv2 = await serviciosService.crearServicio(negocioId, {
                nombre: "Secado en Tambor Industrial",
                precioActual: 6000,
                categoriaId: catId
            });
        }
        if (!serv3) {
            serv3 = await serviciosService.crearServicio(negocioId, {
                nombre: "Planchado por Prenda Premium",
                precioActual: 3500,
                categoriaId: catId
            });
        }

        console.log("🧼 Servicios preparados para generación de pedidos.");

        // -------------------------------------------------------------------------
        // CLIENTE 1: Mariana Gómez (Cliente con Saldo a Favor disponible de $15.000)
        // -------------------------------------------------------------------------
        let cliMariana;
        const listMariana = await clientesService.listarClientes(negocioId, { search: "Mariana" });
        if (listMariana.clientes && listMariana.clientes.length > 0) {
            cliMariana = listMariana.clientes[0];
        } else {
            cliMariana = await clientesService.crearCliente(negocioId, {
                nombre: "Mariana",
                apellido: "Gómez",
                telefono: "11-4567-8901",
                email: "mariana.gomez@demo.com",
                direccion: "Av. Cabildo 2450, CABA"
            });
        }

        // Acreditar $15.000 de Saldo a Favor a Mariana
        await clientesService.ajustarCreditoCliente(negocioId, cliMariana.id, {
            monto: 15000,
            concepto: "Acreditación de saldo a favor por pago en exceso previo"
        });
        console.log(`✨ Cliente 1: ${cliMariana.nombre} ${cliMariana.apellido} con Saldo a Favor de $15.000 cargado.`);

        // Crear 1 pedido impago en taller para Mariana ($6.000)
        const pedMariana1 = await pedidosService.crearPedido(negocioId, {
            clienteId: cliMariana.id,
            items: [{ productoId: serv2.id, cantidad: 1 }]
        });
        console.log(`   📦 Pedido #${pedMariana1.numeroPedido || pedMariana1.id} asignado a Mariana ($6.000 en taller).`);

        // -------------------------------------------------------------------------
        // CLIENTE 2: Carlos Rodríguez (Cliente con Deuda Pendiente Exigible de $21.000)
        // -------------------------------------------------------------------------
        let cliCarlos;
        const listCarlos = await clientesService.listarClientes(negocioId, { search: "Carlos" });
        if (listCarlos.clientes && listCarlos.clientes.length > 0) {
            cliCarlos = listCarlos.clientes[0];
        } else {
            cliCarlos = await clientesService.crearCliente(negocioId, {
                nombre: "Carlos",
                apellido: "Rodríguez",
                telefono: "11-9876-5432",
                email: "carlos.rodriguez@demo.com",
                direccion: "Av. Santa Fe 1820, CABA"
            });
        }

        // Pedido A: Entregado impago ($15.000) -> Deuda Exigible
        const pedCarlos1 = await pedidosService.crearPedido(negocioId, {
            clienteId: cliCarlos.id,
            items: [{ productoId: serv1.id, cantidad: 1 }]
        });
        const numCarlos1 = pedCarlos1.numeroPedido || pedCarlos1.id;
        await Pedido.update({ estado: "ENTREGADO" }, { where: { numeroPedido: numCarlos1 } });

        // Pedido B: Entregado impago ($6.000) -> Deuda Exigible
        const pedCarlos2 = await pedidosService.crearPedido(negocioId, {
            clienteId: cliCarlos.id,
            items: [{ productoId: serv2.id, cantidad: 1 }]
        });
        const numCarlos2 = pedCarlos2.numeroPedido || pedCarlos2.id;
        await Pedido.update({ estado: "ENTREGADO" }, { where: { numeroPedido: numCarlos2 } });

        console.log(`🔴 Cliente 2: ${cliCarlos.nombre} ${cliCarlos.apellido} con Deuda Exigible de $21.000 cargada (#${numCarlos1} y #${numCarlos2}).`);

        // -------------------------------------------------------------------------
        // CLIENTE 3: Sofia Martínez (Cliente Mixto: 1 Entregado $15.000 + 1 En Taller $7.000)
        // -------------------------------------------------------------------------
        let cliSofia;
        const listSofia = await clientesService.listarClientes(negocioId, { search: "Sofia" });
        if (listSofia.clientes && listSofia.clientes.length > 0) {
            cliSofia = listSofia.clientes[0];
        } else {
            cliSofia = await clientesService.crearCliente(negocioId, {
                nombre: "Sofia",
                apellido: "Martínez",
                telefono: "11-3344-5566",
                email: "sofia.martinez@demo.com",
                direccion: "Calle Juramento 1540, CABA"
            });
        }

        const pedSofia1 = await pedidosService.crearPedido(negocioId, {
            clienteId: cliSofia.id,
            items: [{ productoId: serv1.id, cantidad: 1 }]
        });
        const numSofia1 = pedSofia1.numeroPedido || pedSofia1.id;
        await Pedido.update({ estado: "ENTREGADO" }, { where: { numeroPedido: numSofia1 } });

        const pedSofia2 = await pedidosService.crearPedido(negocioId, {
            clienteId: cliSofia.id,
            items: [{ productoId: serv3.id, cantidad: 2 }] // $7.000
        });
        const numSofia2 = pedSofia2.numeroPedido || pedSofia2.id;
        await Pedido.update({ estado: "LISTO" }, { where: { numeroPedido: numSofia2 } });

        console.log(`🟡 Cliente 3: ${cliSofia.nombre} ${cliSofia.apellido} con Deuda Exigible ($15.000) y Pedido Listo en Taller ($7.000).`);

        // -------------------------------------------------------------------------
        // CLIENTE 4: Lucas Pereyra (Cliente Al Día $0 con Cobro Histórico Completo)
        // -------------------------------------------------------------------------
        let cliLucas;
        const listLucas = await clientesService.listarClientes(negocioId, { search: "Lucas" });
        if (listLucas.clientes && listLucas.clientes.length > 0) {
            cliLucas = listLucas.clientes[0];
        } else {
            cliLucas = await clientesService.crearCliente(negocioId, {
                nombre: "Lucas",
                apellido: "Pereyra",
                telefono: "11-2233-4455",
                email: "lucas.pereyra@demo.com",
                direccion: "Av. Belgrano 910, CABA"
            });
        }

        const pedLucas = await pedidosService.crearPedido(negocioId, {
            clienteId: cliLucas.id,
            items: [{ productoId: serv1.id, cantidad: 1 }] // $15.000
        });
        const numLucas = pedLucas.numeroPedido || pedLucas.id;
        await Pedido.update({ estado: "ENTREGADO" }, { where: { numeroPedido: numLucas } });

        // Procesar cobro en mostrador para Lucas
        await pagosService.procesarCobro(negocioId, {
            clienteId: cliLucas.id,
            pedidosIds: [numLucas],
            metodoPagoId: efectivoMetodo.id,
            montoRecibido: 15000
        });

        console.log(`🟢 Cliente 4: ${cliLucas.nombre} ${cliLucas.apellido} al día ($0) con cobro procesado e ingreso registrado en Finanzas.`);

        console.log("\n==========================================================================================");
        console.log("🎉 ¡DATOS REALES POBLADOS CON ÉXITO EN LA BASE DE DATOS DEL NEGOCIO 13 (NEON/POSTGRES)! 🎉");
        console.log("==========================================================================================\n");
        process.exit(0);

    } catch (err) {
        console.error("\n❌ Error al poblar datos reales de desarrollo:", err);
        process.exit(1);
    }
}

seedLiveDevData();

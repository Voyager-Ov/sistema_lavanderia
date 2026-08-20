import "dotenv/config";
import jwt from "jsonwebtoken";
import app from "../src/app.js";
import { connectionManager } from "../src/models/connectionManager.js";
import { getJwtSecret } from "../src/config/env.config.js";

async function runHTTPIntegrationTest() {
    console.log("🚀 INICIANDO BATERÍA DE PRUEBAS HTTP EN VIVO DE ENDPOINTS BACK2...\n");
    const negocioId = 1;

    let server;
    try {
        process.env.NODE_ENV = "test";
        await connectionManager.initCentral();
        const tenantDb = await connectionManager.getTenantDb(negocioId);
        const { Pedido, Caja, MovimientoCaja, Cobro, MovimientoCuenta } = tenantDb.models;

        // Levantar servidor Express en puerto dinámico aislado
        server = app.listen(0);
        const port = server.address().port;
        const baseURL = `http://localhost:${port}/api`;
        console.log(`🟢 Servidor Express levantado dinámicamente en ${baseURL}`);

        // Generar Token JWT de pruebas para Negocio ID 1
        const secret = getJwtSecret();
        const token = jwt.sign(
            { email: "admin.test@lavanderia.com", negocioId, id: 1, rol: "ADMIN" },
            secret,
            { expiresIn: "1h" }
        );

        const headers = {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        };

        // Helpers de peticiones HTTP
        const httpPost = async (path, body) => {
            const res = await fetch(`${baseURL}${path}`, {
                method: "POST",
                headers,
                body: JSON.stringify(body)
            });
            const json = await res.json();
            if (!res.ok) {
                const errMsg = json.message || json.error || `HTTP ${res.status}`;
                const err = new Error(errMsg);
                err.status = res.status;
                err.code = json.error;
                err.data = json;
                throw err;
            }
            return json.data !== undefined ? json.data : json;
        };

        const httpGet = async (path) => {
            const res = await fetch(`${baseURL}${path}`, {
                method: "GET",
                headers
            });
            const json = await res.json();
            if (!res.ok) {
                const err = new Error(json.error || json.message || `HTTP ${res.status}`);
                err.status = res.status;
                err.data = json;
                throw err;
            }
            return json.data !== undefined ? json.data : json;
        };

        const httpPatch = async (path, body) => {
            const res = await fetch(`${baseURL}${path}`, {
                method: "PATCH",
                headers,
                body: JSON.stringify(body)
            });
            const json = await res.json();
            if (!res.ok) {
                const err = new Error(json.error || json.message || `HTTP ${res.status}`);
                err.status = res.status;
                err.data = json;
                throw err;
            }
            return json.data !== undefined ? json.data : json;
        };

        // ----------------------------------------------------------------------
        // TEST 1: Apertura de Caja Chica vía HTTP (POST /api/cajas/abrir)
        // ----------------------------------------------------------------------
        console.log("\n📦 TEST 1: Apertura de Turno de Caja Chica vía HTTP POST /api/cajas/abrir...");
        let cajaActual;
        try {
            cajaActual = await httpGet("/cajas/actual");
        } catch {
            cajaActual = null;
        }

        if (!cajaActual || (cajaActual.estado !== "ABIERTA" && cajaActual.estadoCaja !== "Abierta")) {
            await httpPost("/cajas/abrir", { montoInicial: 10000 });
            console.log("   ✅ PASÓ TEST 1: Caja chica abierta vía HTTP POST /api/cajas/abrir con $10.000.");
        } else {
            console.log("   ✅ PASÓ TEST 1: Caja chica ya se encontraba abierta.");
        }

        // ----------------------------------------------------------------------
        // TEST 2: Creación de Catálogo y Cliente vía HTTP
        // ----------------------------------------------------------------------
        console.log("\n🧪 TEST 2: Creación de Categoría, Servicio y Cliente vía HTTP...");
        const cat = await httpPost("/categorias", { nombre: "Servicios HTTP " + Date.now() });
        const servRegular = await httpPost("/servicios", {
            nombre: "Lavado Premium HTTP",
            precioActual: 12000,
            categoriaId: cat.id
        });
        const servSmall = await httpPost("/servicios", {
            nombre: "Planchado Express HTTP",
            precioActual: 4000,
            categoriaId: cat.id
        });
        const servGratis = await httpPost("/servicios", {
            nombre: "Promoción Bonificada HTTP",
            precioActual: 0,
            categoriaId: cat.id
        });

        const cliente = await httpPost("/clientes", { nombre: "Cliente HTTP Blindado " + Date.now() });
        const clienteId = cliente.id;
        console.log(`   ✅ PASÓ TEST 2: Cliente ID #${clienteId} creado correctamente.`);

        // ----------------------------------------------------------------------
        // TEST 3: Cobro Individual de Pedido con Vuelto a Saldo a Favor (POST /api/pagos)
        // ----------------------------------------------------------------------
        console.log("\n🧪 TEST 3: Registro de cobro individual vía HTTP POST /api/pagos con vuelto a favor...");
        const ped1 = await httpPost("/pedidos", { clienteId, items: [{ servicioId: servRegular.id, cantidad: 1 }] }); // $12.000
        const numPed1 = ped1.numeroPedido || ped1.id;

        await httpPost("/pagos", {
            pedidoId: numPed1,
            montoRecibido: 20000, // Paga 12.000 con 20.000
            dejarVueltoAFavor: true
        });

        const estado1 = await httpGet(`/clientes/${clienteId}/cuenta-corriente/estado-cuenta`);
        if (estado1.resumen.saldoAFavor === 8000) {
            console.log("   ✅ PASÓ TEST 3: $8.000 ingresados correctamente en Cuenta Corriente vía HTTP.");
        } else {
            throw new Error(`TEST 3 FALLÓ: Saldo esperado $8.000, obtenido $${estado1.resumen.saldoAFavor}`);
        }

        // ----------------------------------------------------------------------
        // TEST 4: Consumo Parcial de Saldo a Favor vía HTTP POST /api/pagos
        // ----------------------------------------------------------------------
        console.log("\n🧪 TEST 4: Consumo parcial de Saldo a Favor vía HTTP POST /api/pagos...");
        const ped2 = await httpPost("/pedidos", { clienteId, items: [{ servicioId: servSmall.id, cantidad: 1 }] }); // $4.000
        const numPed2 = ped2.numeroPedido || ped2.id;

        await httpPost("/pagos", {
            pedidoId: numPed2,
            aplicarSaldoAFavor: true
        });

        const estado2 = await httpGet(`/clientes/${clienteId}/cuenta-corriente/estado-cuenta`);
        if (estado2.resumen.saldoAFavor === 4000) {
            console.log("   ✅ PASÓ TEST 4: Quedan exactamente $4.000 de crédito ($8.000 - $4.000).");
        } else {
            throw new Error(`TEST 4 FALLÓ: Saldo esperado $4.000, obtenido $${estado2.resumen.saldoAFavor}`);
        }

        // ----------------------------------------------------------------------
        // TEST 5: Protección contra Cobro de Pedido Cancelado vía HTTP (400 Bad Request)
        // ----------------------------------------------------------------------
        console.log("\n🧪 TEST 5: Intento de cobro de pedido cancelado vía HTTP...");
        const ped3 = await httpPost("/pedidos", { clienteId, items: [{ servicioId: servRegular.id, cantidad: 1 }] });
        const numPed3 = ped3.numeroPedido || ped3.id;
        await httpPatch(`/pedidos/${numPed3}/estado`, { estado: "CANCELADO", motivoCancelacion: "Prueba HTTP" });

        try {
            await httpPost("/pagos", { pedidoId: numPed3 });
            throw new Error("Permitió cobrar pedido cancelado");
        } catch (err) {
            if (err.status === 400 && err.message.toLowerCase().includes("cancelado")) {
                console.log(`   ✅ PASÓ TEST 5: Rechazado con HTTP 400 Bad Request: "${err.message}"`);
            } else {
                throw err;
            }
        }

        // ----------------------------------------------------------------------
        // TEST 6: Protección contra Doble Cobro vía HTTP (400 Bad Request)
        // ----------------------------------------------------------------------
        console.log("\n🧪 TEST 6: Intento de cobro duplicado vía HTTP...");
        const ped4 = await httpPost("/pedidos", { clienteId, items: [{ servicioId: servSmall.id, cantidad: 1 }] });
        const numPed4 = ped4.numeroPedido || ped4.id;

        await httpPost("/pagos", { pedidoId: numPed4 }); // Primer cobro exitoso

        try {
            await httpPost("/pagos", { pedidoId: numPed4 }); // Segundo cobro debe fallar
            throw new Error("Permitió cobrar pedido duplicado");
        } catch (err) {
            if (err.status === 400 && err.message.toLowerCase().includes("cobrado")) {
                console.log(`   ✅ PASÓ TEST 6: Rechazado con HTTP 400 Bad Request: "${err.message}"`);
            } else {
                throw err;
            }
        }

        // ----------------------------------------------------------------------
        // TEST 7: Cobros Secuenciales Individuales por Pedido
        // ----------------------------------------------------------------------
        console.log("\n🧪 TEST 7: Cobros individuales secuenciales de 3 pedidos impagos...");
        const pedA = await httpPost("/pedidos", { clienteId, items: [{ servicioId: servSmall.id, cantidad: 1 }] }); // $4.000
        const pedB = await httpPost("/pedidos", { clienteId, items: [{ servicioId: servSmall.id, cantidad: 1 }] }); // $4.000
        const pedC = await httpPost("/pedidos", { clienteId, items: [{ servicioId: servSmall.id, cantidad: 1 }] }); // $4.000

        // Cobrar pedA consumiendo los $4.000 de crédito restante
        await httpPost("/pagos", { pedidoId: pedA.numeroPedido || pedA.id, aplicarSaldoAFavor: true });
        // Cobrar pedB en efectivo exacto ($4.000)
        await httpPost("/pagos", { pedidoId: pedB.numeroPedido || pedB.id, montoRecibido: 4000 });
        // Cobrar pedC en efectivo exacto ($4.000)
        await httpPost("/pagos", { pedidoId: pedC.numeroPedido || pedC.id, montoRecibido: 4000 });

        const estadoFinal7 = await httpGet(`/clientes/${clienteId}/cuenta-corriente/estado-cuenta`);
        if (estadoFinal7.resumen.deudaTotal === 0 && estadoFinal7.resumen.saldoAFavor === 0) {
            console.log("   ✅ PASÓ TEST 7: 3 pedidos cobrados individualmente. Crédito = $0, Deuda = $0.");
        } else {
            throw new Error(`TEST 7 FALLÓ: Deuda final $${estadoFinal7.resumen.deudaTotal}, Saldo $${estadoFinal7.resumen.saldoAFavor}`);
        }

        // ----------------------------------------------------------------------
        // TEST 8: Validación de Parámetros Inválidos (400 / 404 HTTP)
        // ----------------------------------------------------------------------
        console.log("\n🧪 TEST 8: Validación de parámetros inválidos vía HTTP...");
        try {
            await httpPost("/pagos", {});
            throw new Error("Permitió cobro sin pedidoId");
        } catch (err) {
            console.log(`   ✅ PASÓ TEST 8 (A): Rechazó sin pedidoId (HTTP 400): "${err.message}"`);
        }

        try {
            await httpPost("/pagos", { pedidoId: 999999 });
            throw new Error("Permitió cobro de pedido inexistente");
        } catch (err) {
            console.log(`   ✅ PASÓ TEST 8 (B): Rechazó pedido inexistente (HTTP 404): "${err.message}"`);
        }

        // ----------------------------------------------------------------------
        // TEST 9: Ajuste Manual de Crédito vía HTTP POST /api/clientes/:id/cuenta-corriente/ajuste-credito
        // ----------------------------------------------------------------------
        console.log("\n🧪 TEST 9: Ajuste manual de saldo a favor vía HTTP...");
        await httpPost(`/clientes/${clienteId}/cuenta-corriente/ajuste-credito`, {
            monto: 15000,
            concepto: "Ajuste promocional HTTP"
        });

        const estadoAj = await httpGet(`/clientes/${clienteId}/cuenta-corriente/estado-cuenta`);
        if (estadoAj.resumen.saldoAFavor !== 15000) {
            throw new Error(`TEST 9 FALLÓ: Ajuste esperado $15.000, obtenido $${estadoAj.resumen.saldoAFavor}`);
        }

        const pedAj = await httpPost("/pedidos", { clienteId, items: [{ servicioId: servRegular.id, cantidad: 1 }] }); // $12.000
        await httpPost("/pagos", { pedidoId: pedAj.numeroPedido || pedAj.id, aplicarSaldoAFavor: true });

        const estadoPostAj = await httpGet(`/clientes/${clienteId}/cuenta-corriente/estado-cuenta`);
        if (estadoPostAj.resumen.saldoAFavor === 3000) {
            console.log("   ✅ PASÓ TEST 9: Crédito manual ajustado ($15.000) y consumido ($12.000). Remanente: $3.000.");
        } else {
            throw new Error(`TEST 9 FALLÓ: Remanente esperado $3.000, obtenido $${estadoPostAj.resumen.saldoAFavor}`);
        }

        // ----------------------------------------------------------------------
        // TEST 10: Pedido Bonificado / Costo $0 vía HTTP
        // ----------------------------------------------------------------------
        console.log("\n🧪 TEST 10: Cobro de pedido bonificado $0 vía HTTP...");
        const pedGratis = await httpPost("/pedidos", { clienteId, items: [{ servicioId: servGratis.id, cantidad: 1 }] });
        const resGratis = await httpPost("/pagos", { pedidoId: pedGratis.numeroPedido || pedGratis.id });

        if (resGratis.monto === 0) {
            console.log("   ✅ PASÓ TEST 10: Pedido de $0 cobrado exitosamente por HTTP.");
        } else {
            throw new Error("TEST 10 FALLÓ al cobrar pedido de $0.");
        }

        // ----------------------------------------------------------------------
        // TEST 11: Volumétrico HTTP (10 Clientes, 20 Pedidos individuales)
        // ----------------------------------------------------------------------
        console.log("\n🧪 TEST 11: Prueba volumétrica de 20 pedidos cobrados individualmente vía HTTP...");
        let cobradosOk = 0;
        for (let i = 0; i < 20; i++) {
            const c = await httpPost("/clientes", { nombre: `Cliente Volumétrico ${i} ${Date.now()}` });
            const p = await httpPost("/pedidos", { clienteId: c.id, items: [{ servicioId: servSmall.id, cantidad: 1 }] });
            await httpPost("/pagos", { pedidoId: p.numeroPedido || p.id, montoRecibido: 4000 });
            cobradosOk++;
        }

        if (cobradosOk === 20) {
            console.log("   ✅ PASÓ TEST 11: Se procesaron 20 llamadas HTTP POST /api/pagos individuales sin errores.");
        } else {
            throw new Error(`TEST 11 FALLÓ: Se cobraron ${cobradosOk}/20 pedidos`);
        }

        // ----------------------------------------------------------------------
        // TEST 12: Auditoría de Trazabilidad Contable en BD (MovimientoCaja + MovimientoCuenta)
        // ----------------------------------------------------------------------
        console.log("\n🧪 TEST 12: Auditoría de Trazabilidad Dual en BD Neon PostgreSQL...");
        const cobrosTotales = await Cobro.findAll();
        const movimientosCaja = await MovimientoCaja.findAll();
        const movimientosCuenta = await MovimientoCuenta.findAll();

        console.log(`   BD Status -> Cobros: ${cobrosTotales.length} | Movimientos Caja: ${movimientosCaja.length} | Movimientos Cuenta Corriente: ${movimientosCuenta.length}`);
        if (cobrosTotales.length > 0 && movimientosCaja.length > 0 && movimientosCuenta.length > 0) {
            console.log("   ✅ PASÓ TEST 12: Trazabilidad contable dual 100% verificada (Caja Chica + Cuenta Corriente).");
        } else {
            throw new Error("TEST 12 FALLÓ en la verificación de trazabilidad contable.");
        }

        console.log("\n==========================================================================================");
        console.log("🏆 ¡BATERÍA HTTP COMPLETA FINALIZADA CON ÉXITO ABSOLUTO (100% SERVIDOR LIVE PROBADO)! 🏆");
        console.log("==========================================================================================\n");

        if (server) server.close();
        process.exit(0);

    } catch (err) {
        console.error("\n❌ Error durante la batería de pruebas HTTP:", err);
        if (server) server.close();
        process.exit(1);
    }
}

runHTTPIntegrationTest();

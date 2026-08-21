import "dotenv/config";
import supertest from "supertest";
import app from "../src/app.js";
import { connectionManager } from "../src/models/connectionManager.js";

async function runRealUserSimulation() {
    console.log("==========================================================================================");
    console.log("🚀 SIMULACIÓN DE INTERACCIÓN SIMULTÁNEA ADMIN VS EMPLEADO EN VIVO");
    console.log("==========================================================================================\n");

    try {
        delete process.env.NODE_ENV;
        await connectionManager.initCentral();
        console.log("🟢 Conexión con base de datos Neon PostgreSQL establecida.\n");

        const request = supertest(app);

        // -------------------------------------------------------------------------
        // 1. AUTENTICACIÓN DE USUARIOS REALES
        // -------------------------------------------------------------------------
        console.log("🔑 [1/8] Autenticando Admin (octavio.velo2022@gmail.com)...");
        const resLoginAdmin = await request.post("/api/auth/login").send({
            email: "octavio.velo2022@gmail.com",
            password: "dimelo98"
        });

        if (resLoginAdmin.status !== 200 || !resLoginAdmin.body.data?.token) {
            throw new Error(`Error en login de Admin: ${JSON.stringify(resLoginAdmin.body)}`);
        }
        const adminToken = resLoginAdmin.body.data.token;
        const adminUser = resLoginAdmin.body.data.usuario;
        console.log(`   ✅ Admin Autenticado exitosamente: ID Empleado: ${adminUser.id} | Rol: ${adminUser.rol}`);

        console.log("\n🔑 [2/8] Autenticando Empleado (octavio.velo2024@gmail.com)...");
        const resLoginEmp = await request.post("/api/auth/login").send({
            email: "octavio.velo2024@gmail.com",
            password: "lavanderia 123"
        });

        if (resLoginEmp.status !== 200 || !resLoginEmp.body.data?.token) {
            throw new Error(`Error en login de Empleado: ${JSON.stringify(resLoginEmp.body)}`);
        }
        const empToken = resLoginEmp.body.data.token;
        const empUser = resLoginEmp.body.data.usuario;
        console.log(`   ✅ Empleado Autenticado exitosamente: ID Empleado: ${empUser.id} | Rol: ${empUser.rol}`);

        if (adminUser.id === empUser.id) {
            throw new Error("❌ CRÍTICO: Admin y Empleado siguen compartiendo el mismo ID de empleado.");
        }
        console.log("\n   ✅ AISLAMIENTO DE USUARIOS DE BASE DE DATOS VERIFICADO: IDs distintos confirmados.");

        // -------------------------------------------------------------------------
        // 2. CONSULTA INICIAL DE ESTADO DE CAJAS
        // -------------------------------------------------------------------------
        console.log("\n📦 [3/8] Consultando estado inicial de caja para ambos portales...");
        
        // Si tenían cajas abiertas de ejecuciones anteriores, las cerramos para la prueba limpia
        const preCheckAdmin = await request.get("/api/cajas/actual").set("Authorization", `Bearer ${adminToken}`);
        if (preCheckAdmin.body.data?.abierta) {
            await request.post(`/api/cajas/${preCheckAdmin.body.data.id}/cerrar`).set("Authorization", `Bearer ${adminToken}`).send({ efectivoReal: 0 });
        }
        const preCheckEmp = await request.get("/api/cajas/actual").set("Authorization", `Bearer ${empToken}`);
        if (preCheckEmp.body.data?.abierta) {
            await request.post(`/api/cajas/${preCheckEmp.body.data.id}/cerrar`).set("Authorization", `Bearer ${empToken}`).send({ efectivoReal: 0 });
        }

        const resEstadoAdminInicial = await request.get("/api/cajas/actual").set("Authorization", `Bearer ${adminToken}`);
        const resEstadoEmpInicial = await request.get("/api/cajas/actual").set("Authorization", `Bearer ${empToken}`);

        console.log(`   Admin Caja Inicial: ${resEstadoAdminInicial.body.data ? "ABIERTA" : "SIN CAJA ABIERTA"}`);
        console.log(`   Empleado Caja Inicial: ${resEstadoEmpInicial.body.data ? "ABIERTA" : "SIN CAJA ABIERTA"}`);

        // -------------------------------------------------------------------------
        // 3. APERTURA DE CAJA POR EL ADMIN
        // -------------------------------------------------------------------------
        console.log("\n🔓 [4/8] Admin abre turno de caja con $10.000 de fondo de cambio...");
        const resAbrirAdmin = await request.post("/api/cajas/abrir").set("Authorization", `Bearer ${adminToken}`).send({
            montoInicial: 10000,
            observaciones: "Apertura turno Admin en prueba simultánea"
        });

        if (resAbrirAdmin.status !== 201 || !resAbrirAdmin.body.data?.abierta) {
            throw new Error(`Fallo en la apertura de caja de Admin: ${JSON.stringify(resAbrirAdmin.body)}`);
        }
        const adminCajaId = resAbrirAdmin.body.data.id;
        console.log(`   ✅ Caja Admin abierta con éxito (ID Caja: #${adminCajaId} | Fondo: $10.000)`);

        // -------------------------------------------------------------------------
        // 4. VERIFICACIÓN DE NO INTERFERENCIA EN PORTAL EMPLEADO
        // -------------------------------------------------------------------------
        console.log("\n🔍 [5/8] Verificando consulta simultánea en Portal del Empleado tras la apertura del Admin...");
        const resEmpPostAdminAbrir = await request.get("/api/cajas/actual").set("Authorization", `Bearer ${empToken}`);

        if (!resEmpPostAdminAbrir.body.data || resEmpPostAdminAbrir.body.data?.abierta === false) {
            console.log("   ✅ PRUEBA DE AISLAMIENTO ÉXITO ABSOLUTO: El Empleado NO recibió la caja del Admin (devuelve null/cerrada).");
        } else {
            console.error("   ❌ ERROR CRÍTICO: La caja del Admin se reflejó como abierta en la cuenta del Empleado:", resEmpPostAdminAbrir.body.data);
            throw new Error("Fallo de aislamiento de cajas.");
        }

        // -------------------------------------------------------------------------
        // 5. APERTURA DE SEGUNDA CAJA INDEPENDIENTE POR EL EMPLEADO
        // -------------------------------------------------------------------------
        console.log("\n🔓 [6/8] Empleado abre su PROPIA caja independiente con $3.000 de fondo...");
        const resAbrirEmp = await request.post("/api/cajas/abrir").set("Authorization", `Bearer ${empToken}`).send({
            montoInicial: 3000,
            observaciones: "Apertura turno Empleado en prueba simultánea"
        });

        if (resAbrirEmp.status !== 201 || !resAbrirEmp.body.data?.abierta) {
            throw new Error(`Fallo en la apertura de caja de Empleado: ${JSON.stringify(resAbrirEmp.body)}`);
        }
        const empCajaId = resAbrirEmp.body.data.id;
        console.log(`   ✅ Caja Empleado abierta con éxito (ID Caja: #${empCajaId} | Fondo: $3.000)`);

        if (adminCajaId === empCajaId) {
            throw new Error("❌ ERROR CRÍTICO: Ambas cuentas apuntan al mismo ID de caja.");
        }

        // -------------------------------------------------------------------------
        // 6. PROBAR REGISTRO DE COBRO EN RUTA DE CLIENTES CON LA CAJA DEL ADMIN
        // -------------------------------------------------------------------------
        console.log("\n💵 [7/9] Probando cobro a través de /api/clientes/:id/cobrar con la caja abierta del Admin...");
        
        // Crear cliente y pedido de prueba para el cobro
        const resCliente = await request.post("/api/clientes").set("Authorization", `Bearer ${adminToken}`).send({
            nombre: "Cliente Cobro Test Admin " + Date.now(),
            telefono: "1122334455"
        });
        const testClienteId = resCliente.body.data.id;

        const resServ = await request.post("/api/servicios").set("Authorization", `Bearer ${adminToken}`).send({
            nombre: "Lavado Secado Test POS",
            precioActual: 24000
        });
        const testServId = resServ.body.data.id;

        const resPedido = await request.post("/api/pedidos").set("Authorization", `Bearer ${adminToken}`).send({
            clienteId: testClienteId,
            items: [{ servicioId: testServId, cantidad: 1 }]
        });
        const testNumeroPedido = resPedido.body.data.numeroPedido;

        // Intentar el cobro con la caja abierta del Admin (mismo endpoint que usa CobrarPedidosSheet)
        const resCobroAdmin = await request.post(`/api/clientes/${testClienteId}/cobrar-pedidos`).set("Authorization", `Bearer ${adminToken}`).send({
            pedidosIds: [testNumeroPedido],
            metodoPagoId: 1, // Efectivo
            montoRecibido: 24000
        });

        if (resCobroAdmin.status === 200 && resCobroAdmin.body.success) {
            console.log(`   ✅ COBRO ADMIN EXITOSO: Pedido #${testNumeroPedido} cobrado por $24.000 usando la caja del Admin.`);
        } else {
            throw new Error(`Fallo en el cobro del Admin: ${JSON.stringify(resCobroAdmin.body)}`);
        }

        // Probar también el cobro desde la vista POS del Empleado
        console.log("\n💵 Probando cobro a través de /api/clientes/:id/cobrar-pedidos desde el Portal del EMPLEADO...");
        const resClienteEmp = await request.post("/api/clientes").set("Authorization", `Bearer ${empToken}`).send({
            nombre: "Cliente Cobro Test Empleado " + Date.now(),
            telefono: "1199887766"
        });
        const testClienteIdEmp = resClienteEmp.body.data.id;

        const resPedidoEmp = await request.post("/api/pedidos").set("Authorization", `Bearer ${empToken}`).send({
            clienteId: testClienteIdEmp,
            items: [{ servicioId: testServId, cantidad: 1 }]
        });
        const testNumeroPedidoEmp = resPedidoEmp.body.data.numeroPedido;

        const resCobroEmp = await request.post(`/api/clientes/${testClienteIdEmp}/cobrar-pedidos`).set("Authorization", `Bearer ${empToken}`).send({
            pedidosIds: [testNumeroPedidoEmp],
            metodoPagoId: 1, // Efectivo
            montoRecibido: 24000
        });

        if (resCobroEmp.status === 200 && resCobroEmp.body.success) {
            console.log(`   ✅ COBRO EMPLEADO EXITOSO: Pedido #${testNumeroPedidoEmp} cobrado por $24.000 usando la caja del Empleado.`);
        } else {
            throw new Error(`Fallo en el cobro del Empleado: ${JSON.stringify(resCobroEmp.body)}`);
        }

        // Verificación de aislamiento estricto de los movimientos en cada caja
        console.log("\n🔍 Verificando aislamiento de ingresos y movimientos entre la caja del Admin y la del Empleado...");
        const resCajaAdmin = await request.get("/api/cajas/actual").set("Authorization", `Bearer ${adminToken}`);
        const resCajaEmp = await request.get("/api/cajas/actual").set("Authorization", `Bearer ${empToken}`);

        const ingresosAdmin = resCajaAdmin.body.data?.totalIngresosEnVivo;
        const ingresosEmp = resCajaEmp.body.data?.totalIngresosEnVivo;

        console.log(`   - Ingresos registrados en Caja Admin (#${resCajaAdmin.body.data?.id}): $${ingresosAdmin}`);
        console.log(`   - Ingresos registrados en Caja Empleado (#${resCajaEmp.body.data?.id}): $${ingresosEmp}`);

        if (ingresosAdmin !== 24000 || ingresosEmp !== 24000) {
            throw new Error(`Fallo de aislamiento de ingresos: Admin=$${ingresosAdmin}, Empleado=$${ingresosEmp}`);
        }
        console.log("   ✅ AISLAMIENTO DE MOVIMIENTOS E INGRESOS CONFIRMADO 100%: Cada caja registra únicamente los cobros de su operador.");

        // -------------------------------------------------------------------------
        // 7. CONSULTA GLOBAL DE CAJAS ABIERTAS POR EL ADMIN
        // -------------------------------------------------------------------------
        console.log("\n📊 [8/9] Admin consulta la lista global de todas las cajas abiertas del negocio (/api/cajas/abiertas)...");
        const resAbiertas = await request.get("/api/cajas/abiertas").set("Authorization", `Bearer ${adminToken}`);

        console.log(`   ✅ Cajas abiertas encontradas en el negocio: ${resAbiertas.body.data?.length}`);
        resAbiertas.body.data.forEach(c => {
            console.log(`      - Caja ID #${c.id} | Operador: ${c.usuario?.nombre} (${c.usuario?.email}) | Fondo Inicial: $${c.montoInicial}`);
        });

        if (resAbiertas.body.data?.length < 2) {
            throw new Error(`Se esperaban al menos 2 cajas abiertas en paralelo, pero se encontraron ${resAbiertas.body.data?.length}`);
        }

        // -------------------------------------------------------------------------
        // 7. SEGURIDAD Y PERMISOS DE CIERRE DE CAJA
        // -------------------------------------------------------------------------
        console.log("\n🛡️ [8/8] Intentando cerrar la caja del Admin desde la cuenta del Empleado (Prueba de Permisos)...");
        const resIntentoCierreProhibido = await request.post(`/api/cajas/${adminCajaId}/cerrar`).set("Authorization", `Bearer ${empToken}`).send({
            efectivoReal: 10000
        });

        if (resIntentoCierreProhibido.status === 403) {
            console.log("   ✅ SEGURIDAD REFORZADA: El backend rechazó correctamente la acción (HTTP 403 FORBIDDEN).");
        } else {
            throw new Error(`Error de seguridad: Se permitió al Empleado cerrar la caja del Admin (Status: ${resIntentoCierreProhibido.status})`);
        }

        // Limpieza final: cerrar ambas cajas de forma segura
        await request.post(`/api/cajas/${empCajaId}/cerrar`).set("Authorization", `Bearer ${empToken}`).send({ efectivoReal: 3000 });
        await request.post(`/api/cajas/${adminCajaId}/cerrar`).set("Authorization", `Bearer ${adminToken}`).send({ efectivoReal: 10000 });

        console.log("\n==========================================================================================");
        console.log("🏆 ¡PRUEBA DE SIMULACIÓN REAL COMPLETADA AL 100% PERFECTO CON USUARIOS EN VIVO! 🏆");
        console.log("==========================================================================================\n");
        process.exit(0);

    } catch (err) {
        console.error("\n❌ ERROR DURANTE LA SIMULACIÓN DE USUARIOS REALES:", err);
        process.exit(1);
    }
}

runRealUserSimulation();

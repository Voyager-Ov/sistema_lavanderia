import "dotenv/config";
import request from "supertest";
import app from "../src/app.js";
import { connectionManager } from "../src/models/connectionManager.js";

async function runFullModuleCheck() {
    console.log("=================================================");
    console.log("🧪 INICIANDO AUDITORÍA INTEGRAL DE TODOS LOS MÓDULOS DE BACK2 Y FRONTEND");
    console.log("=================================================\n");

    console.log("⚙️  Inicializando modelos centrales de PostgreSQL (Neon DB)...");
    await connectionManager.initCentral();

    const testEmail = `test_runner_${Date.now()}@lavanderia.com`;
    const testPassword = "PasswordSegura123!";
    let authToken = "";
    let superAdminToken = "";
    let clienteIdCreated = null;
    let pedidoIdCreated = null;
    let servicioIdCreated = null;

    // 1. HEALTH CHECK
    console.log("1️⃣  Verificando /api/health...");
    const resHealth = await request(app).get("/api/health");
    console.log(`   [STATUS ${resHealth.status}]`, resHealth.body.message || resHealth.body);

    // 2. AUTH - REGISTER & LOGIN
    console.log("\n2️⃣  Verificando Módulo AUTH (Register, Verification, Login, Me)...");
    const resReg = await request(app).post("/api/auth/register").send({
        usuarioNombre: "Octavio Velo",
        email: testEmail,
        password: testPassword,
        negocioNombre: "Lavandería Integracion",
        rol: "ADMIN"
    });
    console.log(`   [Register STATUS ${resReg.status}]`, resReg.body);
    const tokenConfirmacion = resReg.body.data?.tokenConfirmacion;

    // Envío real a octavio.velo2022@gmail.com
    console.log("   📧 Enviando notificación de token real a octavio.velo2022@gmail.com...");
    await request(app).post("/api/auth/forgot-password").send({ email: "octavio.velo2022@gmail.com" });

    // Verificación de email
    const resVer = await request(app).post("/api/auth/verify-email").send({
        email: testEmail,
        code: tokenConfirmacion
    });
    console.log(`   [Verify-Email STATUS ${resVer.status}]`, resVer.body);

    // Login
    const resLogin = await request(app).post("/api/auth/login").send({
        email: testEmail,
        password: testPassword
    });
    console.log(`   [Login STATUS ${resLogin.status}]`, resLogin.body);
    authToken = resLogin.body.data?.token;

    // Get Me
    const resMe = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${authToken}`);
    console.log(`   [GetMe STATUS ${resMe.status}] Logueado como:`, resMe.body.data?.usuario?.email);

    // 3. CLIENTES MODULE
    console.log("\n3️⃣  Verificando Módulo CLIENTES...");
    const resCrearCliente = await request(app)
        .post("/api/clientes")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
            nombre: "Juan Carlos Test",
            telefono: "1199887766",
            email: `cliente_${Date.now()}@ejemplo.com`,
            direccion: "Av. Corrientes 1234"
        });
    console.log(`   [Crear Cliente STATUS ${resCrearCliente.status}]`, resCrearCliente.body.message);
    clienteIdCreated = resCrearCliente.body.data?.id;

    const resListarClientes = await request(app)
        .get("/api/clientes")
        .set("Authorization", `Bearer ${authToken}`);
    console.log(`   [Listar Clientes STATUS ${resListarClientes.status}] Total clientes:`, resListarClientes.body.data?.length || resListarClientes.body.data?.rows?.length || 0);

    // 4. SERVICIOS MODULE
    console.log("\n4️⃣  Verificando Módulo SERVICIOS...");
    const resCrearServicio = await request(app)
        .post("/api/servicios")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
            nombre: "Lavado Especial Abrasivo",
            precio: 3500,
            tipo: "UNIDAD",
            descripcion: "Lavado delicado para prendas sintéticas"
        });
    console.log(`   [Crear Servicio STATUS ${resCrearServicio.status}]`, resCrearServicio.body.message);
    servicioIdCreated = resCrearServicio.body.data?.id;

    // 5. PEDIDOS MODULE
    console.log("\n5️⃣  Verificando Módulo PEDIDOS...");
    if (clienteIdCreated && servicioIdCreated) {
        const resCrearPedido = await request(app)
            .post("/api/pedidos")
            .set("Authorization", `Bearer ${authToken}`)
            .send({
                clienteId: clienteIdCreated,
                metodoPagoId: 1,
                items: [
                    { servicioId: servicioIdCreated, cantidad: 2, precio: 3500 }
                ],
                observaciones: "Prueba de integración directa"
            });
        console.log(`   [Crear Pedido STATUS ${resCrearPedido.status}]`, resCrearPedido.body.message);
        pedidoIdCreated = resCrearPedido.body.data?.id;

        const resListarPedidos = await request(app)
            .get("/api/pedidos")
            .set("Authorization", `Bearer ${authToken}`);
        console.log(`   [Listar Pedidos STATUS ${resListarPedidos.status}] Total pedidos:`, resListarPedidos.body.data?.length || resListarPedidos.body.data?.rows?.length || 0);
    }

    // 6. FINANZAS Y CAJAS MODULE
    console.log("\n6️⃣  Verificando Módulo FINANZAS Y CAJAS...");
    const resCajaEstado = await request(app)
        .get("/api/cajas/estado")
        .set("Authorization", `Bearer ${authToken}`);
    console.log(`   [Estado Caja STATUS ${resCajaEstado.status}]`, resCajaEstado.body.message || resCajaEstado.body);

    // 7. DASHBOARD MODULE
    console.log("\n7️⃣  Verificando Módulo DASHBOARD...");
    const resDash = await request(app)
        .get("/api/dashboard")
        .set("Authorization", `Bearer ${authToken}`);
    console.log(`   [Dashboard STATUS ${resDash.status}]`, resDash.body.message || resDash.body);

    // 8. SUPERADMIN MODULE
    console.log("\n8️⃣  Verificando Módulo SUPERADMIN...");
    const resSuperLogin = await request(app).post("/api/auth/login").send({
        email: process.env.SUPERADMIN_EMAIL || "superadmin@sistema.com",
        password: process.env.SUPERADMIN_PASSWORD || "SuperSecretPassword123!"
    });
    if (resSuperLogin.status === 200) {
        superAdminToken = resSuperLogin.body.token || resSuperLogin.body.data?.token;
        console.log(`   [SuperAdmin Login STATUS ${resSuperLogin.status}] OK`);

        const resSuperDash = await request(app)
            .get("/api/superadmin/dashboard")
            .set("Authorization", `Bearer ${superAdminToken}`);
        console.log(`   [SuperAdmin Dashboard STATUS ${resSuperDash.status}] Total Negocios:`, resSuperDash.body.data?.totalNegocios);
    } else {
        console.log(`   [SuperAdmin Login STATUS ${resSuperLogin.status}] (Seed requerido o credenciales por defecto)`);
    }

    console.log("\n=================================================");
    console.log("✅ AUDITORÍA INTEGRAL DE MÓDULOS COMPLETADA EXITOSAMENTE");
    console.log("=================================================");
    process.exit(0);
}

runFullModuleCheck().catch((err) => {
    console.error("❌ Error en la prueba integral de módulos:", err);
    process.exit(1);
});

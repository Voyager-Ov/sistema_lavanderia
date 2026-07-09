const BASE_URL = "http://localhost:3000/api";
const EMAIL = "pepepelotudo4@gmail.com";
const PASSWORD = "Password123";

async function runTest() {
    console.log("=========================================================");
    console.log("🧪 INICIANDO PRUEBAS FINALES END-TO-END DEL BACKEND 🧪");
    console.log("=========================================================\n");

    let token = "";
    let categoriaId = "";
    let productoId = "";
    let clienteId = "";
    let pedidoId = "";

    try {
        // 1. LOGIN
        console.log("➡️  Paso 1: Iniciando sesión...");
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: EMAIL, password: PASSWORD })
        });
        const loginData = await loginRes.json();
        if (!loginRes.ok) throw new Error(`Fallo Login: ${JSON.stringify(loginData)}`);
        token = loginData.data.token;
        console.log("   ✅ Login exitoso. Token JWT obtenido.\n");

        const headers = {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        };

        // 2. DASHBOARD
        console.log("➡️  Paso 2: Consultando Dashboard...");
        const dashRes = await fetch(`${BASE_URL}/dashboard/stats`, { headers });
        const dashData = await dashRes.json();
        if (!dashRes.ok) throw new Error(`Fallo Dashboard: ${JSON.stringify(dashData)}`);
        console.log("   ✅ Dashboard obtenido correctamente.\n");

        // 3. CREAR CATEGORÍA
        console.log("➡️  Paso 3: Creando Categoría...");
        const catRes = await fetch(`${BASE_URL}/categorias`, {
            method: "POST",
            headers,
            body: JSON.stringify({
                nombre: `Ropa Blanca ${Date.now()}`,
                descripcion: "Sábanas y toallas"
            })
        });
        const catData = await catRes.json();
        if (!catRes.ok) throw new Error(`Fallo Categoría: ${JSON.stringify(catData)}`);
        categoriaId = catData.data.id;
        console.log(`   ✅ Categoría creada (ID: ${categoriaId}).\n`);

        // 4. CREAR PRODUCTO
        console.log("➡️  Paso 4: Creando Producto/Servicio...");
        const prodRes = await fetch(`${BASE_URL}/productos`, {
            method: "POST",
            headers,
            body: JSON.stringify({
                categoriaId,
                nombre: "Lavado Premium 10kg",
                descripcion: "Lavado, secado y doblado",
                precioActual: 8500,
                codigo: `LAV-${Date.now()}`
            })
        });
        const prodData = await prodRes.json();
        if (!prodRes.ok) throw new Error(`Fallo Producto: ${JSON.stringify(prodData)}`);
        productoId = prodData.data.id;
        console.log(`   ✅ Producto creado (ID: ${productoId}).\n`);

        // 5. CREAR CLIENTE
        console.log("➡️  Paso 5: Registrando nuevo Cliente...");
        const cliRes = await fetch(`${BASE_URL}/clientes`, {
            method: "POST",
            headers,
            body: JSON.stringify({
                nombre: "Juan",
                apellido: "Pruebas",
                telefono: `54911${String(Date.now()).slice(-8)}`,
                email: `juan_${Date.now()}@prueba.com`,
                documento: `${String(Date.now()).slice(-8)}`
            })
        });
        const cliData = await cliRes.json();
        if (!cliRes.ok) throw new Error(`Fallo Cliente: ${JSON.stringify(cliData)}`);
        clienteId = cliData.data.id;
        console.log(`   ✅ Cliente creado (ID: ${clienteId}).\n`);

        // 6. CREAR PEDIDO
        console.log("➡️  Paso 6: Creando un Pedido...");
        const pedRes = await fetch(`${BASE_URL}/pedidos`, {
            method: "POST",
            headers,
            body: JSON.stringify({
                clienteId,
                items: [{ productoId, cantidad: 2 }] // Total: 17000
            })
        });
        const pedData = await pedRes.json();
        if (!pedRes.ok) throw new Error(`Fallo Pedido: ${JSON.stringify(pedData)}`);
        pedidoId = pedData.data.id;
        console.log(`   ✅ Pedido creado exitosamente (ID: ${pedidoId}). Total: $${pedData.data.total}\n`);

        // 7. ACTUALIZAR ESTADO DEL PEDIDO (Dispara WhatsApp si está conectado)
        console.log("➡️  Paso 7: Actualizando estado del pedido a LISTO_PARA_RETIRAR...");
        const patchRes = await fetch(`${BASE_URL}/pedidos/${pedidoId}/estado`, {
            method: "PATCH",
            headers,
            body: JSON.stringify({ estado: "LISTO_PARA_RETIRAR" })
        });
        const patchData = await patchRes.json();
        if (!patchRes.ok) throw new Error(`Fallo Cambio de Estado: ${JSON.stringify(patchData)}`);
        console.log("   ✅ Estado cambiado exitosamente (Se activó el hook de WhatsApp en background).\n");

        // 7.5 ABRIR CAJA (Requerido para cobrar)
        console.log("➡️  Paso 7.5: Abriendo Caja...");
        const cajaRes = await fetch(`${BASE_URL}/cajas/abrir`, {
            method: "POST",
            headers,
            body: JSON.stringify({ saldoInicial: 1000 })
        });
        const cajaData = await cajaRes.json();
        // Puede que ya esté abierta, si da error no cortamos a menos que sea otro error.
        if (!cajaRes.ok && !cajaData.error.includes("Ya tienes una caja abierta")) {
            throw new Error(`Fallo Abrir Caja: ${JSON.stringify(cajaData)}`);
        }
        console.log("   ✅ Caja abierta correctamente (o ya estaba abierta).\n");

        // 8. CREAR COBRO (Pago)
        console.log("➡️  Paso 8: Registrando el Pago del pedido...");
        
        // Obtener métodos de pago o crearlo si no existe
        const metodosRes = await fetch(`${BASE_URL}/pagos/metodos`, { headers });
        const metodosData = await metodosRes.json();
        let metodoPagoId;
        
        if (metodosData.data && metodosData.data.length > 0) {
            metodoPagoId = metodosData.data[0].id;
        } else {
            console.log("   ⚠️ No hay métodos de pago. Creando método 'Efectivo'...");
            const nuevoMetodoRes = await fetch(`${BASE_URL}/pagos/metodos`, {
                method: "POST",
                headers,
                body: JSON.stringify({ nombre: "Efectivo", tipo: "EFECTIVO", esHabilitado: true })
            });
            const nuevoMetodoData = await nuevoMetodoRes.json();
            if (!nuevoMetodoRes.ok) {
                console.error("DEBUG:", nuevoMetodoData);
                throw new Error("Fallo creacion metodo pago");
            }
            metodoPagoId = nuevoMetodoData.data.id;
        }

        const pagoRes = await fetch(`${BASE_URL}/pagos`, {
            method: "POST",
            headers,
            body: JSON.stringify({
                pedidoId,
                clienteId,
                metodoPagoId,
                monto: 17000,
                referencia: "Pago E2E"
            })
        });
        const pagoData = await pagoRes.json();
        if (!pagoRes.ok) throw new Error(`Fallo Pago: ${JSON.stringify(pagoData)}`);
        console.log(`   ✅ Pago asentado correctamente (ID: ${pagoData.data.id}).\n`);

        console.log("=========================================================");
        console.log("🎉 TODAS LAS PRUEBAS END-TO-END FUERON EXITOSAS 🎉");
        console.log("=========================================================");
    } catch (error) {
        console.error("❌ LA PRUEBA FALLÓ:", error.message);
        process.exit(1);
    }
}

runTest();

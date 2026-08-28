import { test, expect, request } from '@playwright/test';
import { generatePOSBusiness } from '../fixtures/seed-data-pos';
import { E2EPOSFinancialUIHelper } from '../helpers/e2e-pos-financial-ui.helper';

const BACKEND_URL = process.env.API_URL || 'http://127.0.0.1:5001';

test.describe('Ataque de Fuerza Bruta & Diagnóstico de Discrepancias Contables', () => {
  test.setTimeout(180000);

  test('debe someter la lógica de cajas, cobros, gastos y cancelaciones a 8 escenarios extremos para delimitar la causa raíz de discrepancias', async ({ page }) => {
    const apiContext = await request.newContext({ baseURL: BACKEND_URL });

    // 1. Crear un negocio de prueba para aislamiento total
    const businessData = generatePOSBusiness();
    
    // Registrar negocio en UI
    await E2EPOSFinancialUIHelper.registerBusinessViaUI(page, businessData);

    // Login SuperAdmin y Aprobar en UI
    await E2EPOSFinancialUIHelper.loginSuperAdminAndApproveViaUI(page, businessData.email);

    // Login Admin del nuevo negocio
    const session = await E2EPOSFinancialUIHelper.loginUserViaUI(page, {
      email: businessData.email,
      password: businessData.password
    });

    const token = session.token;
    const negocioId = session.negocioId;

    console.log(`🧪 Diagnóstico iniciado en Negocio Tenant ID: ${negocioId}`);

    // Obtener y asegurar métodos de pago
    const metodosRes = await apiContext.get('/api/pagos/metodos', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const metodosData = await metodosRes.json();
    const metodos = Array.isArray(metodosData) ? metodosData : (metodosData.data || []);
    
    let metodoEfectivo = metodos.find((m: any) => m.nombre.trim().toUpperCase() === 'EFECTIVO');
    if (!metodoEfectivo) {
      const createEf = await apiContext.post('/api/pagos/metodos', {
        headers: { Authorization: `Bearer ${token}` },
        data: { nombre: 'Efectivo', icono: 'Banknote' }
      });
      metodoEfectivo = (await createEf.json()).data;
    }

    let metodoTransf = metodos.find((m: any) => m.nombre.toLowerCase().includes('transferencia'));
    if (!metodoTransf) {
      const createTr = await apiContext.post('/api/pagos/metodos', {
        headers: { Authorization: `Bearer ${token}` },
        data: { nombre: 'Transferencia Bancaria', icono: 'Landmark' }
      });
      metodoTransf = (await createTr.json()).data;
    }

    let metodoMP = metodos.find((m: any) => m.nombre.toLowerCase().includes('mercado') || m.nombre.toLowerCase().includes('qr'));
    if (!metodoMP) {
      const createMp = await apiContext.post('/api/pagos/metodos', {
        headers: { Authorization: `Bearer ${token}` },
        data: { nombre: 'Mercado Pago / QR', icono: 'QrCode' }
      });
      metodoMP = (await createMp.json()).data;
    }

    // Crear 1 Cliente y 1 Servicio base
    const cliRes = await apiContext.post('/api/clientes', {
      headers: { Authorization: `Bearer ${token}` },
      data: { nombre: 'Cliente', apellido: 'Diagnostico', telefono: '1100000000', email: 'diag@test.com' }
    });
    const cliente = (await cliRes.json()).data;

    const catRes = await apiContext.post('/api/categorias', {
      headers: { Authorization: `Bearer ${token}` },
      data: { nombre: 'General', descripcion: 'Cat General' }
    });
    const categoria = (await catRes.json()).data;

    const srvRes = await apiContext.post('/api/servicios', {
      headers: { Authorization: `Bearer ${token}` },
      data: { nombre: 'Lavado Test', categoriaId: categoria.id, precioActual: 5000, tiempoEstimadoHoras: 24, activo: true }
    });
    const servicio = (await srvRes.json()).data;

    // ─── ESCENARIO 1: Apertura de Caja e Impacto de Gastos Digitales vs Efectivo ───
    console.log(`\n--- ESCENARIO 1: Impacto de Gastos en Efectivo vs Digitales en Saldo Teórico de Caja ---`);
    const openRes1 = await apiContext.post('/api/cajas/abrir', {
      headers: { Authorization: `Bearer ${token}` },
      data: { montoInicial: 10000, observaciones: 'Apertura Test 1' }
    });
    const caja1 = (await openRes1.json()).data;

    // Registrar 1 Gasto en EFECTIVO ($2.000)
    await apiContext.post('/api/gastos', {
      headers: { Authorization: `Bearer ${token}` },
      data: { descripcion: 'Gasto Efectivo', monto: 2000, metodoPagoId: metodoEfectivo.id, categoria: 'Varios' }
    });

    // Registrar 1 Gasto por TRANSFERENCIA ($3.000)
    await apiContext.post('/api/gastos', {
      headers: { Authorization: `Bearer ${token}` },
      data: { descripcion: 'Gasto Transferencia', monto: 3000, metodoPagoId: metodoTransf.id, categoria: 'Varios' }
    });

    // Consultar estado de la caja actual para auditar el efectivo esperado
    const cajaActualRes1 = await apiContext.get('/api/cajas/actual', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const cajaActual1 = (await cajaActualRes1.json()).data;

    console.log(`🔍 [Escenario 1] Fondo Inicial: $10.000 | Gastos: $2.000 Efectivo, $3.000 Transferencia`);
    console.log(`🔍 [Escenario 1] Efectivo Esperado Teórico en Caja: $${cajaActual1.efectivoEsperado} (Esperado Real: $8.000)`);
    if (cajaActual1.efectivoEsperado !== 8000) {
      console.error(`🚨 DISCREPANCIA DETECTADA EN GASTOS: El gasto por Transferencia ($3.000) fue descontado erróneamente de la Caja de Efectivo! Saldo Teórico calculado: $${cajaActual1.efectivoEsperado}`);
    } else {
      console.log(`✅ Gastos discriminados correctamente (Gasto por transferencia no alteró el efectivo físico).`);
    }

    // Cerrar Caja 1
    const closeRes1 = await apiContext.post(`/api/cajas/${cajaActual1.id || cajaActual1.idCaja}/cerrar`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { efectivoReal: cajaActual1.efectivoEsperado, observaciones: 'Cierre Test 1' }
    });
    console.log(`🔒 [Cierre Caja 1 Status]: ${closeRes1.status()}`, await closeRes1.json());

    // ─── ESCENARIO 2: Cobro Digital (MercadoPago/Transferencia) e Impacto en Caja de Efectivo ───
    console.log(`\n--- ESCENARIO 2: Cobros Digitales e Impacto en Saldo Teórico Físico ---`);
    await apiContext.post('/api/cajas/abrir', {
      headers: { Authorization: `Bearer ${token}` },
      data: { montoInicial: 5000, observaciones: 'Apertura Test 2' }
    });

    // Crear Pedido A ($5.000) y Cobrar con MercadoPago
    const pedARes = await apiContext.post('/api/pedidos', {
      headers: { Authorization: `Bearer ${token}` },
      data: { clienteId: cliente.id, detalles: [{ servicioId: servicio.id, cantidad: 1, precioUnitario: 5000, subtotal: 5000 }], montoTotal: 5000 }
    });
    const pedA = (await pedARes.json()).data;

    await apiContext.post('/api/pagos', {
      headers: { Authorization: `Bearer ${token}` },
      data: { pedidoId: pedA.numeroPedido || pedA.id, pedidosIds: [pedA.numeroPedido || pedA.id], montoRecibido: 5000, metodoPagoId: metodoMP.id }
    });

    const cajaActualRes2 = await apiContext.get('/api/cajas/actual', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const cajaActual2 = (await cajaActualRes2.json()).data;

    console.log(`🔍 [Escenario 2] Fondo Inicial: $5.000 | Venta MercadoPago: $5.000`);
    console.log(`🔍 [Escenario 2] Efectivo Esperado Teórico en Caja: $${cajaActual2.efectivoEsperado} (Esperado Real: $5.000)`);
    console.log(`🔍 [Escenario 2] Total Ingresos Digitales: $${cajaActual2.totalIngresosDigitales}`);

    if (cajaActual2.efectivoEsperado !== 5000) {
      console.error(`🚨 DISCREPANCIA DETECTADA EN COBROS DIGITALES: El cobro digital ($5.000) sumó erróneamente al efectivo físico de la Caja! Saldo Teórico calculado: $${cajaActual2.efectivoEsperado}`);
    } else {
      console.log(`✅ Cobro digital correctamente excluido del cálculo de efectivo físico.`);
    }

    await apiContext.post(`/api/cajas/${cajaActual2.id || cajaActual2.idCaja}/cerrar`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { efectivoReal: cajaActual2.efectivoEsperado, observaciones: 'Cierre Test 2' }
    });

    // ─── ESCENARIO 3: Cobro con Vuelto a Favor en Cuenta Corriente ───
    console.log(`\n--- ESCENARIO 3: Cobro en Efectivo abonando $10.000 por pedido de $5.000 dejando $5.000 Vuelto a Favor ---`);
    await apiContext.post('/api/cajas/abrir', {
      headers: { Authorization: `Bearer ${token}` },
      data: { montoInicial: 5000, observaciones: 'Apertura Test 3' }
    });

    const pedBRes = await apiContext.post('/api/pedidos', {
      headers: { Authorization: `Bearer ${token}` },
      data: { clienteId: cliente.id, detalles: [{ servicioId: servicio.id, cantidad: 1, precioUnitario: 5000, subtotal: 5000 }], montoTotal: 5000 }
    });
    const pedB = (await pedBRes.json()).data;

    await apiContext.post('/api/pagos', {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        pedidoId: pedB.numeroPedido || pedB.id,
        pedidosIds: [pedB.numeroPedido || pedB.id],
        montoRecibido: 10000,
        dejarVueltoAFavor: true,
        metodoPagoId: metodoEfectivo.id
      }
    });

    const cajaActualRes3 = await apiContext.get('/api/cajas/actual', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const cajaActual3 = (await cajaActualRes3.json()).data;

    console.log(`🔍 [Escenario 3] Fondo Inicial: $5.000 | Pedido: $5.000 | Recibido Efectivo: $10.000 (Vuelto a Favor $5.000)`);
    console.log(`🔍 [Escenario 3] Efectivo Esperado Teórico en Caja: $${cajaActual3.efectivoEsperado}`);
    console.log(`🔍 [Escenario 3] Ingresos Efectivo Registrados en MovimientoCaja: $${cajaActual3.totalIngresosEfectivo}`);

    if (cajaActual3.efectivoEsperado === 15000) {
      console.log(`✅ Todo el dinero físico ingresado ($10.000) quedó guardado en el cajón de efectivo.`);
    } else if (cajaActual3.efectivoEsperado === 10000) {
      console.warn(`⚠️ ALERTA DE COINCIDENCIA: Solo se sumó el monto neto del pedido ($5.000) al efectivo de caja, omitiendo los $5.000 sobrantes del billete de $10.000 físicamente guardado en el cajón.`);
    }

    await apiContext.post(`/api/cajas/${cajaActual3.id || cajaActual3.idCaja}/cerrar`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { efectivoReal: cajaActual3.efectivoEsperado, observaciones: 'Cierre Test 3' }
    });

    // ─── ESCENARIO 4: Cancelación de Pedido Abonado (Reembolso vs Movimiento de Caja) ───
    console.log(`\n--- ESCENARIO 4: Cancelación de Pedido Previamente Cobrado en Efectivo ---`);
    await apiContext.post('/api/cajas/abrir', {
      headers: { Authorization: `Bearer ${token}` },
      data: { montoInicial: 10000, observaciones: 'Apertura Test 4' }
    });

    const pedCRes = await apiContext.post('/api/pedidos', {
      headers: { Authorization: `Bearer ${token}` },
      data: { clienteId: cliente.id, detalles: [{ servicioId: servicio.id, cantidad: 1, precioUnitario: 5000, subtotal: 5000 }], montoTotal: 5000 }
    });
    const pedC = (await pedCRes.json()).data;

    await apiContext.post('/api/pagos', {
      headers: { Authorization: `Bearer ${token}` },
      data: { pedidoId: pedC.numeroPedido || pedC.id, pedidosIds: [pedC.numeroPedido || pedC.id], montoRecibido: 5000, metodoPagoId: metodoEfectivo.id }
    });

    // Cancelar el pedido C
    await apiContext.patch(`/api/pedidos/${pedC.numeroPedido || pedC.id}/estado`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { estado: 'CANCELADO', nuevoEstado: 'CANCELADO', observaciones: 'Anulación por cliente' }
    });

    const cajaActualRes4 = await apiContext.get('/api/cajas/actual', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const cajaActual4 = (await cajaActualRes4.json()).data;

    console.log(`🔍 [Escenario 4] Fondo Inicial: $10.000 | Cobro Efectivo: $5.000 | Pedido Cancelado Posterior`);
    console.log(`🔍 [Escenario 4] Efectivo Esperado Teórico en Caja: $${cajaActual4.efectivoEsperado}`);

    await apiContext.post(`/api/cajas/${cajaActual4.id || cajaActual4.idCaja}/cerrar`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { efectivoReal: cajaActual4.efectivoEsperado, observaciones: 'Cierre Test 4' }
    });

    console.log(`\n🏁 ATAQUE DE FUERZA BRUTA Y DIAGNÓSTICO COMPLETADO.`);
  });
});

# Protocolo de Desarrollo, Arquitectura y Reglas de Negocio "Jugar"

Este documento es el **manual definitivo de arquitectura, reglas de negocio y metodología de integración** para mantener la coherencia absoluta entre el **Front-End (`front`)** y el **Back-End (`back2`)**.

---

## 🎮 1. Metodología "Jugar" (Auditoría Cruzada & Pruebas de Resiliencia)

La instrucción **"Jugar"** define la cultura de desarrollo proactivo, auditoría cruzada e integración continua entre ambas capas del sistema:

1. **Auditoría Cruzada Front <-> Back**:
   - Cada pantalla, hook y componente del Front-End debe ser auditado contra el controlador y servicio correspondiente en `back2`.
   - Verificar que cada ruta consumida por `apiClient` esté registrada en `app.js` y `*.routes.js` con el contrato JSON exacto que requiere el hook.
   - Detectar y corregir inmediatamente rutas `404`, tipos desalineados, parámetros faltantes o respuestas sin estructura.

2. **Pruebas de Resiliencia en Vivo con Scripts**:
   - Escribir y ejecutar scripts de integración (ej: `test_reportes_module.js`, `stress_test_cobros.js`, `mass_live_audit.js`) ejecutándose contra la base de datos viva (Neon PostgreSQL - `Negocio ID: 13` / `octavio.velo2022@gmail.com`).
   - Someter la lógica a casos extremos: vueltos en efectivo, consumo parcial de saldo a favor, cobros en lote masivos, intentos de cobro en pedidos cancelados o duplicados y arqueos de caja.

---

## 🏢 2. Reglas de Aislamiento Multitenant & Seguridad

1. **Extractor Único de Tenant (`getTenantId`)**:
   - Todo controlador en `back2` debe obtener el ID de negocio **exclusivamente de la sesión autenticada** (`req.user?.negocioId`).
   - Jamás aceptar `negocioId` desde parámetros de URL o body sin verificación.
   - **Prohibición de Fallbacks**: Si no se identifica un `negocioId` válido, arrojar `AppError("No se ha identificado el negocio activo.", 400, "MISSING_TENANT_ID")`. Queda prohibido asumir `negocioId = 1` o fallbacks silenciosos.

2. **Prohibición de Datos Hardcodeados**:
   - Queda prohibido el uso de valores estáticos genéricos (ej: cliente `"Cliente"`, método `"Efectivo"` implícito). Si falta información requerida, el servidor responde con error explícito y el Front-End notifica visualmente mediante `toast.error` o alertas.

---

## 💰 3. Reglas del Dominio Financiero & Cuenta Corriente

1. **Regla de Deuda Única (Deuda Exigible vs Monto en Taller)**:
   - **Deuda Exigible (Cobranza)**: Únicamente los pedidos en estado **`ENTREGADO`** (o listos para retiro) que tengan `cobrado = false`.
   - **Monto en Taller**: Pedidos en proceso (`PENDIENTE`, `EN_LAVADO`, `EN_PROCESO`) que aún no representan una deuda vencida/exigible al cliente.

2. **Sistema de Crédito & Saldo a Favor**:
   - El saldo a favor se genera mediante el vuelto de pagos en efectivo (`dejarVueltoAFavor: true`) o mediante ajustes manuales acreditados en la `CuentaCorriente` del cliente.
   - Al cobrar un nuevo pedido con `aplicarSaldoAFavor: true`, el servidor consume atómicamente el crédito disponible hasta cubrir el monto del pedido.

3. **Transaccionalidad en Cobros Masivos (Lotes)**:
   - Toda operación de cobro (`procesarCobro`) debe ejecutarse dentro de una transacción SQL atómica.
   - Si un lote contiene al menos 1 pedido en estado `CANCELADO` o previamente `COBRADO`, **se revierte la transacción completa** y no se registra ningún cobro ni movimiento.

---

## 💵 4. Reglas de Caja Chica & Arqueo Diario

1. **Validación Obligatoria de Caja Abierta**:
   - **Back-End**: Todo intento de registrar un cobro o gasto exige la existencia de una `Caja` activa con `estadoCaja: "Abierta"`. De lo contrario, se rechaza la operación (`400 BAD_REQUEST`, `NO_OPEN_CASH_REGISTER`).
   - **Front-End**: `CobrarPedidosSheet` consulta `/cajas/actual`. Si la caja está cerrada, despliega un banner de advertencia (`⚠️ Caja Cerrada`), deshabilita el botón de cobro y ofrece acceso directo para abrir caja.

2. **Trazabilidad de Movimientos de Caja**:
   - Cada cobro que incluya dinero físico abonado genera automáticamente un registro en `MovimientoCaja` vinculado al `idCaja` del turno activo con su respectiva observación y método de pago.

---

## 🧺 5. Reglas del Modelo de Pedidos & Precios

1. **Modelo de Mostrador 100% On-Site (Sin Envío)**:
   - El sistema opera bajo un modelo de atención en mostrador.
   - No se aplican cargos por envío ni delivery (`costoEnvio = 0`).
   - El total del pedido es igual a la suma de sus ítems (`total = subtotal`).

2. **Inmutabilidad de Precios Históricos**:
   - Los ítems de un pedido guardan `precioHistorico` al momento de la creación para evitar distorsiones contables si el catálogo de tarifas cambia en el futuro.

---

## 📅 6. Reglas de Tratamiento de Fechas & Zona Horaria

1. **Cobertura de Día Local Completo (`00:00:00` a `23:59:59`)**:
   - **Front-End**: Formatear fechas locales usando el helper `toLocalYMD(date)` (`YYYY-MM-DD`) evitando `.toISOString().split('T')[0]` para prevenir desfasajes horarios GMT/UTC en filtros como "Hoy".
   - **Back-End**: Al recibir fechas de filtro (`fechaInicio`/`fechaFin` o `fechaDesde`/`fechaHasta`), utilizar el helper `parseDateRange` para extender la fecha limite a las **`23:59:59.999`** y consultar campos `fechaHoraCreacion`, `fechaHoraPedido` y `createdAt` mediante `[Op.or]`.

---

## 🎨 7. Reglas de Interfaz de Usuario (UI) & Componentes

1. **Componentes de Superposición (Overlays & SideSheets)**:
   - Usar SIEMPRE el componente `ResponsiveSheet` (`src/shared/ui/overlays/responsive-sheet.tsx`) para formularios laterales y paneles de cobro.
   - No sobreescribir sus dimensiones (`max-w-`, `w-`, `h-`) para mantener uniformidad en escritorio y móvil.

2. **Retroalimentación Visual**:
   - Toda acción del usuario debe proveer retroalimentación visual inmediata mediante estados de carga (`loading`), notificaciones emergentes (`toast.success` / `toast.error`) o banners de estado.

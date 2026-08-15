# Protocolo de Desarrollo, Arquitectura y Metodología "Jugar"

Este documento contiene las reglas de diseño, arquitectura y la metodología de trabajo acordada para mantener la integridad total entre el **Front-End** y el **Back-End (`back2`)**.

---

## 🎮 1. Metodología "Jugar" (Auditoría Cruzada & Pruebas Continuas)

La instrucción **"Jugar"** define el proceso proactivo de auditoría e integración entre las dos capas del sistema:

1. **Auditoría Cruzada Front <-> Back**:
   - Revisar exhaustivamente cada página, hook y componente del Front-End para identificar qué endpoints de `back2` consume.
   - Verificar en `back2` que cada ruta exista, esté registrada en `app.js` / `*.routes.js` y devuelva el contrato JSON exacto que espera la interfaz.
   - Mitigar de inmediato cualquier desconexión, error `404 Ruta no encontrada`, parámetro faltante o tipo incompatible.

2. **Pruebas de Resiliencia en Vivo con Scripts**:
   - Escribir y ejecutar scripts de integración (ej: `test_reportes_module.js`, `stress_test_cobros.js`, `mass_live_audit.js`) conectándose a la base de datos viva (Neon PostgreSQL - `Negocio ID: 13` / `octavio.velo2022@gmail.com`).
   - Someter el sistema a casos extremos: vueltos en efectivo, consumo parcial de saldo a favor, cobros masivos en lote, bloqueos de pedidos cancelados o cobrados y validación contable.

---

## 🏛️ 2. Reglas Estrictas de Dominio y Arquitectura

### A. Prohibición de Datos Hardcodeados y Fallbacks Silenciosos
- **Regla**: Ningún controlador, servicio o componente debe usar cadenas estáticas genéricas (ej: `"Cliente"`, `negocioId = 1`) o tragar errores silenciosamente.
- **Acción**: Si falta un dato obligatorio, el Back-End debe arrojar un `AppError` explícito (ej: `400 BAD_REQUEST`, `MISSING_TENANT_ID`) y el Front-End debe notificar mediante `toast.error` o alertas visuales claras.

### B. Validación Obligatoria de Caja Abierta
- **Regla**: Todo cobro o transacción monetaria exige que exista un turno de caja activo en el negocio (`Caja` en estado `"Abierta"`).
- **Acción**:
  - **Back-End**: `procesarCobro` debe validar la existencia de la caja abierta; de lo contrario, rechaza la operación (`NO_OPEN_CASH_REGISTER`). Asocia cada movimiento a `cajaId`.
  - **Front-End**: `CobrarPedidosSheet` debe consultar el estado de la caja, mostrar alerta visual si está cerrada y deshabilitar el botón de cobro.

### C. Modelo sin Costo de Envío (`costoEnvio = 0`)
- **Regla**: El modelo de negocio es 100% mostrador / atención en local.
- **Acción**: No se suman cargos por despacho ni delivery (`total = subtotal`).

### D. Filtrado de Fechas sin Desfase de Zona Horaria
- **Regla**: El filtrado por fechas ("Hoy", "Semana", "Mes") debe cubrir el día local completo sin pérdidas por conversión UTC.
- **Acción**:
  - **Front-End**: Formatear fechas locales mediante `toLocalYMD` (`YYYY-MM-DD`).
  - **Back-End**: Utilizar el helper `parseDateRange` para extender la fecha `hasta` hasta las **`23:59:59.999`** y consultar campos `fechaHoraCreacion`, `fechaHoraPedido` y `createdAt`.

### E. Componentes de Superposición (Overlays & SideSheets)
- **Regla**: Usar SIEMPRE el componente `ResponsiveSheet` (`src/shared/ui/overlays/responsive-sheet.tsx`) para paneles laterales y formularios.
- **Acción**: No sobreescribir sus dimensiones (`max-w-`, `w-`, `h-`) para mantener la uniformidad visual.

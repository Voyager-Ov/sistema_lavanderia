# Especificación del Módulo de Control de Cajas, Arqueo de Efectivo y Turnos (Cajas)

Este documento detalla la especificación técnica completa del **Módulo de Control de Cajas, Arqueo de Efectivo y Turnos (`cajas`)** para la plataforma SaaS Multi-Tenant de lavandería, vinculando cada Caso de Uso (CU) con sus **Actores autorizados**, las **Pantallas y Componentes de Interfaz del Frontend (UI)** donde se originan las acciones y la **Funcionalidad Backend/Frontend** utilizada para resolverlas.

---

## 1. Alcance y Objetivos del Módulo

El módulo de Cajas administra el ciclo de vida financiero de los turnos de atención al cliente en mostrador. Es responsable del control del fondo de cambio inicial, la segregación determinística en tiempo real de ingresos/egresos en dinero físico frente a cobros digitales, el cálculo del efectivo esperado en cajón, la conciliación mediante arqueo físico y el registro de discrepancias (faltantes y sobrantes).

---

## 2. Mapeo Integral: Casos de Uso, Actores, Pantallas Frontend y Funcionalidad de Resolución

A continuación se especifica la matriz detallada de trazabilidad entre la interfaz de usuario, los actores del sistema y los servicios de backend:

### CU-28: Abrir Caja de Turno
*   **Actores Autorizados:** `Empleado Operativo / Cajero` (`empleado`), `Administrador de Negocio` (`admin`).
*   **Pantalla / Componente Frontend de Origen:**
    *   **Pantalla Principal de Caja:** `/admin/caja` y `/pos/caja`.
    *   **Componentes UI:** `caja-dashboard.tsx` y `abrir-caja-form.tsx` (desplegado dentro de `ResponsiveSheet` o modal de apertura).
*   **Funcionalidad con la que se Resuelve:**
    *   *Frontend:* Formulario de ingreso del fondo inicial (`montoInicial`).
    *   *Backend (Endpoint `POST /api/v1/cajas/abrir`):* Ejecución de `abrirCaja()` en `caja-core.service.js`.
    *   *Regla de Unicidad de Turno:* Verifica que el usuario no posea un turno activo en estado `ABIERTA`. Si ya existe una caja abierta para ese `usuarioId` y `negocioId`, rechaza con HTTP 400.
    *   *Estado:* Registra `estado = "ABIERTA"`, asigna `fechaApertura = NOW()` y emite el evento WebSocket `caja_actualizada`.

---

### CU-29: Consultar Estado de Caja Actual y Métricas en Vivo
*   **Actores Autorizados:** `Empleado Operativo / Cajero` (`empleado`), `Administrador de Negocio` (`admin`).
*   **Pantalla / Componente Frontend de Origen:**
    *   **Dashboard de Caja:** `/admin/caja` y `/pos/caja`.
    *   **Componentes UI:** `caja-dashboard.tsx` y `caja-metricas.tsx`.
*   **Funcionalidad con la que se Resuelve:**
    *   *Frontend:* Tarjetas KPI con actualización automática en tiempo real al recibir eventos de WebSocket `caja_actualizada`.
    *   *Backend (Endpoint `GET /api/v1/cajas/actual`):* Ejecución de `obtenerCajaActual()` en `caja-core.service.js`.
    *   *Algoritmo `calcularMetricasCaja`:* Analiza los pagos y gastos asociados al turno de caja activo, separando dinero físico en efectivo (`totalIngresosEfectivo`, `totalEgresosEfectivo`) de canales digitales (MercadoPago, QR, Transferencias). Retorna determinísticamente:
        $$\text{efectivoEsperadoEnVivo} = \text{montoInicial} + \text{totalIngresosEfectivo} - \text{totalEgresosEfectivo}$$

---

### CU-30: Realizar Arqueo y Cerrar Caja
*   **Actores Autorizados:** `Empleado Operativo / Cajero` (`empleado`), `Administrador de Negocio` (`admin`).
*   **Pantalla / Componente Frontend de Origen:**
    *   **Modal de Arqueo y Cierre:** `/admin/caja` y `/pos/caja`.
    *   **Componentes UI:** `cerrar-caja-modal.tsx` (desplegado dentro de `ResponsiveSheet`).
*   **Funcionalidad con la que se Resuelve:**
    *   *Frontend:* Formulario de recuento de billetes físicos (`efectivoReal`).
    *   *Backend (Endpoint `POST /api/v1/cajas/:id/cerrar`):* Ejecución de `cerrarCaja()` en `caja-core.service.js`.
    *   *Conciliación de Arqueo:* Calcula `efectivoEsperado` final del turno y determina la discrepancia inmutable:
        $$\text{diferenciaEfectivo} = \text{efectivoReal} - \text{efectivoEsperado}$$
    *   *Cierre:* Actualiza la caja a `estado = "CERRADA"`, asigna `fechaCierre = NOW()`, persiste `diferenciaEfectivo` (negativo = faltante, positivo = sobrante) y emite el evento WebSocket `caja_actualizada`.

---

### CU-31: Consultar Historial de Turnos de Caja Propio
*   **Actores Autorizados:** `Empleado Operativo / Cajero` (`empleado`), `Administrador de Negocio` (`admin`).
*   **Pantalla / Componente Frontend de Origen:**
    *   **Pestaña Historial:** `/admin/caja` y `/pos/caja`.
    *   **Componentes UI:** `caja-historial.tsx` y `pos-caja-historial.tsx`.
*   **Funcionalidad con la que se Resuelve:**
    *   *Frontend:* Tabla paginada de cajas históricas cerradas del usuario con indicador de arqueo (badge verde: sin diferencia / rojo: faltante / azul: sobrante).
    *   *Backend (Endpoint `GET /api/v1/cajas`):* Ejecución de `obtenerHistorialCajas()` en `caja-historial.service.js`. Si el usuario posee el rol `EMPLEADO`, la consulta aplica automáticamente el filtro scoping `where.usuarioId = req.user.id`.

---

### CU-32: Consultar Historial Global y Auditar Turnos de Caja
*   **Actores Autorizados:** `Administrador de Negocio` (`admin`) *(Exclusivo)*.
*   **Pantalla / Componente Frontend de Origen:**
    *   **Reportes de Personal y Auditoría:** `/admin/reportes/empleados` y `/admin/caja`.
    *   **Componentes UI:** `ultimas-cajas-table.tsx` y `caja-detalle-sheet.tsx` (`ResponsiveSheet`).
*   **Funcionalidad con la que se Resuelve:**
    *   *Frontend:* Vista de auditoría ejecutiva que permite seleccionar cualquier turno de caja pasado de cualquier cajero del negocio.
    *   *Backend (Endpoints `GET /api/v1/cajas` y `GET /api/v1/cajas/:id`):* Ejecución de `obtenerCajaPorId()` en `caja-historial.service.js`. Al tener rol `admin`, omite la restricción de `usuarioId` y retorna todos los cobros, gastos, actividad de pedidos del turno y discrepancia de arqueo.

---

### CU-33: Auditar Discrepancias y Diferencias de Arqueo
*   **Actores Autorizados:** `Administrador de Negocio` (`admin`) *(Exclusivo)*.
*   **Pantalla / Componente Frontend de Origen:**
    *   **Ficha Detallada de Turno:** `/admin/caja/[id]` y `/admin/reportes/empleados`.
    *   **Componentes UI:** `caja-detalle-sheet.tsx` (`ResponsiveSheet`).
*   **Funcionalidad con la que se Resuelve:**
    *   *Frontend:* Desglose detallado del turno cerrado comparando `efectivoEsperado` vs `efectivoReal`.
    *   *Backend:* Análisis de los registros de `Pago` y `Gasto` asociados a la `cajaId` del turno para identificar descalces o inconsistencias manuales.

---

## 3. Modelos de Base de Datos Vinculados

El módulo interactúa con las entidades de caja del esquema tenant (`tenant_{id}`).

### A. Modelo `Caja`
*   `id` (DataTypes.INTEGER, **PK**, autoIncrement): Identificador del turno.
*   `negocioId` (DataTypes.INTEGER, allowNull: false): Llave tenant.
*   `usuarioId` (DataTypes.INTEGER, allowNull: false): ID del cajero responsable del turno.
*   `montoInicial` (DataTypes.DECIMAL(10, 2), defaultValue: 0): Fondo de cambio asignado en efectivo al abrir.
*   `estado` (DataTypes.ENUM("ABIERTA", "CERRADA"), defaultValue: "ABIERTA"): Estado del turno.
*   `fechaApertura` (DataTypes.DATE, defaultValue: DataTypes.NOW): Timestamp de apertura.
*   `fechaCierre` (DataTypes.DATE, allowNull: true): Timestamp de cierre.
*   `totalIngresosEfectivo` (DataTypes.DECIMAL(10, 2), defaultValue: 0): Suma acumulada de cobros en dinero físico.
*   `totalEgresosEfectivo` (DataTypes.DECIMAL(10, 2), defaultValue: 0): Suma acumulada de gastos pagados en efectivo físico.
*   `efectivoEsperado` (DataTypes.DECIMAL(10, 2), defaultValue: 0): Saldo calculado que debe existir en el cajón.
*   `efectivoReal` (DataTypes.DECIMAL(10, 2), defaultValue: 0): Importe físico ingresado por el cajero al realizar el arqueo.
*   `diferenciaEfectivo` (DataTypes.DECIMAL(10, 2), defaultValue: 0): Discrepancia calculada (`efectivoReal - efectivoEsperado`).

**Asociaciones:**
*   `Caja.belongsTo(models.Usuario, { foreignKey: "usuarioId", as: "cajero" })`
*   `Caja.hasMany(models.Pago, { foreignKey: "cajaId", as: "pagos" })`
*   `Caja.hasMany(models.Gasto, { foreignKey: "cajaId", as: "gastos" })`

---

## 4. Contratos de API (JSON Payloads)

### 1. Obtener Caja Actual en Vivo (`GET /api/v1/cajas/actual`)
*   **Headers:** `Authorization: Bearer <token_jwt>`
*   **Responses:**
    *   `200 OK` ➔ Posición activa de caja con métricas en vivo.
        ```json
        {
          "status": "success",
          "message": null,
          "data": {
            "id": 14,
            "negocioId": 1,
            "usuarioId": 5,
            "montoInicial": 5000.00,
            "estado": "ABIERTA",
            "fechaApertura": "2026-08-13T08:00:00.000Z",
            "totalIngresosEnVivo": 15000.00,
            "totalEgresosEnVivo": 2000.00,
            "totalIngresosEfectivo": 10000.00,
            "totalIngresosDigitales": 5000.00,
            "totalEgresosEfectivo": 2000.00,
            "totalEgresosDigitales": 0.00,
            "efectivoEsperadoEnVivo": 13000.00,
            "totalesPorMetodo": [
              { "metodoPagoId": 1, "nombre": "Efectivo", "ingresos": 10000.00, "egresos": 2000.00 },
              { "metodoPagoId": 2, "nombre": "MercadoPago QR", "ingresos": 5000.00, "egresos": 0.00 }
            ]
          }
        }
        ```

---

### 2. Abrir Caja de Turno (`POST /api/v1/cajas/abrir`)
*   **Headers:** `Authorization: Bearer <token_jwt>`
*   **Request Body:**
    ```json
    {
      "montoInicial": 5000.00
    }
    ```
*   **Responses:**
    *   `201 Created` ➔ Turno abierto exitosamente.
    *   `400 Bad Request` ➔ El usuario ya posee un turno abierto en curso.

---

### 3. Cerrar Caja con Arqueo (`POST /api/v1/cajas/:id/cerrar`)
*   **Headers:** `Authorization: Bearer <token_jwt>`
*   **Request Body:**
    ```json
    {
      "efectivoReal": 12800.00
    }
    ```
*   **Responses:**
    *   `200 OK` ➔ Arqueo registrado y turno cerrado.
        ```json
        {
          "status": "success",
          "message": "Caja cerrada exitosamente",
          "data": {
            "id": 14,
            "estado": "CERRADA",
            "fechaCierre": "2026-08-13T18:00:00.000Z",
            "efectivoEsperado": 13000.00,
            "efectivoReal": 12800.00,
            "diferenciaEfectivo": -200.00
          }
        }
        ```

---

## 5. Algoritmos de Negocio y Lógica en los Servicios

### A. Algoritmo de Segregación de Métricas en Vivo (`calcularMetricasCaja`)

```javascript
export function calcularMetricasCaja(caja) {
    let totalIngresos = 0;
    let totalEgresos = 0;
    let totalIngresosEfectivo = 0;
    let totalIngresosDigitales = 0;
    let totalEgresosEfectivo = 0;
    let totalEgresosDigitales = 0;
    let totalCreditosAplicados = 0;
    
    const metodoMap = {};

    caja.pagos?.forEach(p => {
        const montoFisico = p.montoEfectivoTarjeta !== undefined && p.montoEfectivoTarjeta !== null
            ? parseFloat(p.montoEfectivoTarjeta)
            : parseFloat(p.monto);
        
        const montoCredito = p.montoCreditoAplicado !== undefined && p.montoCreditoAplicado !== null
            ? parseFloat(p.montoCreditoAplicado)
            : 0;

        totalIngresos += montoFisico;
        totalCreditosAplicados += montoCredito;
        
        if (montoFisico > 0) {
            const nombreMetodo = p.metodoPago?.nombre || "";
            const isEfectivo = !p.metodoPago || !nombreMetodo || nombreMetodo.toLowerCase().includes('efectivo');
            if (isEfectivo) {
                totalIngresosEfectivo += montoFisico;
            } else {
                totalIngresosDigitales += montoFisico;
            }
            
            if (p.metodoPago && p.metodoPago.id && nombreMetodo) {
                if (!metodoMap[p.metodoPagoId]) {
                    metodoMap[p.metodoPagoId] = { metodoPagoId: p.metodoPagoId, nombre: nombreMetodo, ingresos: 0, egresos: 0 };
                }
                metodoMap[p.metodoPagoId].ingresos += montoFisico;
            }
        }
    });

    caja.gastos?.forEach(g => {
        const monto = parseFloat(g.montoTotal || g.monto);
        totalEgresos += monto;
        
        const nombreMetodo = g.metodoPago?.nombre || "";
        const isEfectivo = !g.metodoPago || !nombreMetodo || nombreMetodo.toLowerCase().includes('efectivo');
        if (isEfectivo) {
            totalEgresosEfectivo += monto;
        } else {
            totalEgresosDigitales += monto;
        }
        
        if (g.metodoPago && g.metodoPago.id && nombreMetodo) {
            if (!metodoMap[g.metodoPagoId]) {
                metodoMap[g.metodoPagoId] = { metodoPagoId: g.metodoPagoId, nombre: nombreMetodo, ingresos: 0, egresos: 0 };
            }
            metodoMap[g.metodoPagoId].egresos += monto;
        }
    });

    return {
        totalIngresos,
        totalEgresos,
        totalIngresosEfectivo,
        totalIngresosDigitales,
        totalEgresosEfectivo,
        totalEgresosDigitales,
        totalCreditosAplicados,
        totalesPorMetodo: Object.values(metodoMap)
    };
}
```

---

### B. Algoritmo de Cierre de Caja y Arqueo (`cerrarCaja`)

```javascript
export const cerrarCaja = async (negocioId, usuarioId, cajaId, efectivoReal) => {
    const caja = await models.Caja.findOne({
        where: { id: cajaId, negocioId, usuarioId, estado: "ABIERTA" },
        include: [
            { model: models.Pago, as: "pagos", where: { estado: "COMPLETADO" }, required: false },
            { model: models.Gasto, as: "gastos", required: false }
        ]
    });

    if (!caja) {
        throw new AppError("Caja no encontrada o ya está cerrada.", 404);
    }

    const { totalIngresosEfectivo, totalEgresosEfectivo } = calcularMetricasCaja(caja);

    const efectivoEsperado = parseFloat(caja.montoInicial) + totalIngresosEfectivo - totalEgresosEfectivo;
    const diferencia = parseFloat(efectivoReal) - efectivoEsperado;

    await caja.update({
        estado: "CERRADA",
        fechaCierre: new Date(),
        totalIngresosEfectivo,
        totalEgresosEfectivo,
        efectivoEsperado,
        efectivoReal,
        diferenciaEfectivo: diferencia
    });

    emitToTenant(negocioId, "caja_actualizada", { message: "Caja cerrada" });

    return caja;
};
```

---

## 6. Middlewares y Filtros de Seguridad Involucrados

### `verificarToken` y `verificarSuscripcionActiva`
*   Inyectan las credenciales del usuario y validan el acceso al tenant activo.

# Especificación del Módulo de Gastos y Categorías de Egresos (Gastos)

Este documento detalla la especificación técnica completa del **Módulo de Gastos y Categorías de Egresos (`gastos`)** para la plataforma SaaS Multi-Tenant de lavandería, vinculando cada Caso de Uso (CU) con sus **Actores autorizados**, las **Pantallas y Componentes de Interfaz del Frontend (UI)** donde se originan las acciones y la **Funcionalidad Backend/Frontend** utilizada para resolverlas.

---

## 1. Alcance y Objetivos del Módulo

El módulo de Gastos es un subsistema independiente de **alta cohesión y bajo acoplamiento** encargado de gestionar el registro, clasificación impositiva y auditoría de los egresos monetarios del negocio (comprobantes de proveedores, facturas de insumos, servicios públicos, alquiler y mantenimiento), impactando directamente en la caja abierta del turno activo.

---

## 2. Mapeo Integral: Casos de Uso, Actores, Pantallas Frontend y Funcionalidad de Resolución

A continuación se especifica la matriz detallada de trazabilidad entre la interfaz de usuario, los actores del sistema y los servicios de backend:

### CU-24: Registrar Gasto de Caja
*   **Actores Autorizados:** `Empleado Operativo / Cajero` (`empleado`), `Administrador de Negocio` (`admin`).
*   **Pantalla / Componente Frontend de Origen:**
    *   **Dashboard de Caja y Finanzas:** `/admin/caja`, `/pos/caja` y `/admin/finanzas`.
    *   **Componentes UI:** `registrar-gasto-modal.tsx` (desplegado dentro de `ResponsiveSheet`) y `caja-dashboard.tsx`.
*   **Funcionalidad con la que se Resuelve:**
    *   *Frontend:* Formulario con inputs de `monto`, `categoria`, `descripcion`, `metodoPagoId`, `proveedor` y `nroComprobante`.
    *   *Backend (Endpoint `POST /api/v1/gastos`):* Ejecución de `registrarGasto()` en `gasto.service.js`.
    *   *Requisito de Caja:* Verifica que el usuario tenga una caja en estado `ABIERTA`. De lo contrario rechaza con HTTP 400 Bad Request.
    *   *RBAC por Categoría (Guard Rule):* Si el rol del usuario es `EMPLEADO` e intenta registrar categorías administrativas sensibles (`Nomina`, `Servicios`, `Alquiler`), rechaza con HTTP 403 Forbidden.
    *   *Notificación:* Emite el evento WebSocket `caja_actualizada` para refrescar los totales de egresos en vivo.

---

### CU-25: Consultar Historial y Filtro de Gastos
*   **Actores Autorizados:** `Empleado Operativo / Cajero` (`empleado`), `Administrador de Negocio` (`admin`).
*   **Pantalla / Componente Frontend de Origen:**
    *   **Pantalla de Finanzas y Caja:** `/admin/finanzas` y `/admin/caja`.
    *   **Componentes UI:** `FinanzasKPIs.tsx`, `FinanzasCharts.tsx` y tabla de egresos en `caja-dashboard.tsx`.
*   **Funcionalidad con la que se Resuelve:**
    *   *Frontend:* Selectores de rango de fecha (`fechaInicio`, `fechaFin`) y selector de categoría.
    *   *Backend (Endpoint `GET /api/v1/gastos`):* Ejecución de `obtenerGastos()` en `gasto.service.js`. Si el usuario posee el rol `EMPLEADO`, limita la consulta únicamente a los egresos registrados en la `cajaId` de su turno actual. Si posee el rol `ADMINISTRADOR`, omite el filtro de turno y permite consultar todo el historial global.

---

### CU-26: Gestionar Categorías de Gastos (ABM)
*   **Actores Autorizados:** `Administrador de Negocio` (`admin`) *(Exclusivo)*.
*   **Pantalla / Componente Frontend de Origen:**
    *   **Gestor de Categorías:** `/admin/finanzas`.
    *   **Componentes UI:** `categorias-sheet.tsx` (desplegado dentro de `ResponsiveSheet`).
*   **Funcionalidad con la que se Resuelve:**
    *   *Frontend:* Formulario de creación y edición de categorías de egresos.
    *   *Backend (Endpoints `POST /api/v1/categorias-gastos` y `GET /api/v1/categorias-gastos`):* Exclusivos para rol `admin` (`verificarRol(["admin"])`).

---

### CU-27: Anular Comprobante de Gasto
*   **Actores Autorizados:** `Administrador de Negocio` (`admin`) *(Exclusivo)*.
*   **Pantalla / Componente Frontend de Origen:**
    *   **Ficha de Detalle de Finanzas:** `/admin/finanzas`.
    *   **Componentes UI:** `movimiento-detail-sheet.tsx` (`ResponsiveSheet`).
*   **Funcionalidad con la que se Resuelve:**
    *   *Frontend:* Botón "Anular Gasto" con diálogo de confirmación.
    *   *Backend (Endpoint `PATCH /api/v1/gastos/:id/anular`):* Invalida el comprobante (`estadoGasto = "Anulado"`), reajusta los egresos de caja y notifica vía WebSockets.

---

## 3. Modelos de Base de Datos Vinculados

El módulo interactúa con las entidades de egresos dentro del esquema del tenant (`tenant_{id}`).

### A. Modelo `Gasto`
*   `id` (DataTypes.INTEGER, **PK**, autoIncrement): Identificador único del comprobante.
*   `fechaHora` (DataTypes.DATE, defaultValue: DataTypes.NOW): Fecha y hora de emisión.
*   `descripcion` (DataTypes.STRING, allowNull: true): Detalle o concepto del gasto.
*   `montoTotal` (DataTypes.DOUBLE, allowNull: false): Importe total del egreso.
*   `proveedor` (DataTypes.STRING, allowNull: true): Nombre o razón social del proveedor.
*   `nroComprobante` (DataTypes.STRING, allowNull: true): Número de factura o recibo.
*   `desgloseNeto` (DataTypes.DOUBLE, defaultValue: 0): Subtotal neto gravado.
*   `impuestos` (DataTypes.DOUBLE, defaultValue: 0): Importe de IVA / impuestos.
*   `percepciones` (DataTypes.DOUBLE, defaultValue: 0): Retenciones o percepciones aplicadas.
*   `estadoGasto` (DataTypes.ENUM("Pagado", "Pendiente", "Vencido", "Anulado"), defaultValue: "Pagado"): Estado del comprobante.
*   `negocioId` (DataTypes.INTEGER, allowNull: false): Llave tenant.
*   `categoriaGastoId` (DataTypes.INTEGER, allowNull: false): FK hacia `CategoriaGasto`.
*   `metodoPagoId` (DataTypes.INTEGER, allowNull: true): FK hacia `MetodoPago`.
*   `cajaId` (DataTypes.INTEGER, allowNull: false): FK hacia `Caja`.
*   `registradoPorId` (DataTypes.INTEGER, allowNull: false): FK hacia `Usuario`.

---

### B. Modelo `CategoriaGasto`
*   `id` (DataTypes.INTEGER, **PK**, autoIncrement): Identificador de la categoría.
*   `nombre` (DataTypes.STRING, allowNull: false): Nombre de la categoría (ej: "Insumos", "Nomina", "Servicios", "Alquiler", "Mantenimiento").
*   `descripcion` (DataTypes.STRING, allowNull: true): Alcance.
*   `negocioId` (DataTypes.INTEGER, allowNull: false): Llave tenant.

---

## 4. Contratos de API (JSON Payloads)

### 1. Registrar Nuevo Gasto (`POST /api/v1/gastos`)
*   **Headers:** `Authorization: Bearer <token_jwt>`
*   **Request Body:**
    ```json
    {
      "monto": 4500.00,
      "categoria": "Insumos",
      "descripcion": "Compra de 5 litros de detergente concentrado industrial",
      "metodoPagoId": 1,
      "proveedor": "Distribuidora Química San Martín",
      "nroComprobante": "FACT-B-0001-00045211"
    }
    ```
*   **Responses:**
    *   `201 Created` ➔ Gasto registrado exitosamente.
    *   `400 Bad Request` ➔ No posee una caja abierta en el turno actual.
    *   `403 Forbidden` ➔ Empleado intentó registrar gastos en categorías restringidas (*Nómina*, *Servicios*, *Alquiler*).

---

## 5. Algoritmos de Negocio y Lógica en los Servicios

### Algoritmo de Registro de Gasto con Guard Rules (`registrarGasto`)

```javascript
export const registrarGasto = async (negocioId, usuarioId, rol, data) => {
    const { monto, categoria, descripcion, metodoPagoId } = data;

    // 1. Verificar caja abierta activa
    const cajaAbierta = await models.Caja.findOne({ 
        where: { negocioId, usuarioId, estado: "ABIERTA" } 
    });
    if (!cajaAbierta) {
        throw new AppError("No se puede registrar gasto. Debe abrir una caja primero.", 400);
    }

    // 2. Guard Rule por Rol: Prohibir a empleados registrar categorías administrativas sensibles
    const categoriasRestringidas = ["Nomina", "Servicios", "Alquiler"];
    if (rol.toUpperCase() === "EMPLEADO" && categoriasRestringidas.includes(categoria)) {
        throw new AppError(`No tienes permiso para registrar gastos de categoría: ${categoria}`, 403);
    }

    // 3. Crear el comprobante de egreso
    const nuevoGasto = await models.Gasto.create({
        negocioId,
        registradoPorId: usuarioId,
        cajaId: cajaAbierta.id,
        montoTotal: monto,
        categoria,
        descripcion,
        metodoPagoId: metodoPagoId || null
    });

    // 4. Emitir evento WebSocket en tiempo real
    emitToTenant(negocioId, "caja_actualizada", { message: "Gasto registrado" });

    return nuevoGasto;
};
```

---

## 6. Middlewares y Seguridad

*   `verificarToken` y `verificarSuscripcionActiva`.
*   `verificarRol(["admin"])` para ABM de categorías de gastos y anulación.

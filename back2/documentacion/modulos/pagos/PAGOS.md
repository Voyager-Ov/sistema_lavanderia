# Especificación del Módulo de Cobros, Pagos, Métodos de Pago y Saldos a Favor (Pagos)

Este documento detalla la especificación técnica completa del **Módulo de Cobros, Pagos, Métodos de Pago y Saldos a Favor (`pagos`)** para la plataforma SaaS Multi-Tenant de lavandería en `back2`, enfocándose en la gestión de formas de cobro y las **lógicas cruzadas de intersección contable** entre Pedidos, Cuentas Corrientes de Clientes, Cajas de Turno e Integración Fiscal.

---

## 1. Alcance y Objetivos del Módulo

El módulo de Pagos es el motor de conciliación y liquidación contable de la plataforma. Resuelve las lógicas cruzadas entre los módulos de Pedidos, Clientes, Métodos de Pago y Cajas garantizando **consistencia ACID e inmutabilidad** mediante transacciones manejadas y **bloqueos pesimistas (`LOCK.UPDATE`)**.

---

## 2. Mapeo Integral: Casos de Uso, Actores, Pantallas Frontend y Funcionalidad de Resolución

### CU-30: Gestionar Métodos de Pago (Fijos y Personalizados)
*   **Actores Autorizados:** `Administrador de Negocio` (`admin`) *(Exclusivo)*.
*   **Pantalla / Componente Frontend de Origen:**
    *   **Configuración del Negocio:** `/admin/configuraciones`.
    *   **Componentes UI:** `PaymentsForm.tsx`.
*   **Funcionalidad con la que se Resuelve:**
    *   *Frontend:* Lista de tarjetas de métodos de pago con botones de encendido/apagado (`switch` activo), formulario para agregar nuevos métodos de pago personalizados y botón de eliminación.
    *   *Backend:*
        *   `GET /api/pagos/metodos`: Recupera las formas de cobro del tenant (`obtenerMetodosPago`).
        *   `POST /api/pagos/metodos`: Registra una nueva forma de cobro personalizada con `esFijo = false` (`crearMetodoPago`).
        *   `PATCH /api/pagos/metodos/:id`: Invierte la bandera `activo` (`toggleMetodoPago`).
        *   `DELETE /api/pagos/metodos/:id`: Elimina la forma de cobro. **Regla de Protección Contable:** Si el método tiene `esFijo = true` (*Efectivo*, *Mercado Pago QR*, *Tarjeta Débito*, *Tarjeta Crédito*, *Transferencia*), rechaza la eliminación con HTTP 400 Bad Request (*"No se puede eliminar un método de pago fijo del sistema"*); en su lugar, sólo permite desactivarlo mediante `PATCH`. Si `esFijo = false`, ejecuta `metodo.destroy()`.

---

### CU-31: Cobrar Pedido Individual Mostrador
*   **Actores Autorizados:** `Empleado Operativo / Cajero` (`empleado`), `Administrador de Negocio` (`admin`).
*   **Pantalla / Componente Frontend de Origen:**
    *   **Dashboard de Pedidos:** `/admin/pedidos`, `/admin/clientes/[id]` y `/pos/pedidos`.
    *   **Componente UI Canónico:** `cobrar-pedido-sheet.tsx` (desplegado dentro de `ResponsiveSheet`).
*   **Funcionalidad con la que se Resuelve:**
    *   *Frontend:* Formulario unificado de cobro para 1 único pedido. Permite elegir el Método de Pago (Efectivo, Tarjeta, QR, Personalizado), monto recibido, aplicar Saldo a Favor disponible y/o acreditar el vuelto sobrante.
    *   *Backend (Endpoint `POST /api/pagos`):* Ejecución atómica en `pagos.service.js` dentro de una transacción SQL Sequelize.
    *   *Lógica Cruzada y Trazabilidad Dual:*
        1. Exige obligatoriamente un turno de `Caja` en estado `"Abierta"`. De lo contrario rechaza la solicitud con HTTP 400 Bad Request (`NO_OPEN_CASH_REGISTER`).
        2. Bloquea pesimista `t.LOCK.UPDATE` sobre el `Pedido` objetivo.
        3. Si `aplicarSaldoAFavor = true`, consume atómicamente el crédito disponible en la `CuentaCorriente` del cliente y genera un `MovimientoCuenta` de tipo **Débito**.
        4. Si hubo abonado en dinero físico (`dineroIngresadoFisico > 0`), registra un `MovimientoCaja` vinculado al turno de caja activo. Si el cobro se saldó 100% con crédito o bonificación $0, omitirá la creación de `MovimientoCaja` para prevenir arqueos de dinero físico falsos.
        5. Actualiza `pedido.cobrado = true` y emite eventos WebSockets (`pago_registrado`, `pedido_actualizado`).

---

### CU-32: Retener Vuelto en Efectivo como Saldo a Favor
*   **Actores Autorizados:** `Empleado Operativo / Cajero` (`empleado`), `Administrador de Negocio` (`admin`).
*   **Pantalla / Componente Frontend de Origen:**
    *   **Modal de Cobro:** `/admin/pedidos`, `/admin/clientes/[id]` y `/pos/pedidos`.
    *   **Componente UI:** `cobrar-pedido-sheet.tsx` (`ResponsiveSheet`).
*   **Funcionalidad con la que se Resuelve:**
    *   *Frontend:* Selector *"Acreditar saldo a favor"* (`dejarVueltoAFavor = true`).
    *   *Backend:* Si `montoRecibido > remanenteAPagar`, se calcula el exceso en billetes como `excesoEfectivo = cashRecibidoReal - remanenteTotalEfectivo`. El exceso se acredita atómicamente al saldo de la `CuentaCorriente` del cliente y genera un `MovimientoCuenta` de tipo **Crédito** (`"Vuelto a favor generado por pedido #X"`).

---

### CU-33: Consultar Saldos a Favor de Cliente
*   **Actores Autorizados:** `Empleado Operativo / Cajero` (`empleado`), `Administrador de Negocio` (`admin`).
*   **Pantalla / Componente Frontend de Origen:**
    *   **Ficha del Cliente / Sheet de Cobro:** `/admin/clientes` y `cobrar-pedido-sheet.tsx`.
*   **Funcionalidad con la que se Resuelve:**
    *   *Backend (Endpoint `GET /api/pagos/saldos-a-favor/:clienteId`):* Consulta los créditos disponibles acumulados por el cliente ordenados por fecha FIFO.

---

### CU-34: Anular Pago de Pedido y Restablecer Deuda Exigible
*   **Actores Autorizados:** `Administrador de Negocio` (`admin`) *(Exclusivo)*.
*   **Pantalla / Componente Frontend de Origen:**
    *   **Detalle de Finanzas y Auditoría:** `/admin/finanzas`.
    *   **Componentes UI:** `movimiento-detail-sheet.tsx` (`ResponsiveSheet`).
*   **Funcionalidad con la que se Resuelve:**
    *   *Frontend:* Botón "Anular Pago" con confirmación.
    *   *Backend (Endpoint `PATCH /api/pagos/:id/anular`):* Ejecución de `anularPago()` en `pago-core.service.js`. Invalida el comprobante (`estado = "ANULADO"`), reajusta la caja y restablece el pedido a `cobrado = false`, reabriendo la deuda exigible en la Cuenta Corriente del cliente.

---

## 3. Modelos de Base de Datos Vinculados

### A. Modelo `MetodoPago`
*   `id` (DataTypes.INTEGER, **PK**, autoIncrement): Identificador.
*   `nombre` (DataTypes.STRING, allowNull: false): Nombre ("Efectivo", "Mercado Pago / QR", "Tarjeta de Débito", "Tarjeta de Crédito", "Transferencia Bancaria", etc.).
*   `activo` (DataTypes.BOOLEAN, defaultValue: true): Flag de activación.
*   `icono` (DataTypes.STRING, defaultValue: "Banknote"): Nombre de icono Lucide-React.
*   `esFijo` (DataTypes.BOOLEAN, defaultValue: false): Bandera de método del sistema (no eliminable si `esFijo = true`).
*   `negocioId` (DataTypes.INTEGER, allowNull: false): Llave tenant.

---

### B. Modelo `Pago`
*   `id` (DataTypes.INTEGER, **PK**, autoIncrement): Identificador del pago.
*   `pedidoId` (DataTypes.INTEGER, allowNull: false): FK hacia `Pedido`.
*   `registradoPorId` (DataTypes.INTEGER, allowNull: false): FK hacia `Usuario`.
*   `metodoPagoId` (DataTypes.INTEGER, allowNull: true): FK hacia `MetodoPago`.
*   `cajaId` (DataTypes.INTEGER, allowNull: false): FK hacia `Caja`.
*   `monto` (DataTypes.DECIMAL(10, 2), allowNull: false): Importe total saldado.
*   `montoEfectivoTarjeta` (DataTypes.DECIMAL(10, 2), defaultValue: 0): Fondos físicos/digitales ingresados a caja.
*   `montoCreditoAplicado` (DataTypes.DECIMAL(10, 2), defaultValue: 0): Cobertura con Saldo a Favor.
*   `montoAFavorGenerado` (DataTypes.DECIMAL(10, 2), defaultValue: 0): Sobrante retenido como crédito.
*   `estado` (DataTypes.ENUM("COMPLETADO", "ANULADO"), defaultValue: "COMPLETADO"): Estado contable.

---

## 4. Contratos de API (JSON Payloads)

### 1. Obtener Métodos de Pago (`GET /api/pagos/metodos`)
*   **Headers:** `Authorization: Bearer <token_jwt>`
*   **Responses:**
    *   `200 OK` ➔ Retorna la lista de métodos de pago configurados.
        ```json
        {
          "success": true,
          "message": "Métodos de pago obtenidos",
          "data": [
            { "id": 1, "nombre": "Efectivo", "activo": true, "icono": "Banknote", "esFijo": true },
            { "id": 2, "nombre": "Mercado Pago / QR", "activo": true, "icono": "QrCode", "esFijo": true },
            { "id": 6, "nombre": "Cuenta DNI", "activo": true, "icono": "Wallet", "esFijo": false }
          ]
        }
        ```

---

### 2. Eliminar Método de Pago Personalizado (`DELETE /api/pagos/metodos/:id`)
*   **Headers:** `Authorization: Bearer <token_jwt>`
*   **Roles Permitidos:** `admin` *(Exclusivo)*
*   **Responses:**
    *   `200 OK` ➔ Método eliminado exitosamente.
        ```json
        {
          "success": true,
          "message": "Método de pago eliminado",
          "data": null
        }
        ```
    *   `400 Bad Request` ➔ Si el método es fijo (`esFijo = true`): `"No se puede eliminar un método de pago fijo del sistema."`

---

## 5. Diagnóstico de Errores Comunes de Red

### `net::ERR_CONNECTION_REFUSED`
*   **Causa:** Ocurre cuando el navegador o el cliente HTTP no puede establecer una conexión TCP con el puerto de la API (ej. `http://localhost:5000`). Significa que el servidor Node.js backend está detenido, caído o escuchando en un puerto distinto.
*   **Solución:** Verificar que el proceso backend Express esté ejecutándose activamente mediante `npm run dev` en el puerto especificado (`5000`).

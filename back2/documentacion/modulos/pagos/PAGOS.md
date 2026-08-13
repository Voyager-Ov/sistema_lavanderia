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
    *   **Dashboard de Pedidos:** `/admin/pedidos` y `/pos/pedidos`.
    *   **Componentes UI:** `cobrar-pedido-sheet.tsx` (desplegado dentro de `ResponsiveSheet`) y `pedido-detail-view.tsx`.
*   **Funcionalidad con la que se Resuelve:**
    *   *Frontend:* Formulario de cobro eligiendo Método de Pago (Efectivo, Tarjeta, QR, Personalizado), monto recibido y opción de aplicar Saldo a Favor.
    *   *Backend (Endpoint `POST /api/pagos`):* Ejecución en `pago-core.service.js` dentro de una transacción Sequelize.
    *   *Lógica Cruzada:*
        1. Exige una `Caja` en estado `ABIERTA`.
        2. Aplica bloqueo pesimista `t.LOCK.UPDATE` sobre el `Pedido` y los `CreditoCliente`.
        3. Consume Saldo a Favor disponible en orden **FIFO (`id ASC`)** mediante `consumirCreditosFIFO()`.
        4. El remanente a pagar se abona con el método de pago físico/digital y suma al dinero en caja.
        5. Actualiza `pedido.cobrado = true` y emite eventos WebSockets (`pago_registrado`, `pedido_actualizado`).

---

### CU-32: Retener Vuelto en Efectivo como Saldo a Favor
*   **Actores Autorizados:** `Empleado Operativo / Cajero` (`empleado`), `Administrador de Negocio` (`admin`).
*   **Pantalla / Componente Frontend de Origen:**
    *   **Modal de Cobro:** `/admin/pedidos` y `/pos/pedidos`.
    *   **Componentes UI:** `cobrar-pedido-sheet.tsx` (`ResponsiveSheet`).
*   **Funcionalidad con la que se Resuelve:**
    *   *Frontend:* Checkbox *"Dejar vuelto en efectivo como saldo a favor del cliente"* (`dejarVueltoAFavor = true`).
    *   *Backend:* Si `montoRecibido > montoRestanteAPagar`, el total en billetes ingresa a la caja física del turno (`montoEfectivoTarjeta = efectivoIngresado`) y se invoca `generarCreditoSobrepago()` en `credito.service.js`, emitiendo un `CreditoCliente` de tipo `SOBREPAGO_EFECTIVO` vinculado al cliente.

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

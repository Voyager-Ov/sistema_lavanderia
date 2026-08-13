# Especificación del Módulo de Cobros, Pagos y Saldos a Favor (Pagos)

Este documento detalla la especificación técnica completa del **Módulo de Cobros, Pagos y Saldos a Favor (`pagos`)** para la plataforma SaaS Multi-Tenant de lavandería, enfocándose en las **lógicas cruzadas de intersección contable** entre Pedidos, Cuentas Corrientes de Clientes, Cajas de Turno e Integración Fiscal, vinculando cada Caso de Uso (CU) con sus **Actores autorizados**, las **Pantallas y Componentes de Interfaz del Frontend (UI)** donde se originan las acciones y la **Funcionalidad Backend/Frontend** utilizada para resolverlas.

---

## 1. Alcance y Objetivos del Módulo

El módulo de Pagos es el motor de conciliación y liquidación contable de la plataforma. Resuelve las lógicas cruzadas entre los módulos de Pedidos, Clientes y Cajas garantizando **consistencia ACID e inmutabilidad** mediante transacciones manejadas y **bloqueos pesimistas (`LOCK.UPDATE`)**.

---

## 2. Mapeo Integral: Casos de Uso, Actores, Pantallas Frontend y Funcionalidad de Resolución

A continuación se especifica la matriz detallada de trazabilidad entre la interfaz de usuario, los actores del sistema y los servicios de backend:

### CU-31: Cobrar Pedido Individual Mostrador
*   **Actores Autorizados:** `Empleado Operativo / Cajero` (`empleado`), `Administrador de Negocio` (`admin`).
*   **Pantalla / Componente Frontend de Origen:**
    *   **Dashboard de Pedidos:** `/admin/pedidos` y `/pos/pedidos`.
    *   **Componentes UI:** `cobrar-pedido-sheet.tsx` (desplegado dentro de `ResponsiveSheet`) y `pedido-detail-view.tsx`.
*   **Funcionalidad con la que se Resuelve:**
    *   *Frontend:* Formulario de cobro eligiendo Método de Pago (Efectivo, Tarjeta, QR), monto recibido y opción de aplicar Saldo a Favor.
    *   *Backend (Endpoint `POST /api/v1/pagos`):* Ejecución de `registrarPago()` en `pago-core.service.js` dentro de una transacción Sequelize.
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

### CU-33: Liquidar Deuda Exigible Masiva de Cliente
*   **Actores Autorizados:** `Empleado Operativo / Cajero` (`empleado`), `Administrador de Negocio` (`admin`).
*   **Pantalla / Componente Frontend de Origen:**
    *   **Ficha del Cliente / Cuenta Corriente:** `/admin/clientes` y `/admin/clientes/[id]`.
    *   **Componentes UI:** `CuentaCorrienteTab.tsx` y `ModalCobroDeuda.tsx`.
*   **Funcionalidad con la que se Resuelve:**
    *   *Frontend:* Selección de múltiples pedidos entregados en estado no cobrado y confirmación de monto provisto.
    *   *Backend (Endpoint `POST /api/v1/clientes/:id/cuenta-corriente/cobrar-deuda`):* Ejecución de `cobrarDeudaMasiva()` en `pago-core.service.js`.
    *   *Atomicidad:* En una sola transacción ACID, aplica saldo a favor FIFO, distribuye los fondos entregados pedido a pedido y genera atómicamente **1 `Pago` individual por cada `Pedido` saldado**. Si alguna validación falla, ejecuta rollback total preservando la consistencia.

---

### CU-34: Generar Crédito Automático por Cancelación de Pedido Abonado
*   **Actores Autorizados:** `Empleado Operativo / Cajero` (`empleado`), `Administrador de Negocio` (`admin`).
*   **Pantalla / Componente Frontend de Origen:**
    *   **Sheet de Cancelación:** `/admin/pedidos` y `/pos/pedidos`.
    *   **Componentes UI:** `cancel-order-sheet.tsx` / `cancel-pedido-sheet.tsx` (`ResponsiveSheet`).
*   **Funcionalidad con la que se Resuelve:**
    *   *Frontend:* Confirmación de anulación de orden de trabajo.
    *   *Backend (Endpoint `PATCH /api/v1/pedidos/:id/cancelar`):* `cancelarPedido()` en `pedido.service.js`. Si el pedido ya estaba cobrado, invoca `generarCreditoCancelacion()` en `credito.service.js` reintegrando automáticamente el importe abonado como un `CreditoCliente` (`CANCELACION_PEDIDO`) disponible.

---

### CU-35: Anular Pago de Pedido y Restablecer Deuda Exigible
*   **Actores Autorizados:** `Administrador de Negocio` (`admin`) *(Exclusivo)*.
*   **Pantalla / Componente Frontend de Origen:**
    *   **Detalle de Finanzas y Auditoría:** `/admin/finanzas`.
    *   **Componentes UI:** `movimiento-detail-sheet.tsx` (`ResponsiveSheet`).
*   **Funcionalidad con la que se Resuelve:**
    *   *Frontend:* Botón "Anular Pago" con confirmación.
    *   *Backend (Endpoint `PATCH /api/v1/pagos/:id/anular`):* Ejecución de `anularPago()` en `pago-core.service.js`. Invalida el comprobante (`estado = "ANULADO"`), reajusta la caja y restablece el pedido a `cobrado = false`, reabriendo la deuda exigible en la Cuenta Corriente del cliente.

---

## 3. Modelos de Base de Datos Vinculados

### A. Modelo `Pago`
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

### 1. Registrar Pago (`POST /api/v1/pagos`)
```json
{
  "pedidoId": 105,
  "metodoPagoId": 1,
  "monto": 3000.00,
  "montoRecibido": 5000.00,
  "aplicarSaldoAFavor": true,
  "dejarVueltoAFavor": true
}
```
*   **Respuesta (HTTP 200 OK):**
```json
{
  "status": "success",
  "message": "Pago registrado exitosamente",
  "data": {
    "id": 88,
    "pedidoId": 105,
    "monto": 3000.00,
    "montoEfectivoTarjeta": 2000.00,
    "montoCreditoAplicado": 1000.00,
    "montoAFavorGenerado": 3000.00,
    "estado": "COMPLETADO"
  }
}
```

---

## 5. Algoritmos de Negocio y Lógica en los Servicios

### Algoritmo de Liquidación Atómica (`registrarPago`)

```javascript
export const registrarPago = async (negocioId, usuarioId, data) => {
    let { 
        pedidoId, metodoPagoId, monto, montoRecibido, 
        aplicarSaldoAFavor = false, montoSaldoAFavor = null, 
        dejarVueltoAFavor = false
    } = data;

    const t = await sequelize.transaction();
    try {
        // 1. Validar caja abierta
        const cajaAbierta = await models.Caja.findOne({ 
            where: { negocioId, usuarioId, estado: "ABIERTA" }, transaction: t 
        });
        if (!cajaAbierta) throw new AppError("No se puede cobrar pedidos sin abrir una caja.", 400);

        // 2. Bloqueo Pesimista sobre el Pedido
        const pedido = await models.Pedido.findOne({ 
            where: { id: pedidoId, negocioId }, lock: t.LOCK.UPDATE, transaction: t 
        });
        if (!pedido) throw new AppError("Pedido no encontrado.", 404);

        const totalPedido = parseFloat(pedido.total);
        let montoCreditoAplicado = 0;

        // 3. Imputación FIFO de Saldo a Favor
        if (aplicarSaldoAFavor) {
            const maxCredito = montoSaldoAFavor ? Math.min(parseFloat(montoSaldoAFavor), totalPedido) : totalPedido;
            if (maxCredito > 0) {
                const creditosDisponibles = await models.CreditoCliente.findAll({
                    where: {
                        negocioId,
                        clienteId: pedido.clienteId,
                        estado: { [Op.in]: ["DISPONIBLE", "CONSUMIDO_PARCIAL"] },
                        montoDisponible: { [Op.gt]: 0 }
                    },
                    order: [["id", "ASC"]],
                    lock: t.LOCK.UPDATE,
                    transaction: t
                });

                let totalCreditoDisponible = creditosDisponibles.reduce((acc, c) => acc + parseFloat(c.montoDisponible), 0);
                montoCreditoAplicado = Number(Math.min(totalCreditoDisponible, maxCredito).toFixed(2));
            }
        }

        let montoRestanteAPagar = Number((totalPedido - montoCreditoAplicado).toFixed(2));
        const efectivoIngresado = parseFloat(montoRecibido || 0);
        let vueltoGenerado = 0;

        if (montoRestanteAPagar > 0) {
            vueltoGenerado = Number((efectivoIngresado - montoRestanteAPagar).toFixed(2));
        }

        // 4. Registrar Pago
        const nuevoPago = await models.Pago.create({
            pedidoId,
            registradoPorId: usuarioId,
            metodoPagoId: montoRestanteAPagar > 0 ? metodoPagoId : null,
            cajaId: cajaAbierta.id,
            monto: totalPedido,
            montoEfectivoTarjeta: dejarVueltoAFavor ? efectivoIngresado : montoRestanteAPagar,
            montoCreditoAplicado: montoCreditoAplicado,
            montoAFavorGenerado: (dejarVueltoAFavor && vueltoGenerado > 0) ? vueltoGenerado : 0,
            estado: "COMPLETADO"
        }, { transaction: t });

        // 5. Consumo FIFO
        if (montoCreditoAplicado > 0) {
            await consumirCreditosFIFO(negocioId, pedido.clienteId, montoCreditoAplicado, nuevoPago.id, pedido.id, t);
        }

        // 6. Nuevo saldo a favor si retuvo vuelto
        if (dejarVueltoAFavor && vueltoGenerado > 0) {
            await generarCreditoSobrepago(negocioId, pedido.clienteId, pedido.id, vueltoGenerado, usuarioId, t);
        }

        await pedido.update({ cobrado: true }, { transaction: t });
        await t.commit();

        emitToTenant(negocioId, "pago_registrado", { pagoId: nuevoPago.id, pedidoId: pedido.id });
        return nuevoPago;
    } catch (error) {
        if (t.finished !== 'commit') await t.rollback();
        throw error;
    }
};
```

---

## 6. Middlewares y Seguridad

*   `verificarToken` y `verificarRol(["admin", "empleado"])`.

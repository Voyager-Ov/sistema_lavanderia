# Especificación de Casos de Uso (CU): Clientes, Cuenta Corriente y Cobros

Este documento detalla la especificación formal de los **Casos de Uso (CU)** principales del módulo de clientes y cobros en el sistema `back2` y `front`, especificando sus actores, precondiciones, flujo principal, flujos alternativos y resolución técnica.

---

## CU-CL-01: Consulta de Estado de Cuenta y Deuda Total

* **Actores**: Operador de Mostrador, Administrador.
* **Precondición**: El cliente existe en la base de datos del negocio.
* **Disparador**: El usuario busca o selecciona un cliente en la tabla o accede a su ficha técnica (`/admin/clientes/:id`).
* **Flujo Principal**:
  1. El sistema consulta en tiempo real el registro del cliente en PostgreSQL (`GET /api/clientes/:id`).
  2. El backend calcula `saldoDeuda` sumando el importe total de todos sus pedidos impagos activos (`cobrado === false` && `estado !== 'CANCELADO'`).
  3. El frontend muestra el encabezado unificado de 1 sola fila con el badge de estado ("Al día ($0)" o "Deuda Acumulada $X.XXX").
  4. Se despliega la **Tabla Comercial de Pedidos** con los detalles, prendas, fechas y estados dinámicos.
* **Resolución Técnica**: Todos los pedidos entregados impagos anteriores se incluyen sin truncamientos gracias a la eliminación del límite fijo en la consulta del modelo `Pedido`.

---

## CU-CL-02: Cobro Imputado de Pedidos Impagos por Selección

* **Actores**: Operador de Mostrador, Cajero.
* **Precondición**: El cliente posee uno o más pedidos en estado `cobrado === false`.
* **Disparador**: El usuario marca los checkboxes de los pedidos impagos en la tabla o presiona el botón "Cobrar Deuda".
* **Flujo Principal**:
  1. Al seleccionar los pedidos, aparece la **Isla Flotante Estandarizada (`DataTableBulkActions`)** indicando la cantidad de pedidos y el total acumulado.
  2. El usuario presiona **"Cobrar Seleccionados"**.
  3. El frontend realiza una verificación en tiempo real contra el servidor (`GET /api/clientes/:id/pedidos-impagos`) para obtener las cifras actualizadas desde PostgreSQL.
  4. Se despliega el **SideSheet Responsivo de Cobro (`FormSheet`)**.
  5. El usuario selecciona el **Método de Pago** (Efectivo, Transferencia, etc.), ingresa el dinero recibido y presiona "Registrar Cobro".
  6. El backend procesa `POST /api/clientes/:id/cobrar-pedidos`, iterando cada pedido:
     - Marca `cobrado = true` en el pedido.
     - Crea la entrada de cobro individual.
     - Registra el movimiento de ingreso en la **Caja Abierta** del día ("Cobro Pedido #N").
  7. El frontend actualiza la tabla y muestra la confirmación mediante un cartel `toast.success`.
* **Flujo Alternativo (Intentar cobrar pedido ya saldado)**:
  - Si un pedido seleccionado fue cobrado por otro usuario simultáneamente, la API retorna error HTTP 400 (`ORDER_ALREADY_PAID`) y el frontend notifica `toast.error("El pedido ya se encuentra cobrado")`.
* **Resolución Técnica**: Garantiza trazabilidad 1 a 1 entre pedido, cobro y movimiento de caja, protegiendo las auditorías de caja diaria.

---

## CU-CL-03: Cancelación de Pedidos Cobrados (Tratamiento del Dinero)

* **Actores**: Administrador, Encargado de Lavandería.
* **Precondición**: El pedido pertenece al negocio y su estado actual no es `CANCELADO` ni `ENTREGADO`.
* **Disparador**: El usuario solicita la cancelación de un pedido que ya posee `cobrado === true`.
* **Flujo Principal**:
  1. El sistema detecta que el pedido ya registra cobro y solicita seleccionar la **Acción de Dinero (`accionDinero`)**:
     - **Opción A: `SALDO_A_FAVOR`** (Acreditar a Cuenta Corriente).
     - **Opción B: `DEVOLVER`** (Devolución física en efectivo).
  2. **Si elije `SALDO_A_FAVOR`**:
     - El pedido pasa al estado `CANCELADO`.
     - El monto cobrado se suma al saldo de la `CuentaCorriente` del cliente.
     - Se registra un `MovimientoCuenta` de tipo `CREDITO`.
  3. **Si elije `DEVOLVER`**:
     - El pedido pasa al estado `CANCELADO`.
     - Se busca la **Caja Abierta** de la jornada y se registra un `MovimientoCaja` de egreso (`-monto`, `tipoMovimiento: "Egreso por Devolución"`).
     - Se genera un contra-registro contable negativo.
* **Resolución Técnica**: El arqueo de caja del día refleja exactamente la salida del dinero físico o la acreditación del saldo a favor.

---

## CU-CL-04: Carga de Pedidos con Fecha de Recepción Personalizada (`fechaHoraPedido`)

* **Actores**: Operador de Mostrador.
* **Precondición**: Apertura del formulario de nuevo pedido (`/admin/pedidos/nuevo`).
* **Disparador**: Carga de un pedido ingresado en una fecha u hora distinta a la del sistema (ej. pedidos anteriores o turnos futuros).
* **Flujo Principal**:
  1. El operador completa las prendas y selecciona la fecha y hora real de recepción mediante el selector `fechaHoraPedido`.
  2. Al guardar el pedido, el backend persiste `fechaHoraPedido` en PostgreSQL y genera `fechaHoraCreacion = NOW()`.
  3. Todas las tablas, listados y comprobantes muestran la fecha de recepción real del pedido (`fechaHoraPedido`).
* **Resolución Técnica**: Evita guiones vacíos (`-`) en las columnas de fecha y mantiene auditoría sobre cuándo fue cargado el pedido en la plataforma.

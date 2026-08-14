# Especificación Oficial: Reglas y Cálculo de Deuda de Clientes

Este documento define la **norma contable unificada** para el cálculo y clasificación de la Deuda de Clientes en el sistema (`back2` y `front`).

---

## 1. Definición Unificada de Deuda de Cliente

La deuda de un cliente surge exclusivamente de sus **Pedidos impagos activos**. No existen saldos globales ficticios ni asientos manuales desvinculados de un comprobante de servicio.

$$\text{Saldo Deuda Total Cliente} = \sum_{p \in \text{Pedidos Impagos Activos}} p.\text{total}$$

Donde un pedido $p$ es **Impago Activo** si y solo si:
1. `p.cobrado === false` (El pedido no ha sido saldado).
2. `p.estado !== 'CANCELADO'` (El pedido está activo en taller, mostrador o entregado).

---

## 2. Las 3 Formas de Visualizar la Deuda (Clasificación por Estado)

Para responder a las necesidades operativas de la lavandería, el sistema contempla **3 perspectivas contables del saldo**:

### A. Deuda Total Acumulada (`saldoDeuda`)
* **Qué representa**: La suma del importe total de **TODOS** los pedidos impagos activos del cliente (tanto los que están en proceso en taller como los entregados sin abonar).
* **Dónde se utiliza**:
  * En la tabla general de clientes (`/admin/clientes`) en la columna **Saldo / Cuenta Corriente**.
  * En la tarjeta KPI **Deuda Total Acumulada** del encabezado de clientes.
  * En la API: `Cliente.saldoDeuda`.
* **Módulo responsable**: `clientes.service.js` (`listarClientes` y `obtenerClientePorId`).

### B. Deuda Exigible (`deudaExigible`)
* **Qué representa**: La suma de los pedidos que ya fueron **ENTREGADOS** al cliente pero **NO FUERON COBRADOS** (`p.cobrado === false` && `p.estado === 'ENTREGADO'`).
* **Regla de Negocio**: El cliente se llevó la prenda/servicio del local sin pagar. Constituye la deuda morosa inmediata por cobrar.
* **Módulo responsable**: `pagos.service.js` (`obtenerEstadoCuentaCliente`).

### C. Deuda en Taller / En Proceso (`deudaNoExigible`)
* **Qué representa**: La suma de los pedidos impagos que aún están siendo lavados, secados o doblados (`estado` en `PENDIENTE`, `EN_PROCESO`, `LISTO_PARA_RETIRAR`).
* **Regla de Negocio**: El cliente abonará al retirar en mostrador o mediante cobro a domicilio.
* **Módulo responsable**: `pagos.service.js` (`obtenerEstadoCuentaCliente`).

---

## 3. Matriz de Módulos del Sistema y Responsabilidades

| Módulo Backend / Frontend | Función / Endpoint | Tipo de Deuda Calculada | Regla Aplicada |
|---|---|---|---|
| `back2/src/modules/clientes/services/clientes.service.js` | `listarClientes` | `saldoDeuda` | `cobrado: false` y `estado != CANCELADO` (sin límite de pedidos). |
| `back2/src/modules/clientes/services/clientes.service.js` | `obtenerClientePorId` | `saldoDeuda` | Trae **todos** los pedidos sin límite artificial de 20 para no omitir entregados. |
| `back2/src/modules/clientes/services/clientes.service.js` | `obtenerPedidosImpagosCliente` | Listado Impagos | `GET /api/clientes/:id/pedidos-impagos` para el cobro imputado. |
| `back2/src/modules/pagos/services/pagos.service.js` | `obtenerEstadoCuentaCliente` | `deudaExigible` + `deudaNoExigible` | Desglosa la deuda entregada de la deuda en proceso de taller. |
| `front/src/app/admin/clientes/[id]/page.tsx` | Ficha de Cliente | `saldoDeuda` (Real-Time) | Prioriza `cliente.saldoDeuda` del backend y permite cobro imputado. |

---

## 4. Garantía de Integridad (Cero Vulnerabilidades)

1. **No Truncamiento de Pedidos**: Se eliminó el parámetro `limit: 20` al consultar los pedidos de un cliente en `obtenerClientePorId`. Todo pedido histórico impago es evaluado en el cálculo de deuda.
2. **Fetch en Tiempo Real al Abrir el Cobro**: Al pulsar "Cobrar Deuda" o "Cobrar Seleccionados", el frontend ejecuta `getPedidosImpagosCliente(id)` directamente contra PostgreSQL para evitar saldos desactualizados o vulnerables en caché local.

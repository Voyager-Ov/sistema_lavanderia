# Especificación Oficial: Reglas y Cálculo de Deuda de Clientes

Este documento define la **norma contable unificada** para el cálculo y clasificación de la Deuda de Clientes en el sistema (`back2` y `front`).

---

## 1. Definición Única de Deuda de Cliente

La deuda de un cliente surge **exclusivamente de los Pedidos ENTREGADOS que aún NO han sido cobrados**.

$$\text{Saldo Deuda Cliente} = \sum_{p \in \text{Pedidos Entregados Impagos}} p.\text{total}$$

Donde un pedido $p$ genera **Deuda** si y solo si cumple:
1. `p.estado === 'ENTREGADO'` (o `COMPLETADO` al entregar en mostrador o a domicilio).
2. `p.cobrado === false` (El cliente retiró/recibió la prenda sin abonar).

---

## 2. Clasificación Operativa de Pedidos

| Estado del Pedido | `cobrado` | ¿Constituye Deuda? | Concepto Contable |
|---|---|---|---|
| `ENTREGADO` / `COMPLETADO` | `false` | 🔴 **SÍ (Deuda Única)** | Deuda exigible por cobrar al cliente. |
| `PENDIENTE` / `EN_PROCESO` / `LISTO` | `false` | 🟡 **NO** | Activos / Trabajos en proceso en taller. Se cobran al entregar. |
| Cualquiera | `true` | 🟢 **NO** | Pedido saldado. |
| `CANCELADO` | `false` / `true` | ⚪ **NO** | Anulado. Si tenía cobro, genera crédito a favor o devolución. |

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

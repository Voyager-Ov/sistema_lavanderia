# Reglas de Negocio: Flujo de Pedidos (Máquina de Estados)

Todo pedido dentro de una lavandería pasa por un ciclo de vida muy específico. 

## 1. Estados del Pedido

1. **PENDIENTE**: 
   - El cliente deja la ropa en el local pero aún no ha sido lavada.
   - Estado inicial por defecto al crear el pedido.
2. **EN_PROCESO**:
   - La ropa está siendo lavada, secada o planchada.
   - Permite al empleado saber qué pedidos están "en la máquina".
3. **LISTO_PARA_RETIRAR**:
   - El servicio ha concluido.
   - La ropa está limpia, empaquetada y esperando al cliente.
   - (Opcional: aquí se podría disparar una notificación al cliente).
4. **ENTREGADO**:
   - El cliente retiró su ropa. 
   - El ciclo del servicio termina.
5. **CANCELADO**:
   - Por algún motivo el pedido no se realizó (ej. el cliente se arrepintió antes de lavar).

## 2. Reglas de Transición (Máquina de Estados)
Las transiciones válidas sugeridas son:
- `PENDIENTE` -> `EN_PROCESO` o `CANCELADO`
- `EN_PROCESO` -> `LISTO_PARA_RETIRAR` o `CANCELADO`
- `LISTO_PARA_RETIRAR` -> `ENTREGADO`

*Nota: Al momento de hacer la transición, se guarda un registro en `HistorialPedido` con el usuario que realizó el cambio, el estado anterior y el nuevo, brindando trazabilidad total.*

## 3. Precios Históricos (Snapshot)
- Al crear el `Pedido` y sus `PedidoItem`, se copia el `precioActual` del `Producto` al campo `precioUnitario` del Item.
- **Razón**: Si el administrador cambia el precio de "Lavado Acolchado" mañana, los pedidos generados hoy deben mantener el precio histórico cobrado al cliente.

## 4. Pagos y Cobros
- Un pedido tiene un monto `total` (suma de `subtotal` de los items).
- Se permite registrar el Pago (`Efectivo`, `Tarjeta`, `Transferencia`).
- Una vez pagado el total, la bandera `cobrado` del Pedido pasa a `true`.
- El cobro puede ocurrir en cualquier estado (ej. un cliente puede pagar por adelantado en estado `PENDIENTE` o al final en `ENTREGADO`).

## 5. Cancelaciones Parciales (Items)
- Es común que un cliente traiga varios productos en un solo pedido (ej. 2 pares de zapatillas), pero la lavandería no pueda procesar uno de ellos.
- En lugar de cancelar todo el Pedido, el sistema permite la **Cancelación Parcial** a nivel de ítem (`PedidoItem`).
- Un `PedidoItem` puede cambiar su estado interno a `CANCELADO` (y opcionalmente registrar un `motivoCancelacion`).
- Al cancelar un ítem individual, su `subtotal` se resta automáticamente del `total` del `Pedido` principal, para asegurar que la caja y lo que se le cobra al cliente coincida exactamente con la realidad del servicio brindado.

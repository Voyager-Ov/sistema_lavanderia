# Módulo de Clientes y Cuenta Corriente (Cobro Imputado)

Este documento especifica la arquitectura, modelos y endpoints para la gestión de clientes y cobros imputados por pedido en `back2`.

---

## 1. Visión General

El módulo de clientes administra la base de usuarios finales y la **Cuenta Corriente de Deudas**. En lugar de realizar "cobros sueltos" no vinculados a pedidos, el sistema calcula la deuda de cada cliente como la suma de sus **pedidos impagos** y permite registrar el cobro asociando individualmente cada pago a su respectivo `Pedido`.

---

## 2. Definición del Estado de Cliente (`activo`)

- **Baja Lógica / Archivado**: La columna `activo` (`BOOLEAN`, por defecto `true`) permite desactivar un cliente sin borrar sus pedidos ni romper la contabilidad.
- **Formato en la API**: La propiedad `activo` devuelve siempre `true` para los clientes activos, previniendo badges erróneos de inactividad.

---

## 3. Endpoints de la API (`/api/clientes`)

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/clientes` | Listado paginado con filtro de búsqueda y cálculo de `saldoDeuda` y `pedidosImpagosCount`. |
| `GET` | `/api/clientes/:id` | Detalle completo del cliente con sus pedidos recientes y `saldoDeuda`. |
| `GET` | `/api/clientes/:id/pedidos-impagos` | Obtiene la lista de pedidos pendientes de cobro del cliente con el subtotal por pedido y el total de deuda. |
| `POST` | `/api/clientes/:id/cobrar-pedidos` | Registra el pago imputado de uno o varios pedidos seleccionados (`pedidosIds: [1, 2]`), actualizando `cobrado: true` en cada pedido e impactando en la Caja Abierta. |
| `POST` | `/api/clientes` | Creación de cliente nuevo. |
| `PUT` | `/api/clientes/:id` | Actualización de datos del cliente. |
| `DELETE` | `/api/clientes/:id` | Elimina / Desactiva el cliente. |

---

## 4. Estructura de Petición para Cobro de Pedidos Impagos

`POST /api/clientes/:id/cobrar-pedidos`

```json
{
  "pedidosIds": [102, 105],
  "metodoPagoId": 1,
  "observaciones": "Cobro en mostrador de 2 pedidos pendientes"
}
```

### Respuesta del Servidor:

```json
{
  "success": true,
  "message": "Cobro de pedidos del cliente registrado exitosamente",
  "data": {
    "clienteId": 14,
    "pedidosCobradosCount": 2,
    "totalMontoCobrado": 30000,
    "saldoRestanteDeuda": 0,
    "cobros": [
      {
        "id": 45,
        "pedidoId": 102,
        "monto": 15000,
        "estado": "COMPLETADO"
      },
      {
        "id": 46,
        "pedidoId": 105,
        "monto": 15000,
        "estado": "COMPLETADO"
      }
    ]
  }
}
```

# Módulo: Seguimiento de Pedidos (Tracking Público)

## Descripción General
Este módulo permite a los clientes finales (clientes de la lavandería) consultar el estado de su orden ingresando el código de seguimiento único que se les otorgó al momento de crear el pedido.

## Roles Permitidos
- **PÚBLICO**: No requiere token JWT. No requiere verificación de suscripción activa de un negocio en particular porque es un endpoint de acceso libre diseñado para ser consultado desde un portal externo por usuarios anónimos.

## Endpoints (Requerimientos Funcionales)

### 1. Consultar Tracking de Pedido
- **Ruta y Método**: `GET /api/tracking/:codigo`
- **Acción**: Busca el pedido en todo el sistema utilizando su `codigoSeguimiento` único (generado al momento de su creación).
- **Reglas de Negocio (Privacidad de Datos)**:
  - **Filtrado Estricto**: Para proteger la información del negocio y de los empleados, el backend formatea la respuesta y **NO** envía IDs de base de datos, ni datos del cliente, ni correos, ni historial de usuarios.
  - **Datos Retornados**: Únicamente expone:
    - Estado actual del pedido.
    - Fecha de creación.
    - Si fue cobrado o no (`totalCobrado`).
    - El `totalMonto`.
    - El nombre público del `negocio`.
    - El detalle de los `items` (solo el nombre del producto, cantidad, subtotal y el estado de ese ítem si aplica).
- **Cuerpo (Response) Esperado**:
  ```json
  {
    "codigoSeguimiento": "LV-1234ABCD",
    "estadoActual": "EN_PROCESO",
    "fechaCreacion": "2026-07-06T15:30:00.000Z",
    "totalCobrado": false,
    "totalMonto": 3500.00,
    "negocio": "Lavandería Burbujas",
    "items": [
      {
        "producto": "Lavado de Acolchado",
        "cantidad": 1,
        "subtotal": 3500.00
      }
    ]
  }
  ```

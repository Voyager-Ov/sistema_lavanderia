# Módulo: Clientes y Cuenta Corriente

## Descripción General
Este módulo administra el padrón de clientes de cada negocio (registro, edición, baja lógica, consulta y búsqueda) y la posición financiera en vivo de su Cuenta Corriente basada en Libro Mayor (deudas por pedidos entregados pendientes de cobro y créditos a favor por sobrepagos, cancelaciones o ajustes).

## Roles Permitidos
- **Consultas (`GET`)**: Todos los roles tienen acceso (`admin`, `empleado`).
- **Modificaciones de Clientes (`POST`, `PUT`, `PATCH`)**: Restringido a **Admin** y **Empleado**.
- **Cobro de Deuda (`POST .../cobrar-deuda`)**: Restringido a **Admin** y **Empleado**. Requiere turno de caja abierto.
- **Ajustes Manuales de Crédito (`POST .../ajuste-credito`)**: Restringido exclusivamente a **Admin**.
- Todas las rutas requieren token y suscripción activa.

---

## Endpoints de Clientes

### 1. Listar Clientes
- **Ruta y Método**: `GET /api/clientes`
- **Acción**: Retorna el listado paginado de clientes **activos** (`activo: true`) del negocio.
- **Validaciones**: Soporta los query parameters de paginación estándar (`limit`, `page`).
- **Filtros Soportados (Query Params)**:
  - `search`: Busca coincidencias parciales (case insensitive) en `nombre`, `telefono` o `email`.

### 2. Obtener Cliente por ID
- **Ruta y Método**: `GET /api/clientes/:id`
- **Acción**: Devuelve los detalles de un cliente específico del negocio. Incluye su historial de **pedidos** asociados.
- **Validaciones**: El cliente debe existir y pertenecer al negocio del usuario que consulta.

### 3. Crear Cliente
- **Ruta y Método**: `POST /api/clientes`
- **Acción**: Crea un nuevo cliente asociado al negocio. Por defecto, se crea con el estado `activo: true`.
- **Validaciones**:
  - `nombre`: Obligatorio, string.
  - `telefono`: Obligatorio, string.
  - `email`: Opcional. Si se envía, debe tener un formato de email válido.
- **Reglas de Negocio**:
  - **Unicidad de Teléfono**: No pueden existir dos clientes con el mismo número de teléfono en el mismo negocio.
- **Cuerpo (Payload) Esperado**:
  ```json
  {
    "nombre": "Juan Pérez",
    "telefono": "123456789",
    "email": "juan@example.com"
  }
  ```

### 4. Actualizar Cliente
- **Ruta y Método**: `PUT /api/clientes/:id`
- **Acción**: Modifica los datos de un cliente existente.
- **Validaciones**: 
  - `nombre`, `telefono`, `email` son opcionales para la validación, pero deben cumplir el formato correspondiente si se envían.
- **Reglas de Negocio**:
  - Si se modifica el `telefono`, se verifica nuevamente la unicidad: no debe existir otro cliente distinto con ese mismo teléfono en el negocio.

### 5. Dar de Baja Cliente (Soft Delete)
- **Ruta y Método**: `PATCH /api/clientes/:id/estado`
- **Acción**: Realiza un borrado lógico del cliente (cambia `activo` a `false`) y registra el motivo.
- **Validaciones**:
  - `motivoBaja`: Obligatorio, string.
- **Reglas de Negocio**:
  - **Restricción de Baja**: Un cliente **NO** puede ser dado de baja si tiene pedidos activos (es decir, pedidos que no estén en estado `ENTREGADO` o `CANCELADO`). El sistema lanzará un error indicando cuántos pedidos en curso tiene.

---

## Submódulo de Cuenta Corriente (Libro Mayor)

### 6. Obtener Posición Financiera (Estado de Cuenta)
- **Ruta y Método**: `GET /api/clientes/:id/cuenta-corriente/estado-cuenta`
- **Acción**: Calcula en tiempo real la posición consolidada del cliente:
  - `deudaExigible`: Sumatoria de pedidos `ENTREGADOS` con `cobrado: false`.
  - `deudaNoExigible`: Sumatoria de pedidos en proceso (`PENDIENTE`, `EN_PROCESO`, `LISTO_PARA_RETIRAR`) no cobrados.
  - `totalCreditoDisponible`: Sumatoria de saldos a favor con `montoDisponible > 0`.
  - `saldoNeto`: Diferencia entre créditos a favor y deuda exigible.
- **Respuesta Esperada**:
  ```json
  {
    "status": "success",
    "data": {
      "cliente": { "id": 1, "nombre": "Juan Pérez" },
      "resumen": {
        "deudaExigible": 15000.00,
        "deudaNoExigible": 5000.00,
        "totalCreditoDisponible": 3000.00,
        "saldoNeto": -12000.00,
        "pedidosDeudaCount": 2,
        "pedidosEnCursoCount": 1,
        "creditosCount": 1
      },
      "pedidosDeuda": [ ... ],
      "pedidosEnCurso": [ ... ],
      "creditosDisponibles": [ ... ]
    }
  }
  ```

### 7. Extracto Cronológico de Movimientos
- **Ruta y Método**: `GET /api/clientes/:id/cuenta-corriente/movimientos`
- **Query Params**: `page`, `limit`, `desde` (ISO), `hasta` (ISO).
- **Acción**: Devuelve el libro mayor cronológico unificado (cargos por pedidos, abonos por cobros recibidos y créditos generados).

### 8. Listar Créditos a Favor Disponibles
- **Ruta y Método**: `GET /api/clientes/:id/cuenta-corriente/creditos`
- **Acción**: Lista los registros de crédito con saldo remanente (`montoDisponible > 0`) aptos para aplicar en cobros.

### 9. Liquidar / Cobrar Deuda de Pedidos
- **Ruta y Método**: `POST /api/clientes/:id/cuenta-corriente/cobrar-deuda`
- **Acción**: Realiza la liquidación individual o masiva de pedidos adeudados. En una transacción ACID:
  1. Aplica créditos disponibles si se solicitó (`aplicarSaldoAFavor: true`) con estrategia FIFO.
  2. Crea **1 registro de Pago individual por cada pedido** liquidado.
  3. Actualiza el estado de cada pedido a `cobrado: true`.
  4. Genera saldo a favor adicional si hubo excedente en efectivo y se indicó `dejarVueltoAFavor: true`.
- **Cuerpo (Payload) Esperado**:
  ```json
  {
    "pedidosIds": [101, 102],
    "metodoPagoId": 1,
    "montoRecibido": 12000.00,
    "aplicarSaldoAFavor": true,
    "dejarVueltoAFavor": false
  }
  ```

### 10. Ajuste Manual de Crédito a Favor
- **Ruta y Método**: `POST /api/clientes/:id/cuenta-corriente/ajuste-credito`
- **Rol requerido**: **Admin**.
- **Acción**: Emite un crédito a favor manual no asociado a pedido para compensaciones comerciales.
- **Cuerpo (Payload) Esperado**:
  ```json
  {
    "monto": 5000.00,
    "motivo": "Compensación por prenda con retraso excepcional"
  }
  ```

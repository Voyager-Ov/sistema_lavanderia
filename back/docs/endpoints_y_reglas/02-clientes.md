# Módulo: Clientes

## Descripción General
Este módulo administra la base de datos de clientes de cada negocio (registro, edición, baja lógica, consulta y búsqueda).

## Roles Permitidos
- **Consultas (`GET`)**: Todos los roles tienen acceso.
- **Modificaciones (`POST`, `PUT`, `PATCH`)**: Restringido a **Admin** y **Empleado**.
- Todas las rutas requieren token y suscripción activa.

## Endpoints (Requerimientos Funcionales)

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
- **Cuerpo (Payload) Esperado**:
  ```json
  {
    "nombre": "Juan Carlos Pérez",
    "telefono": "987654321"
  }
  ```

### 5. Dar de Baja Cliente (Soft Delete)
- **Ruta y Método**: `PATCH /api/clientes/:id/estado`
- **Acción**: Realiza un borrado lógico del cliente (cambia `activo` a `false`) y registra el motivo.
- **Validaciones**:
  - `motivoBaja`: Obligatorio, string.
- **Reglas de Negocio**:
  - **Restricción de Baja**: Un cliente **NO** puede ser dado de baja si tiene pedidos activos (es decir, pedidos que no estén en estado `ENTREGADO` o `CANCELADO`). El sistema lanzará un error indicando cuántos pedidos en curso tiene.
- **Cuerpo (Payload) Esperado**:
  ```json
  {
    "motivoBaja": "El cliente solicitó eliminar su cuenta"
  }
  ```

### 6. Registrar Pago en Cuenta Corriente
- **Ruta y Método**: `POST /api/clientes/:id/cuenta-corriente/pagos`
- **Acción**: Permite que un cliente pague parte o la totalidad de su saldo pendiente en cuenta corriente (por pedidos fiados). Registra el movimiento y ajusta el saldo total.

### 7. Recalcular Saldo de Cuenta Corriente
- **Ruta y Método**: `POST /api/clientes/:id/cuenta-corriente/recalcular`
- **Acción**: Fuerza un recálculo del saldo de cuenta corriente del cliente basado en el historial de movimientos (`MovimientoCuentaCorriente`) en caso de desajustes.

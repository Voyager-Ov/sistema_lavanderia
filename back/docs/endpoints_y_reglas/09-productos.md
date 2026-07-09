# Módulo: Productos

## Descripción General
Este módulo gestiona el catálogo de productos y servicios ofrecidos por la lavandería (ej. Lavado por Kilo, Planchado de Camisa, etc.), definiendo sus precios y disponibilidad.

## Roles Permitidos
- **Consultas (`GET`)**: Todos los roles.
- **Creación, Edición Total y Eliminación (`POST`, `PUT`, `DELETE`)**: Restringido a **ADMIN**.
- **Edición de Disponibilidad (`PATCH`)**: Permitido para **ADMIN** y **EMPLEADO**.
- Requiere autenticación y suscripción activa.

## Endpoints (Requerimientos Funcionales)

### 1. Listar Productos
- **Ruta y Método**: `GET /api/productos`
- **Acción**: Retorna el catálogo de productos `activos` (`activo: true`) del negocio de forma paginada.
- **Reglas de Negocio (RBAC)**:
  - Si el usuario que consulta tiene rol `EMPLEADO`, el sistema elimina la propiedad `costoEstimado` de las respuestas. Los empleados solo deben ver el `precioActual` (precio de venta al público).
- **Filtros Soportados**:
  - `search`: Búsqueda parcial por nombre del producto.
  - `categoriaId`: Filtra productos por categoría específica.

### 2. Crear Producto
- **Ruta y Método**: `POST /api/productos`
- **Acción**: Agrega un nuevo producto/servicio al catálogo del negocio.
- **Validaciones**: `categoriaId`, `nombre`, `precioActual` (número mayor o igual a 0), `costoEstimado` (opcional).
- **Reglas de Negocio**:
  - Valida que la categoría proporcionada exista en el negocio y esté activa.
- **Cuerpo (Payload) Esperado**:
  ```json
  {
    "categoriaId": 2,
    "nombre": "Lavado de Acolchado 2 Plazas",
    "precioActual": 3500.00,
    "costoEstimado": 1200.00
  }
  ```

### 3. Actualizar Producto (Edición Total)
- **Ruta y Método**: `PUT /api/productos/:id`
- **Acción**: Modifica los detalles principales del producto.
- **Reglas de Negocio**:
  - Verifica que el producto exista y esté activo.
  - Si se cambia la categoría, verifica que la nueva categoría exista y esté activa.

### 4. Actualizar Disponibilidad
- **Ruta y Método**: `PATCH /api/productos/:id/disponibilidad`
- **Acción**: Modifica rápidamente si un producto está disponible para la venta (ej. si se quedan sin insumos para realizar ese servicio temporalmente).
- **Validaciones**: `disponible` (booleano).
- **Cuerpo (Payload) Esperado**:
  ```json
  {
    "disponible": false
  }
  ```

### 5. Eliminar Producto (Soft Delete)
- **Ruta y Método**: `DELETE /api/productos/:id`
- **Acción**: Realiza una baja lógica del producto (`activo: false`) para no romper el historial de pedidos pasados que usaron este producto, pero quitándolo del catálogo visible.

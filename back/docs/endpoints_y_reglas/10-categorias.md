# Módulo: Categorías de Productos

## Descripción General
Este módulo permite agrupar los productos/servicios en diferentes categorías (Ej. "Lavado al Peso", "Tintorería", "Planchado") para organizar el catálogo y los reportes.

## Roles Permitidos
- **Consultas (`GET`)**: Todos los roles.
- **Creación, Edición y Eliminación (`POST`, `PUT`, `DELETE`)**: Restringido a **ADMIN**.
- Requiere autenticación y suscripción activa.

## Endpoints (Requerimientos Funcionales)

### 1. Listar Categorías
- **Ruta y Método**: `GET /api/categorias`
- **Acción**: Retorna el listado paginado de categorías `activas` del negocio.
- **Filtros Soportados**: `search` (Búsqueda parcial por nombre).

### 2. Crear Categoría
- **Ruta y Método**: `POST /api/categorias`
- **Acción**: Crea una nueva categoría.
- **Validaciones**: `nombre` es obligatorio.
- **Reglas de Negocio**:
  - **Unicidad**: El sistema lanza error si ya existe una categoría activa con el mismo nombre exacto dentro del mismo negocio.
- **Cuerpo (Payload) Esperado**:
  ```json
  {
    "nombre": "Sastrería"
  }
  ```

### 3. Actualizar Categoría
- **Ruta y Método**: `PUT /api/categorias/:id`
- **Acción**: Modifica el nombre de una categoría existente.
- **Reglas de Negocio**:
  - **Unicidad al Editar**: Verifica que el nuevo nombre ingresado no colisione con el de otra categoría distinta que también esté activa en el negocio.

### 4. Eliminar Categoría (Soft Delete)
- **Ruta y Método**: `DELETE /api/categorias/:id`
- **Acción**: Realiza una baja lógica de la categoría (`activo: false`).
- **Reglas de Negocio**:
  - **Restricción de Eliminación**: El sistema **NO** permite eliminar una categoría si esta tiene productos activos asociados. El backend lanzará un error detallando cuántos productos activos tiene. Para eliminar la categoría, primero se deben reasignar o eliminar los productos internos.

# Módulo: Microfrontends

## Descripción General
Este módulo permite registrar e integrar Microfrontends dinámicos en el sistema base, posibilitando una arquitectura extensible donde módulos adicionales pueden cargarse en tiempo de ejecución.

## Roles Permitidos
- Exclusivo para el rol **ADMIN** (y **SUPERADMIN**).
- Requiere autenticación.

## Endpoints (Requerimientos Funcionales)

### 1. Listar Microfrontends
- **Ruta y Método**: `GET /api/microfrontends`
- **Acción**: Retorna la lista de microfrontends registrados.

### 2. Registrar Microfrontend
- **Ruta y Método**: `POST /api/microfrontends`
- **Acción**: Agrega un nuevo registro de microfrontend apuntando a una URL de origen.
- **Validaciones**: `nombre` (requerido), `urlOrigen` (URL válida).
- **Cuerpo (Payload) Esperado**:
  ```json
  {
    "nombre": "Modulo de Marketing",
    "urlOrigen": "https://mf-marketing.ejemplo.com"
  }
  ```

### 3. Alternar Estado (Activar/Desactivar) Microfrontend
- **Ruta y Método**: `PATCH /api/microfrontends/:id/toggle`
- **Acción**: Cambia el estado `activo` del microfrontend, lo que determina si será cargado o no por el frontend principal.

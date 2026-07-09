# Módulo: Superadmin (SaaS y Microfrontends)

## Descripción General
Este módulo es exclusivo para el administrador del sistema SaaS. Permite gestionar los negocios registrados (tenants), cambiar sus estados de suscripción y administrar los orígenes permitidos (CORS) a través de los registros de Microfrontends.

## Roles Permitidos
- **Únicamente SUPERADMIN**.
- Requiere autenticación (token válido). (No requiere validación de suscripción activa de un negocio, ya que el superadmin opera a nivel plataforma).

## Endpoints (Requerimientos Funcionales)

### 1. Listar Negocios (Tenants)
- **Ruta y Método**: `GET /api/superadmin/negocios`
- **Acción**: Retorna una lista paginada de todos los negocios registrados en la plataforma.
- **Filtros Soportados (Query Params)**:
  - `estadoSuscripcion`: Filtra por estado (Ej: PRUEBA, ACTIVA, VENCIDA, CANCELADA).
  - `search`: Búsqueda por `nombre` del negocio o `cuit`.

### 2. Cambiar Estado de Suscripción de un Negocio
- **Ruta y Método**: `PATCH /api/superadmin/negocios/:id/estado`
- **Acción**: Actualiza el estado de la suscripción de un negocio en particular. Al bloquear una suscripción (VENCIDA o CANCELADA), los usuarios de ese negocio ya no podrán usar el sistema hasta que se reactive (interceptado por el middleware `verificarSuscripcionActiva`).
- **Validaciones**:
  - `estadoSuscripcion` debe ser uno de: `ACTIVA`, `VENCIDA`, `PRUEBA`, `CANCELADA`.
- **Cuerpo (Payload) Esperado**:
  ```json
  {
    "estadoSuscripcion": "ACTIVA"
  }
  ```

---

## Gestión de Microfrontends (Orígenes CORS)

Estos endpoints son utilizados por la plataforma para alimentar dinámicamente los orígenes permitidos en la configuración de CORS.

### 3. Listar Microfrontends
- **Ruta y Método**: `GET /api/superadmin/microfrontends`
- **Acción**: Retorna todos los microfrontends registrados en la base de datos (tanto activos como inactivos).

### 4. Crear Registro de Microfrontend
- **Ruta y Método**: `POST /api/superadmin/microfrontends`
- **Acción**: Agrega un nuevo origen (URL) a la lista blanca del sistema.
- **Validaciones**:
  - `nombre`: string (ej: "Módulo Cajas").
  - `urlOrigen`: string (ej: "https://cajas.milavanderia.com").
- **Reglas de Negocio**:
  - La URL (`urlOrigen`) debe ser única a nivel sistema. No permite registrar la misma URL dos veces.
- **Cuerpo (Payload) Esperado**:
  ```json
  {
    "nombre": "Dashboard V2",
    "urlOrigen": "https://dashboard.midominio.com"
  }
  ```

### 5. Activar/Desactivar Microfrontend
- **Ruta y Método**: `PATCH /api/superadmin/microfrontends/:id/toggle`
- **Acción**: Cambia el estado (booleano `activo`) del microfrontend. Si se desactiva, el origen será bloqueado por los CORS del backend en el siguiente reinicio/recarga.

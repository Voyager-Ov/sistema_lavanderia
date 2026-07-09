# Módulo: Usuarios

## Descripción General
Este módulo permite la gestión de los empleados/administradores que operan el sistema para un negocio específico.

## Roles Permitidos
- **Consultas (GET)**: Todos los roles, pero los **EMPLEADOS** solo pueden consultar su propia información.
- **Creación/Edición (POST, PUT, PATCH)**: Restringido a **ADMIN** (o SUPERADMIN).
- Todas las rutas requieren un token válido y que la suscripción del negocio esté activa.

## Endpoints (Requerimientos Funcionales)

### 1. Listar Usuarios
- **Ruta y Método**: `GET /api/usuarios`
- **Acción**: Retorna una lista paginada de usuarios **activos** del negocio. 
- **Reglas de Negocio**: 
  - Si el rol de quien consulta es `EMPLEADO`, el sistema ignora la búsqueda y solo retorna un arreglo con su propio registro de usuario.
  - No retorna los `passwordHash` por seguridad.
- **Filtros Soportados (Query Params)**:
  - `search`: Búsqueda por nombre o email.
  - `rol`: Filtra por un rol específico (ej: ADMIN, EMPLEADO).

### 2. Obtener Usuario por ID
- **Ruta y Método**: `GET /api/usuarios/:id`
- **Acción**: Retorna los detalles de un usuario en particular.
- **Reglas de Negocio**:
  - Si el rol es `EMPLEADO`, valida que el ID solicitado coincida con el ID del token. Si intenta ver a otro usuario, devuelve un error 403 (Prohibido).

### 3. Crear Usuario (Alta de Empleado)
- **Ruta y Método**: `POST /api/usuarios`
- **Acción**: Permite a un ADMIN dar de alta a un nuevo empleado en su negocio. 
- **Validaciones**:
  - `nombre`, `email`, `password`, `rol` son obligatorios.
  - `email` debe ser único en **toda la plataforma** (no solo en el negocio).
- **Reglas de Negocio**:
  - Genera un hash para la contraseña.
  - Crea al usuario como `activo: true`, pero `emailVerificado: false`.
  - Genera un código de verificación y dispara el envío del email (en segundo plano).
  - Valores por defecto: `sueldoBase = 0`, `horasSemanalesObjetivo = 40` (si no se proveen).
- **Cuerpo (Payload) Esperado**:
  ```json
  {
    "nombre": "Pedro Cajero",
    "email": "pedro@burbujas.com",
    "password": "Password123!",
    "rol": "EMPLEADO",
    "sueldoBase": 500000,
    "horasSemanalesObjetivo": 45
  }
  ```

### 4. Actualizar Usuario
- **Ruta y Método**: `PUT /api/usuarios/:id`
- **Acción**: Permite editar datos básicos y de RRHH del usuario.
- **Validaciones**: `nombre`, `sueldoBase`, `horasSemanalesObjetivo`, `rol`. (Todos opcionales, pero si se mandan se actualizan).
- **Reglas de Negocio**: El email no se puede modificar desde este endpoint.

### 5. Desactivar Usuario (Soft Delete)
- **Ruta y Método**: `PATCH /api/usuarios/:id/estado`
- **Acción**: Da de baja lógica a un usuario del negocio (`activo: false`).
- **Reglas de Negocio**:
  - **Restricción**: Un usuario no puede desactivar su propia cuenta.

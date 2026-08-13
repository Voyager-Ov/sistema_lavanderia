# Especificación del Módulo de Perfil de Usuario y Auto-Gestión (Perfil)

Este documento detalla la especificación técnica completa del **Módulo de Perfil de Usuario y Auto-Gestión (`perfil`)** para la plataforma SaaS Multi-Tenant de lavandería, diferenciando el alcance para el **Rol Administrador (`admin`)** y para el **Rol Empleado Operativo (`empleado`)**, vinculando cada Caso de Uso (CU) con sus **Actores autorizados**, las **Pantallas y Componentes de Interfaz del Frontend (UI)** donde se originan las acciones y la **Funcionalidad Backend/Frontend** utilizada para resolverlas.

---

## 1. Alcance y Objetivos del Módulo

El módulo de Perfil proporciona a todos los usuarios autenticados la capacidad de auto-gestionar su identidad digital, credenciales de acceso, vinculaciones a proveedores OAuth (Google) y preferencias de la interfaz gráfica de usuario. El módulo adapta su alcance según el rol del usuario:

*   **Alcance Administrador (`admin`):** Gestión de perfil personal, cambio de contraseña, vinculación de Google, consulta de datos del tenant (`Negocio`), acceso directo a la suscripción y configuración global del sistema.
*   **Alcance Empleado Operativo (`empleado`):** Gestión de perfil personal, cambio de contraseña de acceso al POS, vinculación de Google, consulta de su legajo laboral, estado de su turno de caja activo y personalización visual.

---

## 2. Mapeo Integral: Casos de Uso, Actores, Pantallas Frontend y Funcionalidad de Resolución

### CU-57: Consultar Perfil Activo (`GET /api/v1/auth/me`)
*   **Actores Autorizados:** `Administrador de Negocio` (`admin`), `Empleado Operativo / Cajero` (`empleado`).
*   **Pantalla / Componente Frontend de Origen:**
    *   **Header Global:** `app-header.tsx` (Dropdown de Usuario) y Vistas de Perfil (`/admin/perfil` / `/pos/perfil`).
    *   **Componentes UI:** Dropdown de Usuario con Avatar de iniciales, Badge de Rol (`ADMINISTRADOR` o `EMPLEADO OPERATIVO`) e indicador de estado de conexión verde.
*   **Funcionalidad con la que se Resuelve:**
    *   *Frontend:* Recuperación de datos desde el estado global Zustand `useAuthStore()`.
    *   *Backend (Endpoint `GET /api/v1/auth/me`):* Middleware `verificarToken` decodifica el token JWT e invoca `getMe()` en `auth.controller.js`, retornando los datos sanitizados del usuario, rol, legajo y tenant activo.

---

### CU-58: Actualizar Datos Filiales de Perfil
*   **Actores Autorizados:** `Administrador de Negocio` (`admin`), `Empleado Operativo / Cajero` (`empleado`).
*   **Pantalla / Componente Frontend de Origen:**
    *   **Vista de Mi Perfil:** `/admin/perfil` y `/pos/perfil`.
    *   **Componentes UI:** Formulario de Datos Personales (Inputs de `nombre`, `apellido`, `telefono`).
*   **Funcionalidad con la que se Resuelve:**
    *   *Frontend:* Edición de datos filiales con feedback mediante notificación Sonner `toast.success()`.
    *   *Backend (Endpoint `PUT /api/v1/usuarios/:id`):* Actualización en Sequelize del registro `Usuario` y `Empleado`.

---

### CU-59: Cambiar Contraseña de Acceso Personal
*   **Actores Autorizados:** `Administrador de Negocio` (`admin`), `Empleado Operativo / Cajero` (`empleado`).
*   **Pantalla / Componente Frontend de Origen:**
    *   **Vista de Seguridad de Perfil:** `/admin/perfil` y `/pos/perfil`.
    *   **Componentes UI:** Formulario de Cambio de Clave (Inputs de `passwordActual`, `passwordNueva` y `confirmarPasswordNueva`).
*   **Funcionalidad con la que se Resuelve:**
    *   *Frontend:* Validación local de fortaleza de clave y coincidencia de confirmación.
    *   *Backend (Endpoint `POST /api/v1/auth/me/change-password`):* Execución de `changePassword()` en `auth.controller.js`.
        1. Compara `passwordActual` contra la contraseña hash almacenada en DB mediante `bcrypt.compare()`.
        2. Aplica hash seguro bcrypt a `passwordNueva`.
        3. Persiste la nueva contraseña y mantiene la sesión activa.

---

### CU-60: Vincular / Desvincular Cuenta de Google OAuth
*   **Actores Autorizados:** `Administrador de Negocio` (`admin`), `Empleado Operativo / Cajero` (`empleado`).
*   **Pantalla / Componente Frontend de Origen:**
    *   **Vista de Cuentas Conectadas:** `/admin/perfil` y `/pos/perfil`.
    *   **Componentes UI:** Tarjeta de Integración Google con botones *"Vincular Cuenta"* / *"Desvincular"*.
*   **Funcionalidad con la que se Resuelve:**
    *   *Backend (Endpoints `POST /api/v1/auth/google/link` y `POST /api/v1/auth/google/unlink`):* Autenticación con Google OAuth 2.0. Asocia o desvincula el `googleId` al registro del `Usuario`.

---

### CU-61: Configurar Preferencias de Tema Visual y Notificaciones
*   **Actores Autorizados:** `Administrador de Negocio` (`admin`), `Empleado Operativo / Cajero` (`empleado`).
*   **Pantalla / Componente Frontend de Origen:**
    *   **Header y Perfil:** `app-header.tsx`, `/admin/perfil` y `/pos/perfil`.
    *   **Componentes UI:** Selector de Tema Visual (Modo Claro / Modo Oscuro / Sistema) y menú desplegable de notificaciones.
*   **Funcionalidad con la que se Resuelve:**
    *   *Frontend:* Alterna clases CSS de Tailwind (`dark`) en la etiqueta raíz `<html>` y persiste la preferencia local en `localStorage`.

---

### CU-62: Cerrar Sesión Segura (Logout)
*   **Actores Autorizados:** `Administrador de Negocio` (`admin`), `Empleado Operativo / Cajero` (`empleado`).
*   **Pantalla / Componente Frontend de Origen:**
    *   **Header Global:** `app-header.tsx` (Opción *"Cerrar Sesión"* en el Dropdown de Usuario).
*   **Funcionalidad con la que se Resuelve:**
    *   *Frontend:* Invoca `logout()` de `useAuthStore()`, elimina el token JWT de `localStorage` y redirige al usuario a la pantalla de login (`/login`).

---

## 3. Modelos de Base de Datos Vinculados

### A. Modelo `Usuario` (Esquema Central `public`)
*   `id` (DataTypes.INTEGER, **PK**, autoIncrement): ID único del usuario.
*   `email` (DataTypes.STRING, allowNull: false, unique: true): Correo de acceso.
*   `password` (DataTypes.STRING, allowNull: false): Hash bcrypt de la clave.
*   `googleId` (DataTypes.STRING, allowNull: true): ID de proveedor Google OAuth.
*   `activo` (DataTypes.BOOLEAN, defaultValue: true): Flag de estado.

---

### B. Modelo `Empleado` (Esquema Tenant `tenant_{id}`)
*   `id` (DataTypes.INTEGER, **PK**, autoIncrement): Identificador del perfil.
*   `legajo` (DataTypes.INTEGER, allowNull: false): Legajo laboral.
*   `nombre` (DataTypes.STRING, allowNull: false): Nombre.
*   `apellido` (DataTypes.STRING, allowNull: false): Apellido.
*   `telefono` (DataTypes.STRING, allowNull: true): Teléfono personal.

---

## 4. Contratos de API (JSON Payloads)

### 1. Obtener Datos del Perfil (`GET /api/v1/auth/me`)
*   **Headers:** `Authorization: Bearer <token_jwt>`
*   **Responses:**
    *   `200 OK` ➔ Retorna el perfil del usuario autenticado.
        ```json
        {
          "status": "success",
          "data": {
            "id": 5,
            "email": "empleado@lavanderia.com",
            "nombre": "Juan",
            "apellido": "Pérez",
            "legajo": 102,
            "telefono": "+543515554433",
            "rol": "empleado",
            "negocioId": 1,
            "googleLinked": false
          }
        }
        ```

---

### 2. Cambiar Contraseña (`POST /api/v1/auth/me/change-password`)
*   **Headers:** `Authorization: Bearer <token_jwt>`
*   **Request Body:**
    ```json
    {
      "passwordActual": "MiClaveAntigua123!",
      "passwordNueva": "NuevaClaveSuperSegura456!",
      "confirmarPasswordNueva": "NuevaClaveSuperSegura456!"
    }
    ```
*   **Responses:**
    *   `200 OK` ➔ Contraseña actualizada con éxito.
        ```json
        {
          "status": "success",
          "message": "Contraseña actualizada exitosamente"
        }
        ```
    *   `400 Bad Request` ➔ La contraseña actual es incorrecta o las contraseñas nuevas no coinciden.

---

## 5. Algoritmos de Negocio y Lógica en los Servicios

### Algoritmo de Cambio Seguro de Contraseña (`changePassword`)

```javascript
export const changePassword = async (usuarioId, passwordActual, passwordNueva) => {
    const usuario = await centralModels.Usuario.findByPk(usuarioId);
    if (!usuario) throw new AppError("Usuario no encontrado", 404);

    // 1. Comparar hash de contraseña actual
    const esValida = await bcrypt.compare(passwordActual, usuario.password);
    if (!esValida) {
        throw new AppError("La contraseña actual ingresada es incorrecta.", 400);
    }

    // 2. Cifrar nueva contraseña con bcrypt
    const salt = await bcrypt.genSalt(10);
    const nuevoHash = await bcrypt.hash(passwordNueva, salt);

    // 3. Persistir nuevo hash
    await usuario.update({ password: nuevoHash });

    return { message: "Contraseña actualizada exitosamente" };
};
```

---

## 6. Middlewares y Seguridad

*   `verificarToken`: Garantiza que el usuario esté autenticado con un token JWT válido para poder acceder a la auto-gestión de su perfil.

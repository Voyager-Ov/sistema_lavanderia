# Especificación Técnica de API y Requerimientos: Módulo de Perfil de Usuario y Auto-Gestión

**Estándar de Documentación de Cátedra (UTN FRC)**  
**Proyecto:** SaaS Lavandería Multi-Negocio  
**Módulo:** Módulo de Perfil de Usuario y Auto-Gestión (`perfil`)  

---

## 1. Arquitectura y Experiencia de Usuario

### Estilo Arquitectónico: Arquitectura en Capas (Layered Architecture)

*   **Capa de Presentación («boundary»)**:
    *   Header Global con Dropdown de Perfil (`app-header.tsx`).
    *   Vistas de Mi Perfil en Portal Admin (`/admin/perfil`) y Portal POS (`/pos/perfil`).
    *   Formulario de Datos Personales, Cambio de Contraseña y Vinculación Google.
    *   Selector de Tema Visual (Modo Claro / Modo Oscuro / Sistema).
*   **Capa de Control/Servicios («control»)**:
    *   `AuthController`: Endpoints `/api/v1/auth/me` y `/api/v1/auth/me/change-password`.
    *   `GoogleController`: Vinculación OAuth.
*   **Capa de Dominio/Entidades («entity»)**:
    *   Modelos Sequelize: `Usuario` (DB Central), `Empleado` (DB Tenant).

---

## 2. Jerarquía de Actores y Matriz de Permisos por Rol

### Jerarquía de Actores (Estándar UTN FRC)

*   **Usuario** (Actor Abstracto): Permite la auto-gestión de credenciales y datos filiales para cualquier usuario autenticado.
    *   **Empleado** (Actor Físico):
        *   **Administrador** (Rol `admin`): Auto-gestiona perfil + visualiza datos del `Negocio` y suscripción.
        *   **Empleado Operativo / Cajero** (Rol `empleado`): Auto-gestiona perfil + visualiza estado de su turno de caja.

---

## 3. Mapeo de Casos de Uso, Actores y Componentes UI del Frontend

| Caso de Uso (CU) | Actores Autorizados | Pantalla / Componente Frontend (UI) | Funcionalidad y Endpoint Backend |
| :--- | :---: | :--- | :--- |
| **CU-57: Consultar Perfil Activo** | Admin, Empleado | `app-header.tsx`<br>`/admin/perfil`, `/pos/perfil` | `GET /api/v1/auth/me`<br>Recuperación de datos del usuario, rol, legajo y tenant activo. |
| **CU-58: Actualizar Datos Personales** | Admin, Empleado | `/admin/perfil`, `/pos/perfil` | `PUT /api/v1/usuarios/:id`<br>Actualización de nombre, apellido y teléfono. |
| **CU-59: Cambiar Contraseña Personal** | Admin, Empleado | `/admin/perfil`, `/pos/perfil` | `POST /api/v1/auth/me/change-password`<br>Verificación de clave actual (`bcrypt.compare`) y actualización de hash. |
| **CU-60: Vincular OAuth Google** | Admin, Empleado | `/admin/perfil`, `/pos/perfil` | `POST /api/v1/auth/google/link`<br>Asociación de `googleId` para inicio de sesión en un clic. |
| **CU-61: Configurar Preferencias Tema** | Admin, Empleado | `app-header.tsx`<br>`/admin/perfil`, `/pos/perfil` | Alternancia de clase Tailwind `dark` en `<html>` con persistencia en `localStorage`. |
| **CU-62: Cerrar Sesión (Logout)** | Admin, Empleado | `app-header.tsx` | Destrucción de sesión local en Zustand (`logout()`) y remoción de JWT. |

---

## 4. Diagnóstico de Códigos de Respuesta HTTP

| Código HTTP | Significado Contable / Operativo | Ejemplo de Causa |
| :---: | :--- | :--- |
| **200 OK** | Perfil obtenido o contraseña cambiada con éxito | Actualización de clave o consulta de `/me`. |
| **400 Bad Request** | Error de validación | Contraseña actual incorrecta o contraseñas no coinciden. |
| **401 Unauthorized** | Token ausente o inválido | Intento de acceder al perfil sin estar logueado. |

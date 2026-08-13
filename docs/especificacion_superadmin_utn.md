# Especificación Técnica de API y Requerimientos: Módulo de Administración Global de Sistema (SuperAdmin)

**Estándar de Documentación de Cátedra (UTN FRC)**  
**Proyecto:** SaaS Lavandería Multi-Negocio  
**Módulo:** Módulo de Administración Global de Sistema (`superadmin`)  

---

## 1. Arquitectura y Modelo de Infraestructura SaaS

### Estilo Arquitectónico: Arquitectura Multi-Tenant Isolada

*   **Capa de Presentación («boundary»)**:
    *   Formulario de Autenticación Global (`/superadmin/login`).
    *   Consola Principal de SuperAdmin (`/superadmin/dashboard`).
    *   Tarjetas de Salud de Infraestructura (Base de datos central, Backend API, Microfrontends).
    *   Tabla de Control de Tenants y Corte de Servicio (`negocios`).
*   **Capa de Control/Servicios («control»)**:
    *   `SuperAdminController`: Gestión de autenticación de sistema e inhabilitación de tenants.
    *   `MonitorService`: Chequeo automatizado de salud (`runHealthCheck()`), verificación de latencia PostgreSQL y respuesta HTTP.
    *   `MFController`: Registro de dominios autorizados y política de CORS.
*   **Capa de Dominio/Entidades («entity»)**:
    *   Modelos Sequelize (Esquema Central `public`): `SuperAdmin`, `Negocio`, `MicroFrontend`.

---

## 2. Jerarquía de Actores y Matriz de Permisos por Rol

### Jerarquía de Actores (Estándar UTN FRC)

*   **SuperAdmin de Sistema** (Actor Físico / Rol `SUPERADMIN_SYS`): Posee privilegios absolutos para monitorear la plataforma, suspender lavanderías por falta de pago o reactivar licencias.
*   **Servidor de Monitoreo** (Actor Secundario / Sistema Externo).

---

## 3. Mapeo de Casos de Uso, Actores y Componentes UI del Frontend

| Caso de Uso (CU) | Actores Autorizados | Pantalla / Componente Frontend (UI) | Funcionalidad y Endpoint Backend |
| :--- | :---: | :--- | :--- |
| **CU-48: Autenticación SuperAdmin** | SuperAdmin (`SUPERADMIN_SYS`) | `/superadmin/login` | `POST /api/superadmin/login`<br>Validación contra `public.SuperAdmin` y emisión de JWT aislado de sistema. |
| **CU-49: Consola de Salud del Sistema** | SuperAdmin (`SUPERADMIN_SYS`) | `/superadmin/dashboard`<br>Tarjetas de Salud de Infraestructura | `GET /api/superadmin/health-check`<br>`runHealthCheck()`: Diagnóstico en vivo de DB Central, esquemas tenant y latencia. |
| **CU-50: Corte y Reactivación de Servicio** | SuperAdmin (`SUPERADMIN_SYS`) | `/superadmin/dashboard`<br>Tabla de Tenants ➔ Botón *"Cortar Servicio"* | `PUT /api/superadmin/negocios/:id/status`<br>Modifica `negocio.activo`. Middleware `verificarSuscripcionActiva` bloquea el acceso con HTTP 403. |
| **CU-51: Administrar Microfrontends CORS** | SuperAdmin (`SUPERADMIN_SYS`) | `/superadmin/dashboard` | `GET/POST /api/superadmin/microfrontends`<br>Aprovisionamiento de dominios e integraciones autorizadas. |

---

## 4. Especificación del Front-End (Vistas y Componentes UX)

### Consola Principal (`/superadmin/dashboard`)
*   Tarjetas de salud con indicadores luminosos (Verde: OK / Rojo animado: Faltante/Error).
*   Tabla de tenants con badges de estado de suscripción (`ACTIVA`, `PRUEBA`, `SUSPENDIDA`) y toggle atómico de corte de servicio.

---

## 5. Diagnóstico de Códigos de Respuesta HTTP

| Código HTTP | Significado Contable / Operativo | Ejemplo de Causa |
| :---: | :--- | :--- |
| **200 OK** | Autenticación o cambio de estado exitoso | Token emitido o servicio reactivado/suspendido. |
| **401 Unauthorized** | Credenciales o token inválidos | Intento de login con contraseña incorrecta. |
| **403 Forbidden** | Acceso denegado o suscripción suspendida | Usuario intentando operar en un tenant con `activo = false`. |

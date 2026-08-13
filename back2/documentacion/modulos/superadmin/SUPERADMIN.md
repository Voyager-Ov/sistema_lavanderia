# Especificación del Módulo de Administración Global de Sistema (SuperAdmin)

Este documento detalla la especificación técnica completa del **Módulo de Administración Global de Sistema (`superadmin`)** para la plataforma SaaS Multi-Tenant de lavandería, vinculando cada Caso de Uso (CU) con sus **Actores autorizados**, las **Pantallas y Componentes de Interfaz del Frontend (UI)** donde se originan las acciones y la **Funcionalidad Backend/Frontend** utilizada para resolverlas.

---

## 1. Alcance y Objetivos del Módulo

El módulo de SuperAdmin es el centro de control global e infraestructura del SaaS. Operado exclusivamente por los Administradores de Plataforma (`SUPERADMIN_SYS`), gestiona el aprovisionamiento multi-tenant, la suspensión o habilitación inmediata de servicios por facturación/pago, el monitoreo en tiempo real de la salud del sistema (bases de datos y latencia) y la lista blanca de orígenes de microfrontends e integraciones CORS.

---

## 2. Mapeo Integral: Casos de Uso, Actores, Pantallas Frontend y Funcionalidad de Resolución

### CU-48: Autenticación e Inicio de Sesión de SuperAdmin
*   **Actores Autorizados:** `SuperAdmin de Sistema` (`SUPERADMIN_SYS`) *(Exclusivo)*.
*   **Pantalla / Componente Frontend de Origen:**
    *   **Consola SuperAdmin:** `/superadmin/login`.
*   **Funcionalidad con la que se Resuelve:**
    *   *Frontend:* Formulario de credenciales globales.
    *   *Backend (Endpoint `POST /api/superadmin/login`):* Verifica la existencia del registro en la tabla `public.SuperAdmin`, valida la contraseña mediante hash bcrypt y genera un token JWT aislado con vigencia de 24 horas y payload `{ id, email, rol: "SUPERADMIN_SYS" }`.

---

### CU-49: Consultar Consola de Salud del Sistema y Monitoreo Multi-Tenant
*   **Actores Autorizados:** `SuperAdmin de Sistema` (`SUPERADMIN_SYS`) *(Exclusivo)*.
*   **Pantalla / Componente Frontend de Origen:**
    *   **Consola Principal:** `/superadmin/dashboard`.
    *   **Componentes UI:** Tarjetas de Salud del Sistema (*Base de Datos Central*, *Backend/API*, *Microfrontends*).
*   **Funcionalidad con la que se Resuelve:**
    *   *Frontend:* Polling automatizado cada 60 segundos invocando las métricas de infraestructura.
    *   *Backend (Endpoints `GET /api/superadmin/dashboard` y `GET /api/superadmin/health-check`):* Invoca `runHealthCheck()` en `monitor.service.js`, verificando conectividad a PostgreSQL central, prueba de ping sobre esquemas tenant y estado de respuesta HTTP de microfrontends.

---

### CU-50: Gestor de Estado de Suscripción y Corte de Servicio Multi-Tenant
*   **Actores Autorizados:** `SuperAdmin de Sistema` (`SUPERADMIN_SYS`) *(Exclusivo)*.
*   **Pantalla / Componente Frontend de Origen:**
    *   **Consola Principal:** `/superadmin/dashboard`.
    *   **Componentes UI:** Tabla de Tenants (`Negocios`) y botón de acción *"Cortar Servicio"* / *"Reactivar"*.
*   **Funcionalidad con la que se Resuelve:**
    *   *Frontend:* Diálogo de confirmación interactivo para modificar el estado del tenant.
    *   *Backend (Endpoints `PUT /api/superadmin/negocios/:id/status` y `PATCH /api/superadmin/negocios/:id/estado`):* Modifica `negocio.activo` (`true`/`false`) y `negocio.estadoSuscripcion` (`ACTIVA`, `PRUEBA`, `SUSPENDIDA`, `CANCELADA`).
    *   *Enforcement Middleware:* Al marcar un negocio como suspendido (`activo = false`), el middleware de tenant `verificarSuscripcionActiva` rechaza inmediatamente cualquier petición subsiguiente de los usuarios de dicho negocio con HTTP 403 Forbidden (*"El servicio de su lavandería se encuentra suspendido. Contacte a soporte"*).

---

### CU-51: Administrar Microfrontends e Integraciones CORS
*   **Actores Autorizados:** `SuperAdmin de Sistema` (`SUPERADMIN_SYS`) *(Exclusivo)*.
*   **Pantalla / Componente Frontend de Origen:**
    *   **Consola Principal:** `/superadmin/dashboard`.
*   **Funcionalidad con la que se Resuelve:**
    *   *Frontend:* Panel de control de dominios autorizados y estado de microfrontends.
    *   *Backend (Endpoints `GET /api/superadmin/microfrontends`, `POST /api/superadmin/microfrontends` y `PATCH /api/superadmin/microfrontends/:id/toggle`):* Altas y modificación de orígenes dinámicos autorizados en la cabecera CORS del backend Express.

---

## 3. Modelos de Base de Datos Vinculados

El módulo ópera sobre el esquema global y de control (`public`).

### A. Modelo `SuperAdmin`
*   `id` (DataTypes.INTEGER, **PK**, autoIncrement): Identificador del administrador global.
*   `nombre` (DataTypes.STRING, allowNull: false): Nombre.
*   `email` (DataTypes.STRING, allowNull: false, unique: true): Correo electrónico.
*   `passwordHash` (DataTypes.STRING, allowNull: false): Hash cifrado bcrypt.
*   `activo` (DataTypes.BOOLEAN, defaultValue: true): Estado.

---

### B. Modelo `Negocio`
*   `id` (DataTypes.INTEGER, **PK**, autoIncrement): Identificador del tenant lavandería.
*   `nombre` (DataTypes.STRING, allowNull: false): Razón social del negocio.
*   `subdominio` (DataTypes.STRING, allowNull: false, unique: true): Subdominio o slug.
*   `activo` (DataTypes.BOOLEAN, defaultValue: true): Bandera global de habilitación de servicio.
*   `estadoSuscripcion` (DataTypes.ENUM("PRUEBA", "ACTIVA", "SUSPENDIDA", "CANCELADA"), defaultValue: "PRUEBA"): Estado comercial.

---

### C. Modelo `MicroFrontend`
*   `id` (DataTypes.INTEGER, **PK**, autoIncrement): ID de integrador.
*   `nombre` (DataTypes.STRING, allowNull: false): Nombre del módulo/origen.
*   `url` (DataTypes.STRING, allowNull: false): URL base.
*   `activo` (DataTypes.BOOLEAN, defaultValue: true): Estado de habilitación CORS.

---

## 4. Contratos de API (JSON Payloads)

### 1. Autenticación SuperAdmin (`POST /api/superadmin/login`)
*   **Request Body:**
    ```json
    {
      "email": "superadmin@sistema.com",
      "password": "SuperSecretPassword123!"
    }
    ```
*   **Responses:**
    *   `200 OK` ➔ Retorna token JWT de sistema.
        ```json
        {
          "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
          "user": {
            "id": 1,
            "email": "superadmin@sistema.com",
            "nombre": "Administrador Global",
            "rol": "SUPERADMIN_SYS"
          }
        }
        ```

---

### 2. Modificar Estado de Suscripción / Corte de Servicio (`PUT /api/superadmin/negocios/:id/status`)
*   **Headers:** `Authorization: Bearer <token_superadmin>`
*   **Request Body:**
    ```json
    {
      "activo": false
    }
    ```
*   **Responses:**
    *   `200 OK` ➔ Estado actualizado exitosamente.
        ```json
        {
          "id": 4,
          "nombre": "Lavandería Express Córdoba",
          "subdominio": "express-cordoba",
          "activo": false,
          "estadoSuscripcion": "SUSPENDIDA"
        }
        ```

---

## 5. Algoritmos de Negocio y Lógica en los Servicios

### Algoritmo de Corte Inmediato e Intercepción por Middleware (`superAdminAuth` y `verificarSuscripcionActiva`)

```javascript
// Middleware de Autenticación Exclusiva de SuperAdmin
export const superAdminAuth = (req, res, next) => {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "Acceso denegado. Token no provisto." });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.rol !== "SUPERADMIN_SYS") {
            return res.status(403).json({ error: "Acceso denegado. Permisos de SuperAdmin requeridos." });
        }
        req.superAdmin = decoded;
        next();
    } catch (err) {
        res.status(401).json({ error: "Token no válido o expirado." });
    }
};

// Enforcement Global: Bloqueo de Peticiones a Tenants Suspendidos
export const verificarSuscripcionActiva = async (req, res, next) => {
    const negocioId = req.user?.negocioId;
    if (!negocioId) return res.status(400).json({ error: "Negocio no identificado." });

    const negocio = await models.Negocio.findByPk(negocioId);
    if (!negocio || !negocio.activo || negocio.estadoSuscripcion === "SUSPENDIDA") {
        return res.status(403).json({ 
            error: "El servicio de su lavandería se encuentra suspendido. Regularice su suscripción para continuar operando." 
        });
    }
    next();
};
```

---

## 6. Middlewares y Seguridad

*   `superAdminAuth`: Inyecta la identidad de `SUPERADMIN_SYS` y verifica la validez del token administrativo aislado.

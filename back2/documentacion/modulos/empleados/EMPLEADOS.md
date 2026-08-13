# Especificación del Módulo de Gestión de Empleados y Recursos Humanos (Empleados)

Este documento detalla la especificación técnica completa del **Módulo de Gestión de Empleados y Recursos Humanos (`empleados`)** en el **Portal Administrador (`admin`)** para la plataforma SaaS Multi-Tenant de lavandería, vinculando cada Caso de Uso (CU) con sus **Actores autorizados**, las **Pantallas y Componentes de Interfaz del Frontend (UI)** donde se originan las acciones y la **Funcionalidad Backend/Frontend** utilizada para resolverlas.

---

## 1. Alcance y Objetivos del Módulo

El módulo de Empleados es la herramienta del Portal Administrador responsable del alta y aprovisionamiento de personal del negocio, asignación de legajos, administración de roles de acceso (`admin` vs `empleado`), auditoría de desempeño de cajeros (turnos de caja atendidos y recaudación generada) y desactivación por baja lógica.

---

## 2. Mapeo Integral: Casos de Uso, Actores, Pantallas Frontend y Funcionalidad de Resolución

### CU-43: Registrar Empleado (Alta de Personal y Credencial)
*   **Actores Autorizados:** `Administrador de Negocio` (`admin`) *(Exclusivo)*.
*   **Pantalla / Componente Frontend de Origen:**
    *   **Pantalla de Gestión de Empleados:** `/admin/empleados`.
    *   **Componentes UI:** `empleados-header.tsx` (Botón "+ Registrar Empleado") y `empleados-modals.tsx` (Formulario de alta desplegado dentro de `ResponsiveSheet`).
*   **Funcionalidad con la que se Resuelve:**
    *   *Frontend:* Formulario con inputs de `legajo`, `nombre`, `apellido`, `email`, `telefono`, `password` y asignación de `rol` (`"admin"` o `"empleado"`).
    *   *Backend (Endpoint `POST /api/v1/usuarios`):* Ejecución dentro de una transacción Sequelize.
        1. Crea el registro `Usuario` en la base de datos central (`public.Usuario`).
        2. Aplica hash seguro bcrypt a la contraseña.
        3. Crea el registro `Empleado` en el esquema del tenant (`tenant_{id}.Empleado`).
        4. Vincula el `empleadoId` con el `Usuario` central y asigna el rol en la tabla `UsuarioRoles`.

---

### CU-44: Modificar Perfil y Rol de Empleado
*   **Actores Autorizados:** `Administrador de Negocio` (`admin`) *(Exclusivo)*.
*   **Pantalla / Componente Frontend de Origen:**
    *   **Pantalla de Gestión de Empleados:** `/admin/empleados`.
    *   **Componentes UI:** `empleados-table.tsx` (Acción "Editar Empleado") y `empleados-modals.tsx` (`ResponsiveSheet`).
*   **Funcionalidad con la que se Resuelve:**
    *   *Frontend:* Formulario de actualización de datos filiales, teléfono y cambio de rol asignado.
    *   *Backend (Endpoint `PUT /api/v1/usuarios/:id`):* Actualiza la información del perfil y re-asigna las llaves de rol en el middleware de autorización RBAC (`verificarRol(["ADMIN"])`).

---

### CU-45: Consultar Padrón de Empleados y KPIs de Personal
*   **Actores Autorizados:** `Administrador de Negocio` (`admin`) *(Exclusivo)*.
*   **Pantalla / Componente Frontend de Origen:**
    *   **Pantalla de Gestión de Empleados:** `/admin/empleados`.
    *   **Componentes UI:** `empleados-kpis.tsx` (Tarjetas de *Total Empleados*, *Activos*, *Cajeros de Turno*) y `empleados-table.tsx`.
*   **Funcionalidad con la que se Resuelve:**
    *   *Frontend:* Tabla paginada de legajos con buscador predictivo por nombre/apellido o email y badges de rol/estado.
    *   *Backend (Endpoint `GET /api/v1/usuarios`):* Consulta paginada con filtrado multi-tenant por `negocioId`.

---

### CU-46: Desactivar Empleado (Baja Lógica)
*   **Actores Autorizados:** `Administrador de Negocio` (`admin`) *(Exclusivo)*.
*   **Pantalla / Componente Frontend de Origen:**
    *   **Pantalla de Gestión de Empleados:** `/admin/empleados`.
    *   **Componentes UI:** `empleados-table.tsx` (Menú de acciones / Opción "Dar de Baja").
*   **Funcionalidad con la que se Resuelve:**
    *   *Frontend:* Diálogo de confirmación para inhabilitar al empleado.
    *   *Backend (Endpoint `PATCH /api/v1/usuarios/:id/estado`):* Actualiza `activo = false` en el modelo `Usuario` central. Revoca inmediatamente el acceso y destruye la validez del token JWT del usuario, preservando inmutablemente sus registros de legajo, pedidos procesados y turnos de caja pasados.

---

### CU-47: Auditar Desempeño y Métricas de Cajero
*   **Actores Autorizados:** `Administrador de Negocio` (`admin`) *(Exclusivo)*.
*   **Pantalla / Componente Frontend de Origen:**
    *   **Reportes de Empleados:** `/admin/reportes/empleados` y `/admin/empleados/[id]`.
    *   **Componentes UI:** `empleados-report-header.tsx`, `empleados-report-table.tsx`, `ultimas-cajas-table.tsx` y `caja-detalle-sheet.tsx` (`ResponsiveSheet`).
*   **Funcionalidad con la que se Resuelve:**
    *   *Frontend:* Cuadro de mando ejecutivo que calcula el total recaudado en mostrador por cada cajero, cantidad de pedidos procesados y turnos de caja cerrados con su respectivo arqueo.
    *   *Backend (Endpoint `GET /api/v1/usuarios/:id/metricas`):* Agregaciones de Sequelize que summarizan `models.Pago.sum('monto')` y `models.Caja.findAll()` pertenecientes al `usuarioId` en el tenant activo.

---

## 3. Modelos de Base de Datos Vinculados

El módulo interactúa tanto con la base de datos central (`public`) como con el esquema del tenant (`tenant_{id}`).

### A. Esquema Central (`public`)

#### Modelo `Usuario`
*   `email` (DataTypes.STRING, **PK**): Dirección de correo del empleado.
*   `password` (DataTypes.STRING, allowNull: false): Hash cifrado bcrypt.
*   `activo` (DataTypes.BOOLEAN, defaultValue: true): Flag de baja lógica.
*   `empleadoId` (DataTypes.INTEGER, allowNull: false): Llave de relación al modelo `Empleado` del tenant.
*   `negocioId` (DataTypes.INTEGER, allowNull: false): Llave tenant.

#### Modelo `Rol` y Tabla `UsuarioRoles`
*   `nombre`: "Administrador" (o `"admin"`) / "Empleado Operativo" (o `"empleado"`).

---

### B. Esquema del Tenant (`tenant_{id}`)

#### Modelo `Empleado`
*   `id` (DataTypes.INTEGER, **PK**, autoIncrement): Identificador del perfil.
*   `legajo` (DataTypes.INTEGER, allowNull: false): Número de legajo interno.
*   `nombre` (DataTypes.STRING, allowNull: false): Nombre.
*   `apellido` (DataTypes.STRING, allowNull: false): Apellido.
*   `telefono` (DataTypes.STRING, allowNull: true): Teléfono personal de contacto.
*   `fechaAlta` (DataTypes.DATE, defaultValue: DataTypes.NOW): Fecha de alta.
*   `negocioId` (DataTypes.INTEGER, allowNull: false): Llave tenant.

---

## 4. Contratos de API (JSON Payloads)

### 1. Registrar Nuevo Empleado (`POST /api/v1/usuarios`)
*   **Headers:** `Authorization: Bearer <token_jwt>`
*   **Roles Permitidos:** `admin` *(Exclusivo)*
*   **Request Body:**
    ```json
    {
      "legajo": 104,
      "nombre": "Carlos",
      "apellido": "López",
      "email": "carlos.lopez@lavanderia.com",
      "telefono": "+543518889900",
      "password": "PasswordSegura123!",
      "rol": "empleado"
    }
    ```
*   **Responses:**
    *   `201 Created` ➔ Empleado registrado exitosamente.
        ```json
        {
          "status": "success",
          "message": "Empleado creado exitosamente",
          "data": {
            "id": 18,
            "legajo": 104,
            "nombre": "Carlos",
            "apellido": "López",
            "email": "carlos.lopez@lavanderia.com",
            "rol": "empleado",
            "activo": true,
            "createdAt": "2026-08-13T17:50:00.000Z"
          }
        }
        ```
    *   `400 Bad Request` ➔ El email ya se encuentra registrado o el legajo es nulo.

---

### 2. Consultar Métricas de Desempeño (`GET /api/v1/usuarios/:id/metricas`)
*   **Headers:** `Authorization: Bearer <token_jwt>`
*   **Roles Permitidos:** `admin` *(Exclusivo)*
*   **Responses:**
    *   `200 OK` ➔ Retorna métricas de desempeño del empleado.
        ```json
        {
          "status": "success",
          "message": null,
          "data": {
            "empleadoId": 18,
            "nombre": "Carlos López",
            "pedidosProcesados": 142,
            "totalRecaudado": 358000.00,
            "cajasAtendidas": 24,
            "cajasConDiferencia": 1
          }
        }
        ```

---

## 5. Algoritmos de Negocio y Lógica en los Servicios

### Algoritmo de Creación Atómica de Empleado (`crearUsuario`)

```javascript
export const crearUsuario = async (negocioId, usuarioData) => {
    const { legajo, nombre, apellido, email, telefono, password, rol } = usuarioData;

    const t = await centralSequelize.transaction();
    try {
        // 1. Validar unicidad de correo electrónico
        const existe = await centralModels.Usuario.findOne({ where: { email } });
        if (existe) throw new AppError("Ya existe un usuario registrado con este correo.", 400);

        // 2. Cifrar contraseña con bcrypt
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Crear perfil Empleado en el Tenant
        const tenantDb = await connectionManager.getTenantDb(negocioId);
        const nuevoEmpleado = await tenantDb.models.Empleado.create({
            legajo,
            nombre,
            apellido,
            telefono,
            negocioId
        });

        // 4. Crear Usuario en DB Central
        const nuevoUsuario = await centralModels.Usuario.create({
            email,
            password: hashedPassword,
            negocioId,
            empleadoId: nuevoEmpleado.id,
            activo: true,
            emailConfirmado: true
        }, { transaction: t });

        // 5. Asignar Rol
        const rolDb = await centralModels.Rol.findOne({ where: { nombre: rol || "empleado" } });
        await nuevoUsuario.addRol(rolDb, { transaction: t });

        await t.commit();

        return {
            id: nuevoEmpleado.id,
            legajo,
            nombre,
            apellido,
            email,
            rol: rol || "empleado"
        };
    } catch (error) {
        if (t.finished !== 'commit') await t.rollback();
        throw error;
    }
};
```

---

## 6. Middlewares y Seguridad

*   `verificarToken` y `verificarSuscripcionActiva`.
*   `verificarRol(["ADMIN"])`: Middleware exclusivo que restringe el alta, edición, baja de empleados y consulta de métricas de personal al rol Administrador.

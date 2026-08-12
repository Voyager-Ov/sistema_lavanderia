# Especificación del Módulo de Autenticación y Seguridad (Auth)

Este documento detalla la lógica operativa, contratos de API, flujos de datos y diseño técnico del **Módulo de Autenticación (`auth`)** para la plataforma de lavandería SaaS.

---

## 1. Alcance y Objetivos del Módulo

El módulo de Autenticación y Seguridad es el responsable de gobernar el acceso seguro a la plataforma, gestionar las credenciales de los usuarios, auditar las sesiones activas y aprovisionar a los nuevos inquilinos (Negocios) del SaaS mediante un flujo de onboarding automatizado.

### Casos de Uso del Módulo (`Módulo 2` en Specs):
*   **CU-05: Iniciar Sesión** (Local y Google OAuth).
*   **CU-06: Cerrar Sesión** (Invalidación lógica/destrucción local del token).
*   **CU-07: Caducar Sesión** (Expiración del JWT del lado del cliente/servidor).
*   **CU-08: Confirmar Cuenta de Usuario** (Verificación por código de email).
*   **CU-10: Registrar Empleado** (En su faceta de credencial/usuario).
*   **CU-11: Modificar Empleado** (En su faceta de credencial/usuario).

---

## 2. Modelos de Base de Datos Vinculados

El módulo interactúa con dos esquemas lógicos en PostgreSQL (a través del `connectionManager`): el esquema central (`public`) y el esquema dinámico de cada inquilino (`tenant_{id}`).

### A. Esquema Central (`public`)

Representa la información compartida por toda la plataforma SaaS.

#### Modelo `Usuario`
Almacena estrictamente las credenciales y el estado de seguridad. No contiene nombres, teléfonos ni sueldos.
*   `email` (DataTypes.STRING, **PK**): Dirección de correo electrónico única.
*   `password` (DataTypes.STRING, allowNull: true): Hash de la contraseña local (nulo si el registro es exclusivo por Google).
*   `googleId` (DataTypes.STRING, allowNull: true, unique: true): Identificador único de Google OAuth (`sub`).
*   `tokenConfirmacion` (DataTypes.STRING, allowNull: true): Código numérico de 6 dígitos para la verificación inicial de correo.
*   `tokenConfirmacionExpires` (DataTypes.DATE, allowNull: true): Fecha/Hora límite para ingresar el código de verificación.
*   `emailConfirmado` (DataTypes.BOOLEAN, defaultValue: false): Flag que habilita el login local.
*   `activo` (DataTypes.BOOLEAN, defaultValue: true): Flag de baja lógica general.
*   `empleadoId` (DataTypes.INTEGER, allowNull: true): ID de vinculación hacia el modelo `Empleado` que reside en el esquema del tenant correspondente (se asocia con `constraints: false` debido al cruce de esquemas).

#### Modelo `Rol`
Define los roles del sistema asignados a los usuarios.
*   `id` (DataTypes.INTEGER, **PK**, autoIncrement): Identificador único.
*   `nombre` (DataTypes.STRING, unique: true): "Administrador", "Cajero", "Lavador", etc.
*   `descripcion` (DataTypes.STRING, allowNull: true).

#### Tabla Intermedia `UsuarioRoles` (Junction Table)
Asocia los usuarios con sus respectivos roles.
*   `usuarioEmail` (DataTypes.STRING, **PK**, FK a `Usuario.email`).
*   `rolId` (DataTypes.INTEGER, **PK**, FK a `Rol.id`).

---

### B. Esquema del Tenant (`tenant_{id}`)

Contiene la información operativa aislada de cada lavandería.

#### Modelo `Empleado`
Almacena el perfil físico y datos de negocio del empleado vinculados al usuario central.
*   `id` (DataTypes.INTEGER, **PK**, autoIncrement): Identificador del empleado en el tenant.
*   `legajo` (DataTypes.INTEGER, allowNull: false): Número identificatorio dentro de la organización.
*   `nombre` (DataTypes.STRING, allowNull: false): Nombre de pila.
*   `apellido` (DataTypes.STRING, allowNull: false): Apellido.
*   `telefono` (DataTypes.STRING, allowNull: true): Teléfono de contacto.
*   `fechaAlta` (DataTypes.DATE, defaultValue: DataTypes.NOW): Fecha de ingreso.
*   `negocioId` (DataTypes.INTEGER, allowNull: false): Relación hacia el `Negocio` central (con `constraints: false`).

#### Modelo `Sesion`
Auditoría de inicios de sesión de los usuarios del tenant.
*   `id` (DataTypes.INTEGER, **PK**, autoIncrement): Código identificador.
*   `fechaHoraInicio` (DataTypes.DATE, defaultValue: DataTypes.NOW): Registro de conexión.
*   `fechaHoraFin` (DataTypes.DATE, allowNull: true): Registro de desconexión.
*   `usuarioEmail` (DataTypes.STRING, allowNull: false): Email del usuario central que inició la sesión.

---

## 3. Contratos de API (JSON Payloads)

Todos los payloads de respuesta deben mantener una estructura unificada:
```json
{
  "success": true,
  "message": "Mensaje informativo",
  "data": {} // Objeto o array con la información de retorno (opcional)
}
```

### 1. Registro de Administrador y Onboarding
*   **Endpoint:** `POST /api/auth/register-admin`
*   **Request Body:**
    ```json
    {
      "razonSocial": "Lavandería Express UTN",
      "cuit": "20304567892",
      "nombre": "Esteban",
      "apellido": "Quito",
      "email": "esteban.quito@lavanderia.com",
      "password": "PasswordSegura123!"
    }
    ```
*   **Reglas de Validación (Validators):**
    *   `razonSocial`: Requerido.
    *   `cuit`: Requerido, numérico, exactamente 11 dígitos.
    *   `email`: Requerido, formato de correo válido.
    *   `password`: Requerido, mínimo 8 caracteres, al menos 1 letra y 1 número.
*   **Responses:**
    *   `201 Created` ➔ Aprovisionamiento correcto de base de datos y envío de código.
    *   `400 Bad Request` ➔ Errores de validación de datos de entrada.
    *   `409 Conflict` ➔ El email o CUIT ya se encuentran registrados.

---

### 2. Confirmación de Cuenta de Correo
*   **Endpoint:** `POST /api/auth/confirm-email`
*   **Request Body:**
    ```json
    {
      "email": "esteban.quito@lavanderia.com",
      "tokenConfirmacion": "148962"
    }
    ```
*   **Reglas de Validación:**
    *   `email`: Requerido, formato de correo válido.
    *   `tokenConfirmacion`: Requerido, cadena numérica de 6 dígitos.
*   **Responses:**
    *   `200 OK` ➔ Cuenta activada con éxito.
    *   `400 Bad Request` ➔ Token inválido, expirado o correo ya confirmado.
    *   `404 Not Found` ➔ Usuario inexistente.

---

### 3. Inicio de Sesión Local
*   **Endpoint:** `POST /api/auth/login`
*   **Request Body:**
    ```json
    {
      "email": "esteban.quito@lavanderia.com",
      "password": "PasswordSegura123!",
      "recaptchaToken": "03AFcWeA7..."
    }
    ```
*   **Reglas de Validación:**
    *   `email`: Requerido, formato de correo válido.
    *   `password`: Requerido.
*   **Responses:**
    *   `200 OK` ➔ Login exitoso. Retorna perfil del usuario y token JWT.
        ```json
        {
          "success": true,
          "message": "Autenticación exitosa",
          "data": {
            "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            "usuario": {
              "email": "esteban.quito@lavanderia.com",
              "nombre": "Esteban",
              "apellido": "Quito",
              "rol": "Administrador"
            }
          }
        }
        ```
    *   `401 Unauthorized` ➔ reCAPTCHA inválido o "Credenciales inválidas" (contraseña incorrecta o usuario inactivo).
    *   `403 Forbidden` ➔ Correo electrónico sin verificar (`emailConfirmado == false`) o suscripción del negocio suspendida.

---

### 4. Inicio de Sesión con Google OAuth
*   **Endpoint:** `POST /api/auth/google`
*   **Request Body:**
    ```json
    {
      "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjI5N..."
    }
    ```
*   **Reglas de Validación:**
    *   `idToken`: Requerido.
*   **Responses:**
    *   `200 OK` ➔ Validación del token de Google correcta, retorna JWT del sistema y perfil.
    *   `401 Unauthorized` ➔ Token de Google rechazado o cuenta inactiva.
    *   `404 Not Found` ➔ No existe cuenta local de lavandería vinculada al identificador de Google o al email del perfil.

---

### 5. Cambio de Contraseña (Sesión Activa)
*   **Endpoint:** `PATCH /api/auth/change-password`
*   **Headers:** `Authorization: Bearer <token>`
*   **Request Body:**
    ```json
    {
      "oldPassword": "PasswordSegura123!",
      "newPassword": "NuevaPassword456$"
    }
    ```
*   **Reglas de Validación:**
    *   `oldPassword`: Requerido.
    *   `newPassword`: Requerido, mínimo 8 caracteres, al menos 1 letra y 1 número.
*   **Responses:**
    *   `200 OK` ➔ Contraseña actualizada con éxito.
    *   `401 Unauthorized` ➔ No autenticado (token inválido o ausente).
    *   `403 Forbidden` ➔ Contraseña antigua incorrecta o cuenta Google sin password configurado.

---

## 4. Algoritmos de Negocio y Lógica en los Servicios

### A. Algoritmo de Onboarding y Aprovisionamiento (`registerAdmin`)

Este flujo se ejecuta dentro del servicio `auth.service.js` y debe estructurarse mediante control transaccional estricto:

```javascript
async function registerAdmin(data) {
    // 1. Iniciar transacción en la Base de Datos Central
    const transaction = await centralSequelize.transaction();
    try {
        // 2. Comprobar que no exista el email
        const existUser = await Usuario.findOne({ where: { email: data.email } });
        if (existUser) throw new AppError("EMAIL_ALREADY_IN_USE", 409);

        // 3. Comprobar que no exista el CUIT
        const existNegocio = await Negocio.findOne({ where: { cuit: data.cuit } });
        if (existNegocio) throw new AppError("CUIT_ALREADY_IN_USE", 409);

        // 4. Crear registro en la tabla Negocio
        const nuevoNegocio = await Negocio.create({
            razonSocial: data.razonSocial,
            cuit: data.cuit,
            facturacionHabilitada: false
        }, { transaction });

        // 5. Cifrar la contraseña local
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(data.password, salt);

        // 6. Crear el registro en Usuario (PK: email)
        const tokenConfirmacion = generarTokenConfirmacion(); // 6 digitos aleatorios
        const expiracion = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

        const nuevoUsuario = await Usuario.create({
            email: data.email,
            password: hash,
            tokenConfirmacion,
            tokenConfirmacionExpires: expiracion,
            emailConfirmado: false,
            activo: true
        }, { transaction });

        // 7. Consolidar transacción central
        await transaction.commit();

        // 8. Aprovisionamiento Físico del Tenant (fuera de la transacción central para evitar deadlocks)
        const tenantContext = await connectionManager.getTenantDb(nuevoNegocio.id, true);

        // 9. Siembra de Roles Estándar y Estados en el esquema del Tenant
        const rolAdmin = await Rol.findOne({ where: { nombre: "Administrador" } });
        // Asociar Rol al Usuario en la tabla central
        await nuevoUsuario.addRol(rolAdmin);

        // 10. Crear el primer Empleado (Legajo 1, Administrador) en el Tenant
        const nuevoEmpleado = await tenantContext.models.Empleado.create({
            legajo: 1,
            nombre: data.nombre,
            apellido: data.apellido,
            telefono: "",
            negocioId: nuevoNegocio.id
        });

        // 11. Vincular el Usuario central con el Empleado del tenant
        nuevoUsuario.empleadoId = nuevoEmpleado.id;
        await nuevoUsuario.save();

        // 12. Enviar correo electrónico con el código
        await emailService.enviarCodigoVerificacion(nuevoUsuario.email, data.nombre, tokenConfirmacion);

        return { success: true, message: "Onboarding completado con éxito." };
    } catch (error) {
        if (transaction.finished !== 'commit') await transaction.rollback();
        throw error;
    }
}
```

### B. Algoritmo de Login con Google OAuth (`loginWithGoogle`)

Resuelve la autenticación y la vinculación de identidad federada:

```javascript
async function loginWithGoogle(idToken) {
    // 1. Validar el token contra las APIs de Google
    const ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const googleId = payload['sub'];
    const email = payload['email'];

    // 2. Buscar usuario por googleId
    let usuario = await Usuario.findOne({ 
        where: { googleId },
        include: [{ model: Rol, as: 'roles' }]
    });

    // 3. Si no existe, intentar vincular por coincidencia de email verificado
    if (!usuario) {
        usuario = await Usuario.findOne({ 
            where: { email },
            include: [{ model: Rol, as: 'roles' }]
        });
        if (!usuario) {
            throw new AppError("GOOGLE_ACCOUNT_NOT_LINKED", 404);
        }
        // Vincular en caliente
        usuario.googleId = googleId;
        await usuario.save();
    }

    if (!usuario.activo) throw new AppError("USER_DISABLED", 401);

    // 4. Obtener información de Empleado y verificar Negocio
    const empleado = await connectionManager.getEmpleadoContext(usuario.empleadoId);
    const negocio = await Negocio.findByPk(empleado.negocioId);
    if (!negocio || !negocio.activo) {
        throw new AppError("BUSINESS_SUSPENDED", 403);
    }

    // 5. Registrar sesión activa en el tenant
    const tenantDb = await connectionManager.getTenantDb(negocio.id);
    await tenantDb.models.Sesion.create({
        fechaHoraInicio: new Date(),
        usuarioEmail: usuario.email
    });

    // 6. Firmar Token JWT del Sistema
    const appToken = jwt.sign(
        { 
            email: usuario.email, 
            negocioId: negocio.id, 
            empleadoId: empleado.id, 
            rol: usuario.roles[0]?.nombre 
        },
        process.env.JWT_SECRET,
        { expiresIn: "8h" }
    );

    return {
        token: appToken,
        usuario: {
            email: usuario.email,
            nombre: empleado.nombre,
            apellido: empleado.apellido,
            rol: usuario.roles[0]?.nombre
        }
    };
}
```

---

## 5. Middlewares y Filtros de Seguridad Involucrados

### `verificarToken` (`src/middlewares/auth/auth.middleware.js`)
Middleware encargado de interceptar todas las peticiones protegidas.
1.  Extrae el token del encabezado `Authorization: Bearer <token>`.
    *   *Excepción:* Si no lo provee, retorna `401 Unauthorized`.
2.  Valida la integridad del token usando `jwt.verify` y el secreto de entorno.
    *   *Excepción:* Si es inválido o ha expirado, retorna `401 Unauthorized` ("Token inválido o expirado").
3.  Injecta el objeto decodificado en el request: `req.user = decoded`.
4.  Llama a `next()` para proseguir.

### `autorizarRoles` (`src/middlewares/auth/role.middleware.js`)
Guarda de seguridad que actúa después del verificador de token.
*   **Firma:** `autorizarRoles(rolesPermitidos)` (ej: `autorizarRoles(["Administrador", "Cajero"])`).
*   **Operación:**
    1.  Toma el rol del usuario inyectado en la sesión (`req.user.rol`).
    2.  Verifica si `rolesPermitidos.includes(req.user.rol)`.
    3.  *Excepción:* Si el rol no coincide con ninguno, retorna `403 Forbidden` ("No posee permisos para realizar esta acción").

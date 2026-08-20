# Decisiones Técnicas y de Desarrollo (back2)

Este documento registra de forma cronológica y sistemática las decisiones arquitectónicas, de estructura, de librerías y de codificación adoptadas para el nuevo backend (`back2`) de la plataforma de lavandería SaaS.

---

## 1. Patrón Arquitectónico: Capas Modularizada (Feature-First)

**Decisión:** Se adopta una arquitectura organizada por **módulos/características de negocio** en lugar de capas puramente técnicas.

### Razón:
La arquitectura tradicional por capas técnicas (donde todos los controladores están en un directorio central, todos los servicios en otro, etc.) genera alta fricción al desarrollar y mantener funcionalidades concretas. Agrupar el código bajo dominios de negocio (ej: `auth`, `pedidos`, `finanzas`) concentra la cohesión, reduce el acoplamiento y facilita el trabajo paralelo.

### Reglas Estructurales:
1.  **Modelos Centralizados:** Todos los modelos Sequelize se mantienen en `src/models/` junto con `connectionManager.js`.
    *   *Razón:* Simplifica la carga centralizada, el aprovisionamiento dinámico de esquemas multi-tenant y evita dependencias cruzadas complejas entre módulos al definir asociaciones.
2.  **Módulos en `src/modules/`:** Cada carpeta bajo `src/modules/` representa un dominio funcional. Debe contener autónomamente:
    *   `controllers/`: Controladores HTTP para Express.
    *   `services/`: Lógica de negocio dura.
    *   `validators/`: Validaciones de payloads (`express-validator`).
    *   `*.routes.js`: Registro de endpoints del módulo.
3.  **Aislamiento de HTTP:**
    *   Los controladores **nunca** contienen lógica de negocio o queries directas de Sequelize. Extraen los datos del request y llaman a un servicio.
    *   Los servicios **nunca** reciben objetos de Express (`req`, `res`, `next`). Son funciones JS puras y reutilizables que lanzan excepciones `AppError` controladas.

---

## 2. Decisiones de Seguridad y Autenticación

Para asegurar la robustez de la API y proteger la información de los inquilinos (tenants), se heredan y estandarizan las siguientes tecnologías del sistema previo:

### Encriptación y Hashing
*   **Tecnología:** `bcryptjs` (con 10 rondas de salting).
*   **Uso:** Encriptación irreversible de contraseñas locales al registrar nuevos usuarios y durante el cambio de contraseña.
*   **Regla:** Nunca guardar contraseñas en texto plano ni usar algoritmos débiles (MD5, SHA1).

### Autenticación basada en Tokens (JWT)
*   **Tecnología:** `jsonwebtoken` (JWT).
*   **Uso:** Al iniciar sesión exitosamente (`/api/auth/login`), se emite un token JWT firmado con el secreto `JWT_SECRET`. El payload incluye el `email` del usuario, `rol`, `negocioId` (si posee) y `empleadoId`.
*   **Configuración:** Expiración corta (ej: 8 horas) para reducir la ventana de riesgo ante tokens comprometidos. El token se envía en el encabezado `Authorization` (`Bearer <token>`) o mediante cookies HttpOnly seguras según convenga al cliente.

### Proveedores de Identidad (Google OAuth)
*   **Tecnología:** `google-auth-library`.
*   **Uso:** Autenticación social federada. El frontend envía el `idToken` provisto por Google OAuth y el backend lo valida de forma segura del lado del servidor contra la API de Google, abstrayendo y validando el identificador único (`googleId`).

---

## 3. Seguridad de Red y Control de Tráfico

### Encabezados de Seguridad
*   **Tecnología:** `helmet`.
*   **Uso:** Middleware global que configura encabezados HTTP seguros (X-Content-Type-Options, X-Frame-Options, Content-Security-Policy, etc.) para mitigar ataques como Clickjacking y Cross-Site Scripting (XSS).

### Control de Tasa (Rate Limiting)
*   **Tecnología:** `express-rate-limit`.
*   **Uso:**
    1.  **Global Limiter:** Aplicado a toda la API bajo `/api/` para evitar ataques DDoS y abuso general (ej: máximo 1000 solicitudes por IP cada 15 minutos).
    2.  **Auth Limiter:** Aplicado específicamente a endpoints de autenticación y registro (`/api/auth/login`, `/api/auth/register-admin`, etc.) con un límite muy estricto (ej: máximo 25 intentos cada 15 minutos) para prevenir ataques de fuerza bruta.

### CORS Dinámico (Multi-Tenant y Micro-Frontends)
*   **Tecnología:** Middleware personalizado utilizando `cors`.
*   **Uso:** Dado que los micro-frontends de distintos negocios o subdominios pueden acceder a la API central, el middleware evalúa dinámicamente si el origen de la solicitud está dentro de la lista de orígenes permitidos (persistidos o configurados) del negocio correspondiente, en lugar de usar un origen comodín (`*`) que vulneraría la seguridad.

---

## 4. Integraciones con Servicios Externos

### Facturación Electrónica (AFIP)
*   **Tecnología:** `@afipsdk/afip.js`.
*   **Uso:** Conexión con los Web Services de la AFIP (Administración Federal de Ingresos Públicos) en Argentina para:
    *   Autorización de comprobantes electrónicos (facturas A, B, C).
    *   Generación y obtención del Código de Autorización Electrónico (CAE) y su fecha de vencimiento.
    *   Cálculo automático de IVA discriminado y base imponible según regulaciones vigentes.
*   **Gestión de Credenciales:** Las rutas a la llave privada y el certificado digital (`llaveAfipPath`, `certificadoAfipPath`) se configuran en el modelo `Negocio` y se cargan dinámicamente según el inquilino que esté facturando.

### Mensajería y Notificaciones por Correo
*   **Tecnología:** `nodemailer`.
*   **Uso:** Envío automatizado de correos electrónicos transaccionales:
    *   Envío de códigos de confirmación al registrar cuentas.
    *   Enlaces y tokens seguros para el restablecimiento de contraseñas.
*   **Transporte:** Configurado para usar proveedores SMTP estándar o servicios cloud (ej. SendGrid, Mailgun) mediante variables de entorno en producción.

---

## 5. Arquitectura de Middlewares Transversales

La arquitectura de Express se apoya en un pipeline de middlewares modulares aplicados de forma consistente:

```
Request ➔ Helmet ➔ Dynamic CORS ➔ Body Parser ➔ Rate Limiters ➔ Token Verifier ➔ Role Guard ➔ Route Handler ➔ Error Handler
```

1.  **Verificador de Token (`auth.middleware.js`):**
    *   Intercepta y valida el JWT en el encabezado `Authorization`.
    *   Inyecta el payload descifrado en `req.user`.
2.  **Guardia de Roles (`role.middleware.js`):**
    *   Middleware de autorización de grano fino que restringe endpoints a roles específicos (ej: `autorizarRoles(["ADMIN", "SUPERADMIN"])`).
3.  **Verificador de Suscripción (`subscription.middleware.js`):**
    *   Controla que el negocio/inquilino tenga su estado de suscripción activo (`activo == true` en `Negocio`) antes de procesar peticiones operativas.
4.  **Validador de Entrada (`validation.middleware.js`):**
    *   Integra `express-validator` para chequear el formato, obligatoriedad y sanitización de datos de entrada en caliente antes de ejecutar los controladores.
5.  **Manejador de Errores Centralizado (`error.middleware.js`):**
    *   Único receptor de excepciones mediante `next(error)`.
    *   Diferencia errores operativos (`AppError` con estado personalizado) de errores imprevistos del servidor (500), formateando la respuesta JSON de manera consistente y previniendo la fuga de stack traces en entornos de producción.

---

## 7. Modelo de Cobro Unificado por Pedido y Trazabilidad Contable Dual

**Decisión:** Se simplificó la arquitectura de cobranza del sistema acotando las transacciones a **1 único pedido por operación de cobro** (`POST /api/pagos`) y aplicando un patrón de **Trazabilidad Contable Dual Estricta**.

### Razón:
La sobre-lógica previa de cobros masivos (lotes de múltiples pedidos desde la Bottom Island de Pedidos o la ficha de Clientes) generaba ambigüedad en la distribución de vuelto en efectivo, asignaciones erróneas de Saldo a Favor a pedidos anteriores del lote y fricción en la UI. Al simplificar el flujo a 1 pedido a la vez:
1. Se elimina la ambigüedad en el cálculo de vuelto sobrante (`cashRecibidoReal - remanenteTotalEfectivo`).
2. Se garantiza la consistencia ACID en la base de datos sin bloqueos masivos multitabla.
3. Se unifican todas las vistas (`Pedidos`, `Clientes`, `POS`) bajo un único componente modal canónico: `CobrarPedidoSheet`.

### Reglas de Trazabilidad Contable Dual:
1. **Dinero Físico en Caja Chica (`MovimientoCaja`)**:
   * Se crea un registro en `MovimientoCaja` **únicamente si hubo dinero físico abonado** (`dineroIngresadoFisico > 0`).
   * Si un pedido se cancela 100% con Saldo a Favor (crédito) o se bonifica a $0,00, **no se genera registro en `MovimientoCaja`**. Esto evita sobrantes o desfasajes falsos en el arqueo físico al cerrar el turno.
2. **Créditos y Débitos en Cuenta Corriente (`MovimientoCuenta`)**:
   * Al consumir Saldo a Favor (`aplicarSaldoAFavor: true`), se crea atómicamente un `MovimientoCuenta` de tipo **Débito** (`"Aplicación de saldo a favor a pedido #X"`).
   * Al acreditar vuelto de efectivo abonado (`dejarVueltoAFavor: true`), se crea atómicamente un `MovimientoCuenta` de tipo **Crédito** (`"Vuelto a favor generado por pedido #X"`).
3. **Validación Preventiva deTurno de Caja Abierta**:
   * Tanto el backend (`pagos.service.js`) como la interfaz frontend (`CobrarPedidoSheet`) exigen la existencia de un turno de caja activo con `estadoCaja: "Abierta"`. De lo contrario, se rechaza la operación (`400 BAD_REQUEST`, `NO_OPEN_CASH_REGISTER`).


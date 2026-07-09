# Reglas de Negocio: Seguridad y Reportes

## 1. Seguridad General y Dependencias
- Se implementan múltiples capas de seguridad usando las dependencias estándar del proyecto:
  - **Helmet**: Para asegurar las cabeceras HTTP y proteger contra ataques comunes como XSS (Cross-Site Scripting) o Clickjacking.
  - **CORS (Cross-Origin Resource Sharing)**: Configurado estrictamente para permitir solicitudes únicamente desde los dominios/orígenes de los frontends autorizados.
  - **JWT (JSON Web Token)**: Para manejar sesiones sin estado (stateless) tras un inicio de sesión exitoso.

## 2. Prevención de Abusos (Rate Limiting)
- **Rate Limiter Global y Específico**: 
  - Se utiliza `express-rate-limit` para evitar ataques de denegación de servicio (DDoS) o scraping masivo ("consultas a lo burdo").
  - Existirá un limitador general para toda la API (ej: 100 peticiones cada 15 minutos por IP).
  - Existirá un limitador más estricto específicamente para rutas sensibles como `/api/auth/login` (ej: máximo 5 o 10 intentos fallidos por IP en 15 minutos) para mitigar ataques de fuerza bruta.

## 3. Registro y Verificación de Cuentas
- **Reglas de Contraseña**: 
  - Toda contraseña debe tener obligatoriamente un mínimo de **8 caracteres** y ser estrictamente **alfanumérica** (letras y números sin caracteres especiales). El sistema rechaza cualquier solicitud en el middleware `auth.validator.js` antes de procesarla.
- **Verificación por Email**: 
  - Al crearse una nueva cuenta de Usuario (o Negocio), la cuenta no estará 100% activa hasta que el usuario confirme su identidad.
  - El sistema enviará un correo electrónico con un token o enlace seguro. Una vez clicado, la cuenta cambiará a estado verificado/activo.

## 4. Inicio de Sesión Secundario (SSO)
- **Google OAuth**: 
  - Como alternativa al clásico "Usuario y Contraseña", el sistema soportará autenticación de terceros con Google.
  - Si un correo de Google coincide con un correo ya registrado en el sistema para ese Negocio, se vinculará la sesión automáticamente.

## 5. Manejo de Reportes
- **Dashboard y Estadísticas**: 
  - Los reportes financieros (ventas por día, métodos de pago más usados, productos más vendidos) son exclusivos para los usuarios con rol `admin`.
  - El backend calculará estos datos consultando los historiales y estados reales. **Importante**: Solo se sumarán a los ingresos aquellos Pedidos cuyos `PedidoItem` estén en estado `ACTIVO` (ignorando los cancelados) y cuyo Pedido general figure como `cobrado = true`.

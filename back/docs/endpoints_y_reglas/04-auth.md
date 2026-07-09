# Módulo: Autenticación (Auth)

## Descripción General
Este módulo gestiona el registro inicial de negocios, el inicio de sesión (Login tradicional y con Google), y la gestión de la cuenta (verificación de email, recuperación y cambio de contraseña).

## Roles Permitidos
- La mayoría de los endpoints son públicos (no requieren token) ya que son para acceder al sistema.
- Los endpoints bajo `/me` y `/google/link` / `/google/unlink` requieren que el usuario tenga un token válido.

## Endpoints (Requerimientos Funcionales)

### 1. Registro de Administrador y Negocio
- **Ruta y Método**: `POST /api/auth/register`
- **Acción**: Crea un nuevo `Negocio` (estado de suscripción: `PRUEBA`), crea el usuario `ADMIN` asociado y envía un correo con un código de verificación. También sincroniza la base de datos del negocio (Tenant DB) y crea un método de pago por defecto ("Efectivo").
- **Validaciones**: 
  - `negocioNombre`, `usuarioNombre`, `email`, `password` son obligatorios.
  - El email no debe estar en uso en todo el sistema central.
- **Cuerpo (Payload) Esperado**:
  ```json
  {
    "negocioNombre": "Lavandería Burbujas",
    "usuarioNombre": "Juan Pérez",
    "email": "juan@burbujas.com",
    "password": "Password123!"
  }
  ```

### 2. Iniciar Sesión (Login Local)
- **Ruta y Método**: `POST /api/auth/login`
- **Acción**: Autentica al usuario y devuelve un token JWT válido por 8 horas.
- **Validaciones**: `email` y `password` requeridos.
- **Reglas de Negocio**:
  - El usuario debe estar activo (`activo: true`).
  - El email debe estar verificado (`emailVerificado: true`).
  - Falla si la cuenta fue creada exclusivamente mediante Google y no tiene contraseña (`passwordHash` nulo).

### 3. Verificar Email
- **Ruta y Método**: `POST /api/auth/verify-email`
- **Acción**: Verifica la dirección de correo electrónico de una cuenta recién creada.
- **Validaciones**: `email` y `code` requeridos.
- **Reglas de Negocio**: El código no debe haber expirado (dura 24 horas) y debe coincidir con el almacenado.

### 4. Reenviar Código de Verificación
- **Ruta y Método**: `POST /api/auth/resend-verification`
- **Acción**: Genera un nuevo código de verificación y lo reenvía al correo del usuario.
- **Validaciones**: `email` requerido.
- **Reglas de Negocio**: Falla si el correo ya está verificado o si el usuario no existe. Le da 24h de validez al nuevo código.

### 4. Recuperación de Contraseña
- **Ruta y Método**: `POST /api/auth/forgot-password`
- **Acción**: Genera un token de recuperación y lo envía por correo electrónico.
- **Reglas de Negocio**: Por seguridad, devuelve un mensaje de éxito genérico siempre, independientemente de si el correo existe o no en el sistema. El token expira en 1 hora.

### 5. Restablecer Contraseña
- **Ruta y Método**: `POST /api/auth/reset-password`
- **Acción**: Establece una nueva contraseña utilizando el token enviado por correo.
- **Validaciones**: `token` y `newPassword` requeridos.
- **Reglas de Negocio**: Si la cuenta no estaba verificada, este proceso la marca automáticamente como verificada (ya que se demostró la propiedad del correo).

### 6. Obtener Mis Datos
- **Ruta y Método**: `GET /api/auth/me`
- **Acción**: Devuelve la información del usuario autenticado (extraída del token JWT).
- **Validaciones**: Requiere token válido.

### 7. Cambiar Contraseña (Usuario Logueado)
- **Ruta y Método**: `POST /api/auth/me/change-password`
- **Acción**: Permite a un usuario logueado cambiar su contraseña actual.
- **Validaciones**: `oldPassword` y `newPassword` requeridos. Requiere token.
- **Reglas de Negocio**: Falla si la cuenta es exclusiva de Google, o si `oldPassword` es incorrecta.

### 8. Integración con Google
- **POST /api/auth/google**: Inicia sesión o registra un usuario usando el token de Google.
- **POST /api/auth/google/link**: Vincula una cuenta de Google a un usuario local ya logueado.
- **POST /api/auth/google/unlink**: Desvincula la cuenta de Google de un usuario local.

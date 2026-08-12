# Especificación de Requerimientos y Diseño: Módulo de Inicio de Sesión (Login), Confirmación y Vinculación

**Estándar de Documentación de Cátedra (UTN FRC)**  
**Proyecto:** SaaS Lavandería Multi-Negocio  
**Módulo:** Seguridad, Autenticación y Perfiles  

---

## 1. Arquitectura y Patrones de Diseño Recomendados

### Estilo Arquitectónico: Arquitectura en Capas (Layered Architecture)
El subsistema de seguridad se estructurará siguiendo el patrón **Layered (En Capas)** para asegurar la mantenibilidad y modularidad:
*   **Capa de Presentación («boundary»)**: Vistas de Login, Registro de Cuenta, Verificación de Email y Subvista de Perfil del Usuario.
*   **Capa de Control/Servicios («control»)**: Controladores de Autenticación, Gestión de Tokens JWT y Servicios de Correo Electrónico.
*   **Capa de Dominio/Entidades («entity»)**: Modelos Sequelize (`Usuario`, `Empleado`, `Rol`, `Sesion`).

### Patrones de Diseño (GoF) Claves Aplicados al Módulo 2
*   **Patrón Observer (Observador)**: Resuelve el envío automático de notificaciones de seguridad. Por ejemplo, al registrarse un nuevo negocio, el `Usuario` (Sujeto) notifica a los observadores registrados (ej. `ServicioCorreoConfirmacion`), disparando de forma síncrona o asíncrona la generación del token y el envío del correo de confirmación.

---

## 2. Enunciación de Casos de Uso y Actores del Módulo 2

*Nomenclatura formal de la UTN FRC: Verbo en Infinitivo + Objeto.*

### Jerarquía de Actores
*   **Usuario** (Actor Abstracto).
    *   **Empleado** (Actor Físico, especialización de Usuario).
        *   **Administrador** (Especialización de Empleado).
*   **Autenticador Externo Google** (Actor Secundario / Sistema Externo).
*   **Servidor de Correo** (Actor Secundario / Sistema Externo).

### Casos de Uso del Módulo 2
*   **CU-05: Iniciar Sesión** (AP: Usuario, AS: Autenticador Externo Google)
*   **CU-06: Cerrar Sesión** (AP: Usuario)
*   **CU-07: Caducar Sesión** (AP: Sistema/Tiempo)
*   **CU-08: Confirmar Cuenta de Usuario** (AP: Usuario, AS: Servidor de Correo)
*   **CU-09: Vincular Cuenta de Google** (AP: Usuario, AS: Autenticador Externo Google)
*   **CU-10: Registrar Empleado** (AP: Administrador de Lavandería)
*   **CU-11: Modificar Empleado** (AP: Administrador de Lavandería)
*   **CU-12: Consultar Empleado** (AP: Administrador de Lavandería)
*   **CU-13: Eliminar Empleado (Baja Lógica)** (AP: Administrador de Lavandería)

---

## 3. Especificación del Front-End (Vistas, Subvistas y Flujos)

Esta sección describe el comportamiento, interfaz y usabilidad (UI/UX) de las interfaces de usuario que forman parte del subsistema de seguridad y acceso.

### 1. Pantalla de Login Local y Google OAuth
Permite el ingreso al portal administrativo y operativo mediante credenciales locales o vinculación con proveedores de identidad externos.

*   **Layout y Estética Visual:**
    *   Diseño responsivo centrado con un contenedor limpio con efecto glassmorphism.
    *   **Dinámica de Marca (Multi-Tenant):** Si la URL o el subdominio identifica al tenant (ej: `lavanderia-burbujas.saas.com`), la interfaz recuperará y aplicará de forma dinámica el `logoUrl`, `colorPrincipal` (para botones y enlaces de acento) y `colorSecundario` desde el modelo `Negocio` configurado en el backend.
*   **Entrada de Datos:**
    *   `email`: Campo de texto de tipo correo electrónico. Requerido.
    *   `password`: Campo de contraseña con opción para alternar visibilidad (icono de ojo). Requerido.
    *   `reCAPTCHA`: Widget invisible o de checkbox de Google reCAPTCHA v2/v3 para validación humana.
*   **Acciones:**
    *   Botón **"Iniciar Sesión"** (Primario): Dispara la autenticación local (POST `/api/auth/login`).
    *   Botón **"Iniciar con Google"** (Secundario, branding oficial de Google): Inicia el flujo OAuth 2.0 (envía token al endpoint POST `/api/auth/google`).
*   **Enlaces de Navegación:**
    *   "Registrar Cuenta de Negocio" (Redirige a la pantalla de onboarding del SaaS).
    *   "Olvidé mi contraseña" (Abre flujo de recuperación).
*   **Heurísticas de Nielsen Aplicadas:**
    *   *Visibilidad del Estado del Sistema (H-1):* Durante el envío de datos, los botones de acción se deshabilitan y muestran un spinner de carga.
    *   *Prevención de Errores (H-5):* Validación de formato de correo en caliente en el cliente antes de habilitar el botón de envío.

---

### 2. Pantalla de Registro de Empleado/Negocio (Token de Confirmación)
Resuelve el alta de nuevos negocios, la creación física de su base de datos aislada (Onboarding) y el flujo de verificación de correo electrónico.

*   **Flujo A: Registro de Cuenta de Negocio (SaaS Onboarding)**
    *   *Entrada de Datos:* Razón Social (Nombre del negocio), CUIT (11 dígitos), Nombre del Administrador, Apellido, Email, Password y Confirmación de Password.
    *   *Validaciones en Front:* Contraseñas idénticas y formato de correo electrónico válido.
    *   *Acción:* Botón "Registrar Negocio" (POST `/api/auth/register-admin`). Redirige automáticamente al Flujo B.
*   **Flujo B: Pantalla de "Validar Email"**
    *   *Layout:* Tarjeta con ilustración minimalista informando el envío de un código numérico al correo provisto.
    *   *Entrada de Datos:* Campo de texto formateado con 6 inputs individuales para el ingreso del código de confirmación (`tokenConfirmacion`).
    *   *Acción:* Botón "Confirmar Cuenta" (POST `/api/auth/confirm-email`).
*   **Heurísticas de Nielsen Aplicadas:**
    *   *Prevención de Errores (H-5):* Validación de formato de CUIT en caliente en el cliente.
    *   *Ayuda y Documentación (H-10):* Enlace para reenviar el código después de 60 segundos con un timer visible.

---

### 3. Subvista de Perfil de Usuario (Dentro de Portales de Trabajo)
Sección privada dentro de los dashboards de Administración y Empleados para gestionar sus propios datos de acceso.

*   **Vistas e Interacción:**
    *   **Cambio de Contraseña Local:** 
      * *Entradas:* Contraseña actual, Contraseña nueva, Confirmar contraseña nueva.
      * *Acción:* Botón "Actualizar Contraseña" (PATCH `/api/usuarios/change-password`).
    *   **Vinculación OAuth:**
      * *Layout:* Panel de estado de vinculación externa.
      * *Componente:* Muestra un switch o botón "Vincular Cuenta de Google". Si el `googleId` ya está registrado, el botón cambia su estado a "Cuenta Vinculada" (con icono de verificación verde).
      * *Acción:* Invoca el popup de autenticación de Google y envía el idToken al backend (POST `/api/usuarios/link-google`) para actualizar el registro `googleId` del usuario activo en caliente.

---

## 4. Reglas de Negocio y Flujo del Back-End (Contrato de Datos)

Esta sección define las validaciones duras a nivel del servidor de aplicaciones y las estructuras de datos JSON para la comunicación HTTP.

### 1. Reglas de Negocio Clave
1.  **Seguridad y Ofuscación de Mensajes:** Si las credenciales locales son inválidas, o si el usuario existe pero tiene el flag `activo == false`, el servidor responderá **siempre** con un error genérico `401 Unauthorized` y el mensaje `"Credenciales inválidas"`. Esto previene ataques de enumeración de nombres de usuario.
2.  **Autenticación Local Segura:** La contraseña provista por el frontend debe validarse contra el hash almacenado en la base de datos (utilizando `bcrypt` con un mínimo de 10 rounds de salting).
3.  **Seguridad en el Flujo de Google OAuth:** El frontend enviará el `idToken` provisto por Google. El backend **debe** verificar este token usando la librería oficial `google-auth-library` contra los servidores de Google para validar la firma y extraer el identificador único (`sub` o `googleId`). Se prohíbe confiar en el ID enviado directamente por el cliente.
4.  **Auditoría de Sesiones:** Ante cada inicio de sesión correcto, el backend instanciará una nueva fila en el modelo `Sesion`, registrando `fechaHoraInicio = NOW()`, asociándolo al email del usuario, y devolviendo un JWT firmado con expiración corta (ej: 2 horas).
5.  **Aprovisionamiento Automático de Tenant (Neon DB):** Al procesar el registro del negocio, el backend central (`public` schema) debe:
    * Validar que el CUIT y el email no existan.
    * Registrar el nuevo negocio en la tabla central `Negocio` obteniendo su `id` incremental (PK).
    * Crear físicamente el nuevo schema en Neon: `CREATE SCHEMA tenant_{id};` (ej: `tenant_4`).
    * Correr las migraciones DDL estructurales para inicializar las tablas de negocio en el nuevo esquema.
    * Sembrar (Seed) registros obligatorios en el esquema del tenant: Estados estándar en `Estado`, métodos de pago base en `MetodoPago` y los Roles de sistema.
    * Insertar el primer `Empleado` y `Usuario` (Administrador) dentro del esquema del tenant recién aprovisionado.

---

### 2. Contratos de Datos (JSON Payloads)

#### A. Login Local
*   **Request (POST `/api/auth/login`):**
    ```json
    {
      "email": "juan.perez@lavanderia.com",
      "password": "PasswordSegura123$",
      "recaptchaToken": "03AFcWeA7... (token del widget)"
    }
    ```
*   **Response Exitoso (200 OK):**
    ```json
    {
      "success": true,
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "usuario": {
        "email": "juan.perez@lavanderia.com",
        "rol": "Administrador",
        "nombre": "Juan",
        "apellido": "Perez"
      }
    }
    ```

#### B. Registro de Negocio y Aprovisionamiento
*   **Request (POST `/api/auth/register-admin`):**
    ```json
    {
      "razonSocial": "Lavandería Súper Limpio",
      "cuit": "20304567892",
      "nombre": "Juan",
      "apellido": "Perez",
      "email": "contacto@superlimpio.com",
      "password": "PasswordSegura123!"
    }
    ```
*   **Response Exitoso (201 Created):**
    ```json
    {
      "success": true,
      "message": "Registro completado y base de datos de lavandería aprovisionada con éxito. Se ha enviado un correo de verificación."
    }
    ```
*   **Response Error - Email Duplicado (HTTP 409 Conflict):**
    ```json
    {
      "success": false,
      "error": "EMAIL_ALREADY_IN_USE",
      "message": "La dirección de correo electrónico ya está asociada a otra cuenta en el sistema."
    }
    ```

#### C. Confirmación de Email (Token)
*   **Request (POST `/api/auth/confirm-email`):**
    ```json
    {
      "email": "juan.perez@lavanderia.com",
      "tokenConfirmacion": "148962"
    }
    ```
*   **Response Exitoso (200 OK):**
    ```json
    {
      "success": true,
      "message": "Cuenta verificada exitosamente. Ya puede iniciar sesión."
    }
    ```

---

## 5. Plantilla UTN de Caso de Uso Esencial (Trazo Medio)

A continuación, se detalla la especificación del caso de uso principal del módulo de acuerdo con las pautas formales de la UTN FRC.

### Caso de Uso: Iniciar Sesión

*   **ID:** CU-05.
*   **Actores:**
    *   **Usuario (Abstracto):** Representa a cualquier operador que desea ingresar (Admin, Empleado).
    *   **reCAPTCHA Google (Secundario):** Servicio externo de validación de tráfico humano.
    *   **Autenticador Google (Secundario):** Servidor OAuth para la validación del token de Google.
*   **Precondiciones:**
    *   El usuario dispone de conexión a internet.
    *   El navegador es compatible con las tecnologías web y SSL del servidor.

#### Flujo Básico (Camino Feliz):
1.  El Usuario ingresa a la URL del portal de acceso.
2.  El Sistema recupera el identificador de la URL y aplica el branding personalizado del negocio (logo y colores institucionales).
3.  El Usuario introduce su `email` y `password` local, y hace clic en "Iniciar Sesión".
4.  El Sistema invoca de forma invisible el reCAPTCHA de Google.
5.  El reCAPTCHA analiza el comportamiento y retorna un token de validación correcto.
6.  El Sistema transmite el payload (email, contraseña, recaptchaToken) al servidor.
7.  El Servidor del backend valida el token de reCAPTCHA, verifica la existencia del email y su estado activo (`activo == true`), contrasta la contraseña encriptada (mediante bcrypt) y constata que el mail está verificado (`emailConfirmado == true`).
8.  El Servidor crea un registro `Sesion` en la base de datos, marcando la `fechaHoraInicio` con la hora del sistema y asociando el registro al `Usuario`.
9.  El Servidor genera un token JWT firmado y lo devuelve en el payload de respuesta.
10. El Sistema del Front-End guarda el token en el almacenamiento local seguro y redirige al Usuario al dashboard correspondiente según su rol asignado.

#### Flujos Alternativos:

*   **A1: El reCAPTCHA detecta comportamiento sospechoso o bot (Paso 5)**
    1. El reCAPTCHA de Google retorna una puntuación baja (sospecha de bot).
    2. El Sistema bloquea la petición al servidor y muestra un mensaje de alerta en pantalla: *"Validación humana fallida. Inténtelo nuevamente."*
    3. El caso de uso finaliza sin autenticar.

*   **A2: Usuario inactivo lógico (Paso 7)**
    1. El Servidor detecta que el registro del usuario tiene el campo `activo == false`.
    2. El Servidor responde con un código `401 Unauthorized` y el mensaje `"Credenciales inválidas"`.
    3. El Sistema en el cliente muestra la alerta de error.
    4. El caso de uso finaliza.

*   **A3: Contraseña o Email incorrecto (Paso 7)**
    1. El Servidor detecta que el email no existe o la contraseña introducida no coincide con el hash almacenado.
    2. El Servidor responde con un código `401 Unauthorized` y el mensaje `"Credenciales inválidas"`.
    3. El Sistema en el cliente muestra la alerta de error.
    4. El caso de uso finaliza.

*   **A4: Inicio de sesión con cuenta de Google no vinculada previamente (Paso 3)**
    1. El Usuario hace clic en el botón "Iniciar con Google".
    2. El Sistema despliega el popup oficial de autenticación de Google.
    3. El Usuario introduce sus datos y Google OAuth retorna un `idToken` válido.
    4. El Sistema envía el `idToken` al servidor.
    5. El Servidor valida el token contra Google API y recupera el `googleId`.
    6. El Servidor busca en la base de datos y constata que no existe ningún `Usuario` registrado con ese `googleId`.
    7. El Servidor rechaza la petición con un error `404 Not Found` informando: *"Este perfil de Google no está asociado a ningún usuario registrado."*
    8. El Sistema muestra el error y le ofrece un enlace para iniciar de forma local y vincularlo en su perfil.
    9. El caso de uso finaliza.

*   **A5: Cuenta sin verificar por correo (Paso 7)**
    1. El Servidor detecta que el usuario está registrado, pero su atributo `emailConfirmado == false`.
    2. El Servidor rechaza el login y responde con un código `403 Forbidden` informando: *"Debe verificar su correo antes de iniciar sesión."*
    3. El Sistema redirige automáticamente al usuario a la pantalla de "Validar Email" del registro para que complete su token de confirmación.
    4. El caso de uso finaliza.

*   **Postcondiciones:**
    *   Sesión física iniciada y persistida en base de datos (`Sesion` creada).
    *   Token JWT firmado devuelto al cliente y almacenado localmente para autorizar peticiones subsiguientes.

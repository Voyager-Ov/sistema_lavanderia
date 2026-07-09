# Módulo: Configuración del Negocio (Ajustes, AFIP y WhatsApp)

## Descripción General
Este módulo permite gestionar las preferencias y la integración de servicios de terceros para un negocio específico. Aquí se guarda la configuración general (logos, colores), las credenciales de facturación electrónica (AFIP) y la conexión de la API de WhatsApp.

## Roles Permitidos
- Exclusivo para el dueño del negocio (**ADMIN**) o el **SUPERADMIN**.
- Requiere autenticación y suscripción activa.

## Endpoints (Requerimientos Funcionales)

### 1. Obtener Configuración General
- **Ruta y Método**: `GET /api/configuracion`
- **Acción**: Retorna el registro `ConfiguracionNegocio` asociado al negocio. Si no existe, lo crea internamente con los valores por defecto y lo devuelve.

### 2. Actualizar Configuración General
- **Ruta y Método**: `PATCH /api/configuracion`
- **Acción**: Actualiza configuraciones generales como `logoUrl`, colores, etc. Si el registro no existía, lo crea aplicando la actualización.

---

## Integración AFIP (Facturación Electrónica)

### 3. Subir Certificados AFIP
- **Ruta y Método**: `POST /api/configuracion/afip/certificados`
- **Acción**: Sube y almacena los archivos `.crt` y `.key` necesarios para facturar a través de la AFIP en Argentina.
- **Validaciones**: Se espera un `multipart/form-data` con los campos `certificado` y `llavePrivada`.
- **Reglas de Negocio (Seguridad)**:
  - El backend lee los buffers de memoria de los archivos.
  - La **llave privada** se encripta de forma segura antes de ser guardada en la base de datos (utilizando `crypto.util.js`).
  - Al retornar la configuración actualizada, **la llave privada es eliminada de la respuesta JSON** por motivos de seguridad; nunca se envía de vuelta al cliente.

---

## Integración WhatsApp

### 4. Obtener Estado de WhatsApp
- **Ruta y Método**: `GET /api/configuracion/whatsapp/status`
- **Acción**: Consulta al servicio de integración (o base de datos) para saber si la sesión de WhatsApp del negocio está activa, conectada o requiere escaneo de QR.

### 5. Conectar WhatsApp
- **Ruta y Método**: `POST /api/configuracion/whatsapp/conectar`
- **Acción**: Marca la bandera `whatsappActivo: true` en la configuración del negocio e invoca el inicio del servicio de vinculación (ej. inicializa el cliente de WwebJS).

### 6. Desconectar WhatsApp
- **Ruta y Método**: `POST /api/configuracion/whatsapp/desconectar`
- **Acción**: Marca la bandera `whatsappActivo: false` y cierra la sesión del cliente asociado.

### 7. Actualizar Plantilla de Mensaje
- **Ruta y Método**: `PATCH /api/configuracion/whatsapp/mensaje`
- **Acción**: Actualiza el texto automático que se enviará a los clientes cuando un pedido cambie a estado `LISTO_PARA_RETIRAR`.
- **Validaciones**:
  - `mensaje`: Obligatorio. **Debe contener obligatoriamente la variable `{{nombre}}`** para asegurar la personalización del mensaje.

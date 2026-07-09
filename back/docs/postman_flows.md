# Flujos de Prueba para Postman

Este documento sirve de guía para probar la API actual (Autenticación y Modelos Base) utilizando Postman.

## 1. Registro de Admin (Creación de Tenant)
**Propósito**: Crea el Negocio, el MetodoPago "Efectivo", y el primer usuario Admin.
- **Ruta**: `POST http://localhost:3000/api/auth/register`
- **Body (JSON)**:
```json
{
  "negocioNombre": "Lavandería Burbujas",
  "usuarioNombre": "Juan Dueño",
  "email": "juan@burbujas.com",
  "password": "Password123"
}
```
*Atención: La contraseña debe ser alfanumérica y de min 8 caracteres.*
- **Respuesta Esperada**: Status 201. Retorna el token JWT y los datos del admin.

---

## 2. Inicio de Sesión (Login)
**Propósito**: Obtener el token JWT de un usuario existente.
- **Ruta**: `POST http://localhost:3000/api/auth/login`
- **Body (JSON)**:
```json
{
  "email": "juan@burbujas.com",
  "password": "Password123"
}
```
- **Respuesta Esperada**: Status 200. Retorna el token JWT. **Copia el token devuelto para los siguientes pasos.**

---

## 3. Configuración de Postman para Rutas Protegidas
Para todos los endpoints a continuación, debes ir a la pestaña **Authorization** en Postman, seleccionar **Bearer Token** y pegar el token obtenido en el paso 2.

---

## 4. Consultar Mi Perfil
**Propósito**: Probar que el JWT y el middleware `verificarToken` funcionan.
## 3. Obtener Mi Perfil (Refrescar App)
- **URL**: `GET http://localhost:3000/api/usuarios/me` *(O el ID tuyo)*
- **Headers**: 
  `Authorization: Bearer <TU_TOKEN_JWT>`
- **Explicación**: El frontend lo usa para reconstruir tu sesión al recargar la página F5.

## 4. Gestión de Usuarios (Empleados)
- **Crear Empleado (Solo Admin)**: `POST http://localhost:3000/api/usuarios`
- **Listar Empleados**: `GET http://localhost:3000/api/usuarios`
- **Desactivar Empleado**: `PATCH http://localhost:3000/api/usuarios/:id/estado`
  - *Body*: `{ "motivoBaja": "Renunció" }`

## 5. Gestión de Clientes
- **Crear Cliente**: `POST http://localhost:3000/api/clientes`
  - *Body*: `{ "nombre": "Marta", "telefono": "351000111", "email": "marta@mail.com" }`
- **Actualizar Cliente**: `PUT http://localhost:3000/api/clientes/:id`
- **Soft Delete Cliente**: `PATCH http://localhost:3000/api/clientes/:id/estado`
  - *Body*: `{ "motivoBaja": "Falso contacto" }`

## 6. Portal de Tracking (Público)
- **URL**: `GET http://localhost:3000/api/tracking/LAV-TEST1`
- **Explicación**: Endpoint abierto (No necesita JWT). El cliente lo visita desde un celular para ver su pedido en tiempo real.

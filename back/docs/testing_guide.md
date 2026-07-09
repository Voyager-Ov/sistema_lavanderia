# Guía de Testing del Backend

El backend implementa una batería de pruebas automatizadas utilizando **Jest** y **Supertest**.
Las pruebas no solo verifican el "Camino Feliz" (Happy Path), sino que estresan intensivamente los casos de borde, los errores de validación, y las barreras de seguridad.

## 1. Configuración del Entorno de Pruebas
- Se utilizan bases de datos en memoria (SQLite) para asegurar que cada corrida de pruebas sea inmutable y no ensucie la base de datos de desarrollo.
- Se hace un `sequelize.sync({ force: true })` en cada `beforeAll()` para empezar desde cero.

## 2. Cobertura Actual

### 2.1 Autenticación (`auth.test.js`)
- **Seguridad de Registro**: Asegura que se rechacen contraseñas cortas o que contengan caracteres especiales (Regla de oro: 8+ caracteres, alfanuméricas).
- **Control de Duplicados**: Evita registros con emails ya existentes.
- **Seguridad en Salida**: Confirma que jamás se exponga el `passwordHash` en el payload JSON.
- **Flujo JWT**: Valida la creación exitosa del token y su formato correcto.

### 2.2 Usuarios / Empleados (`usuarios.test.js`)
- **Control de Acceso (RBAC)**: Comprueba estrictamente que un Empleado NO pueda golpear endpoints de `POST /api/usuarios` ni `PATCH /api/usuarios/:id/estado`. Si lo intenta, verifica que el sistema devuelva el `403 Forbidden`.
- **Aislamiento Horizontal**: Comprueba que un Empleado reciba un `403` al intentar consultar el `id` de otro Empleado diferente al suyo.
- **Protección de Rutas**: Valida que sin mandar un JWT (Header `Authorization`) se retorne un `401 Unauthorized`.

### 2.3 Clientes (`clientes.test.js`)
- **Validaciones Rigurosas**: Intenta romper el sistema enviando clientes sin campos obligatorios (Ej: sin teléfono) verificando la intercepción del Middleware (Error `400`).
- **Lógica de Negocio**: Simula insertar un teléfono duplicado en el mismo negocio y verifica el rechazo con un `400`.
- **Soft Delete Obligatorio**: Intenta dar de baja un cliente enviando un payload vacío, forzando a que el validador exija el `motivoBaja`. Luego confirma que al enviar el motivo, el campo `activo` pasa a `false`.

## 3. ¿Cómo ejecutar?
Basta con abrir la terminal en la carpeta `/back` y correr:
```bash
npm test
```

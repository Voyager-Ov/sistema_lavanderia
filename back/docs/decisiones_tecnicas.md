# Decisiones Técnicas del Backend (Lavandería SaaS)

Este documento centraliza el "por qué" de las decisiones arquitectónicas tomadas para el proyecto.

## 1. Patrón Arquitectónico: MVC Expandido
Se eligió la estructura **Controlador-Servicio-Modelo** (basada en tu Trabajo Práctico) en lugar del clásico Prisma/Next.js "todo en uno" por las siguientes razones:
- **Responsabilidad Única**: Los Controladores solo manejan request/response HTTP. Los Servicios contienen toda la lógica de negocio pura. Los Modelos se limitan a la definición de la base de datos.
- **Validaciones Aisladas**: Uso de `express-validator` en una carpeta separada (`src/validators`) y un middleware para centralizar el retorno de errores (status 400).

## 2. Multi-tenancy: Aislamiento a Nivel Lógico (Row-level)
- **Decisión**: Se utiliza una única base de datos donde cada tabla tiene la columna `negocioId`.
- **Razón**: Permite escalar a cientos de clientes de forma inmediata sin tener que crear una base de datos nueva por cada uno ni correr migraciones múltiples.
- **Seguridad**: El `negocioId` se extrae criptográficamente del token JWT en cada request. Los Controladores jamás toman el `negocioId` del `req.body`, garantizando que un cliente no pueda inyectar datos en otro negocio.

## 3. Aislamiento Fuerte por Tenant (SaaS Multi-Tenant)
- Cada consulta en el sistema inyecta **automáticamente** `where: { negocioId: req.user.negocioId }` del token desencriptado. 
- *Decisión técnica*: **Jamás** se debe confiar en un `negocioId` enviado por el Frontend en el `req.body`. El Frontend podría ser interceptado o modificado, causando que un empleado manipule pedidos de otra lavandería.

## 4. Arquitectura Basada en Features
A medida que el backend creció, se abandonó la arquitectura "Flat" (donde todos los archivos estaban sueltos en `src/controllers/`) por una estructura modular basada en Features (dominios).
- *Decisión técnica*: Carpetas como `src/controllers/usuarios/`, `src/routes/clientes/`. Esto facilita la lectura del código, la mantenibilidad a largo plazo y acopla conceptualmente cada archivo a su entidad padre.

## 5. Estrategia Robusta de Testing
- *Decisión técnica*: Para asegurar la estabilidad, se adoptó **Jest + Supertest**. Las pruebas no solo validan el "Camino Feliz", sino que estresan la seguridad: intentan acceder con tokens falsos, intentan violar los permisos (RBAC) y prueban el envío de estructuras inválidas para asegurar que el Middleware devuelve un HTTP 400 o 403 según corresponda. Todo esto corriendo en una base de datos SQLite en memoria (aislada del entorno de desarrollo real).

## 6. Máquina de Estados de Pedidos en Base de Datos
- **Decisión**: En lugar de sobreescribir el campo `estado`, se usa el modelo `HistorialPedido`.
- **Razón**: Provee trazabilidad total. Si hay una disputa de cobro o de tiempo de entrega, se puede auditar exactamente quién y a qué hora pasó el pedido de PENDIENTE a ENTREGADO.

## 7. Middleware de Suscripción (Anti-Abuso)
- **Decisión**: El middleware `subscription.middleware.js` hace una query viva (`findByPk`) a la DB antes de procesar llamadas clave.
- **Razón**: Si se corta el servicio por falta de pago, la API bloquea automáticamente el consumo de cómputo, respondiendo `402 Payment Required`.

## 5. Base de Datos ORM: Sequelize + SQLite (Migrable a Postgres)
- **Decisión**: Uso de Sequelize para modelado.
- **Razón**: Flexibilidad total en migraciones y consultas complejas. Además, al usar la abstracción pura de Sequelize, pasar de SQLite a PostgreSQL en el despliegue final requerirá cambiar solo 1 línea en la configuración.

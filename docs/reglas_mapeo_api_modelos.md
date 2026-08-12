# Reglas de Mapeo y Consistencia entre API y Modelos de Base de Datos

Para garantizar que el desarrollo de los controladores y servicios del backend sea fluido y libre de errores de inconsistencia, establecemos las siguientes **reglas de oro de diseño técnico** para todos los módulos de la plataforma:

---

## 1. Reglas Generales de Consistencia
1.  **Nombres de Atributos**: Los campos en los Payloads JSON (Requests y Responses) deben coincidir exactamente con los nombres de las propiedades definidas en los modelos de Sequelize.
    *   *Ejemplo*: Si la base de datos define `razonSocial` en `Negocio`, el payload debe usar `"razonSocial"` (evitar `"negocioNombre"` o `"razon_social"`).
2.  **Mapeo de Entidades Compuestas**: En endpoints que crean múltiples registros lógicamente vinculados (como el Registro de Negocio, que crea un `Negocio`, un `Empleado` y un `Usuario`), el payload debe estructurarse usando las propiedades planas de cada modelo destino:
    *   `razonSocial`, `cuit` $\rightarrow$ `Negocio`
    *   `nombre`, `apellido` $\rightarrow$ `Empleado`
    *   `email`, `password` $\rightarrow$ `Usuario`
3.  **Mapeo de Claves Primarias (PK)**:
    *   `Negocio` utiliza `id` (PK secuencial). En los contratos de API se retornará `"idNegocio"` o `"id"` de forma consistente (se prefiere `"id"` para coincidir con Sequelize).
    *   `Usuario` utiliza `email` como PK física. Por ende, los payloads de login y sesión referencian al `"email"`.
    *   `Pedido` utiliza `numeroPedido` como PK física. Los payloads de facturación y cobro deben referenciar a `"pedidoNumeroPedido"` o `"numeroPedido"`.
    *   `Caja` utiliza `idCaja` como PK física. Los movimientos de caja deben referenciar a `"cajaIdCaja"`.

---

## 2. Matriz de Trazabilidad: Especificación vs Modelos

### MÓDULO 1: SaaS y Configuración del Negocio
*   **Modelos Involucrados**: `Negocio`
*   **Campos en Base de Datos**: `id`, `razonSocial`, `cuit`, `colorPrincipal`, `colorSecundario`, `facturacionHabilitada`, `certificadoAfipPath`, `llaveAfipPath`, `tokenMercadoPago`.
*   **Análisis de Endpoints**:
    *   `POST /api/v1/negocio/branding`: Modifica `razonSocial`, `cuit`, `colorPrincipal`, `colorSecundario`. (Perfectamente alineado).
    *   `PUT /api/v1/negocio/facturacion-config`: Modifica `facturacionHabilitada`, `certificadoAfipPath`, `llaveAfipPath`. (Perfectamente alineado).
    *   `POST /api/v1/negocio/mercadopago/validate`: Modifica y persiste `tokenMercadoPago`. (Perfectamente alineado).

### MÓDULO 2: Seguridad, RRHH y Accesos
*   **Modelos Involucrados**: `Empleado`, `Usuario`, `Rol`, `Sesion`.
*   **Campos en Base de Datos**:
    *   `Empleado`: `id`, `legajo`, `nombre`, `apellido`, `telefono`, `fechaAlta`.
    *   `Usuario`: `email`, `password`, `googleId`, `tokenConfirmacion`, `tokenConfirmacionExpires`, `emailConfirmado`, `activo`.
    *   `Sesion`: `id`, `fechaHoraInicio`, `fechaHoraFin`, `usuarioEmail`.
*   **Análisis de Endpoints**:
    *   `POST /api/auth/register-admin`: Envía `razonSocial`, `cuit` (crea `Negocio`), `nombre`, `apellido` (crea `Empleado`), `email`, `password` (crea `Usuario` con rol Administrador). (Perfectamente alineado).
    *   `POST /api/auth/login`: Valida contra `Usuario.email` y `Usuario.password`, registra `Sesion.fechaHoraInicio` y retorna JWT. (Perfectamente alineado).
    *   `POST /api/auth/confirm-email`: Recibe `email` y `tokenConfirmacion` para activar `Usuario.emailConfirmado`. (Perfectamente alineado).

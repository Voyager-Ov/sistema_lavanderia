# Especificación del Módulo de Clientes, Cuentas Corrientes y Saldos a Favor (Clientes)

Este documento detalla la lógica operativa, contratos de API, flujos de datos, modelos de base de datos y diseño técnico del **Módulo de Clientes (`clientes`)** para la plataforma de lavandería SaaS Multi-Tenant.

---

## 1. Alcance y Objetivos del Módulo

El módulo de Clientes es el responsable de gestionar el padrón de clientes del negocio, su historial de transacciones, la posición financiera en vivo de su cuenta corriente (Deuda Exigible vs Deuda No Exigible), el consumo atómico por algoritmo FIFO de saldos a favor y el cobro masivo de servicios abonados en mostrador.

### Casos de Uso del Módulo:
*   **CU-14: Registrar Cliente** (AP: Empleado Operativo, Administrador). Alta de cliente para asociación a pedidos y cuenta corriente.
*   **CU-15: Modificar Datos de Cliente** (AP: Empleado Operativo, Administrador). Edición de teléfono, correo y dirección de entrega.
*   **CU-16: Consultar y Buscar Clientes** (AP: Empleado Operativo, Administrador). Búsqueda predictiva debounce por nombre, teléfono o email.
*   **CU-17: Desactivar Cliente (Baja Lógica)** (AP: Empleado Operativo, Administrador). Soft Delete (`activo = false`) previa validación de ausencia de pedidos en curso.
*   **CU-18: Consultar Estado de Cuenta y Libro Mayor** (AP: Empleado Operativo, Administrador). Posición financiera consolidada en vivo y extracto de movimientos (DEBE / HABER).
*   **CU-19: Registrar Cobro Masivo de Deuda** (AP: Empleado Operativo, Administrador). Liquidación de pedidos entregados no cobrados vinculados a la caja activa.
*   **CU-20: Otorgar Ajuste Manual de Saldo a Favor** (AP: Administrador de Negocio). Emisión de notas de crédito manuales con justificación.
*   **CU-21: Aplicar Saldo a Favor en Pago de Pedido** (AP: Empleado Operativo, Administrador). Imputación FIFO con bloqueo pesimista.

---

## 2. Modelos de Base de Datos Vinculados

El módulo interactúa con el esquema del tenant (`tenant_{id}`) mediante modelos de Sequelize asociados al `negocioId`.

### A. Modelo `Cliente`
Almacena los datos filiales y de contacto del cliente dentro de la lavandería.
*   `id` (DataTypes.INTEGER, **PK**, autoIncrement): Identificador único del cliente.
*   `nombre` (DataTypes.STRING, allowNull: false): Nombre y apellido del cliente.
*   `telefono` (DataTypes.STRING, allowNull: false): Teléfono de contacto / WhatsApp (único por `negocioId`).
*   `email` (DataTypes.STRING, allowNull: true): Dirección de correo electrónico.
*   `direccion` (DataTypes.STRING, allowNull: true): Domicilio de entrega/retiro.
*   `activo` (DataTypes.BOOLEAN, defaultValue: true): Flag de baja lógica (Soft Delete).
*   `motivoBaja` (DataTypes.STRING, allowNull: true): Justificación registrada al dar de baja el cliente.
*   `negocioId` (DataTypes.INTEGER, allowNull: false): Llave de aislamiento tenant.

**Asociaciones:**
*   `Cliente.hasOne(models.CuentaCorriente, { foreignKey: "clienteId", as: "cuentaCorriente" })`
*   `Cliente.hasMany(models.Pedido, { foreignKey: "clienteId", as: "pedidos" })`
*   `Cliente.hasMany(models.CreditoCliente, { foreignKey: "clienteId", as: "creditos" })`

---

### B. Modelo `CreditoCliente`
Representa los saldos a favor a favor del cliente generados por sobrepago en efectivo, cancelación de pedido o ajustes manuales.
*   `id` (DataTypes.INTEGER, **PK**, autoIncrement): Código del crédito a favor.
*   `negocioId` (DataTypes.INTEGER, allowNull: false): Llave de aislamiento tenant.
*   `clienteId` (DataTypes.INTEGER, allowNull: false): ID del cliente titular del saldo.
*   `pedidoOrigenId` (DataTypes.INTEGER, allowNull: true): ID del pedido que generó el saldo a favor (si aplica).
*   `montoOriginal` (DataTypes.DECIMAL(10, 2), allowNull: false): Importe emitido inicialmente.
*   `montoDisponible` (DataTypes.DECIMAL(10, 2), allowNull: false): Importe remanente listo para aplicar en futuros cobros.
*   `tipoOrigen` (DataTypes.ENUM("SOBREPAGO_EFECTIVO", "CANCELACION_PEDIDO", "AJUSTE_MANUAL"), allowNull: false): Origen contable del crédito.
*   `estado` (DataTypes.ENUM("DISPONIBLE", "CONSUMIDO_PARCIAL", "CONSUMIDO_TOTAL"), defaultValue: "DISPONIBLE"): Estado de disponibilidad.
*   `motivo` (DataTypes.STRING, allowNull: true): Justificación o concepto del crédito.
*   `creadoPorId` (DataTypes.INTEGER, allowNull: false): Usuario que registró la emisión del crédito.

---

### C. Modelo `AplicacionCredito`
Registro inmutable del consumo de saldos a favor aplicados a facturas/pedidos específicos.
*   `id` (DataTypes.INTEGER, **PK**, autoIncrement): Identificador de la transacción de imputación.
*   `negocioId` (DataTypes.INTEGER, allowNull: false): Llave tenant.
*   `creditoId` (DataTypes.INTEGER, allowNull: false): ID del crédito a favor consumido.
*   `pagoDestinoId` (DataTypes.INTEGER, allowNull: false): ID del pago que recibió la cobertura del crédito.
*   `pedidoDestinoId` (DataTypes.INTEGER, allowNull: false): ID del pedido abonado con el crédito.
*   `montoAplicado` (DataTypes.DECIMAL(10, 2), allowNull: false): Valor parcial o total impositivamente imputado.

---

## 3. Contratos de API (JSON Payloads)

Todos los payloads mantienen el estándar de respuesta del sistema:
```json
{
  "status": "success",
  "message": "Mensaje descriptivo",
  "data": {}
}
```

### 1. Obtener Lista Paginada de Clientes
*   **Endpoint:** `GET /api/v1/clientes`
*   **Headers:** `Authorization: Bearer <token_jwt>`
*   **Query Params:** `page=1&limit=10&search=Juan&sortBy=createdAt&sortOrder=DESC`
*   **Responses:**
    *   `200 OK` ➔ Retorna lista paginada de clientes activos.
        ```json
        {
          "status": "success",
          "message": null,
          "data": {
            "items": [
              {
                "id": 12,
                "nombre": "Juan Pérez",
                "telefono": "+543519876543",
                "email": "juan.perez@email.com",
                "direccion": "Av. Colón 1234, Córdoba",
                "activo": true,
                "createdAt": "2026-08-10T14:30:00.000Z"
              }
            ],
            "meta": {
              "totalItems": 1,
              "itemCount": 1,
              "itemsPerPage": 10,
              "totalPages": 1,
              "currentPage": 1
            }
          }
        }
        ```
    *   `400 Bad Request` ➔ Término de búsqueda menor a 3 caracteres.

---

### 2. Registrar Nuevo Cliente
*   **Endpoint:** `POST /api/v1/clientes`
*   **Headers:** `Authorization: Bearer <token_jwt>`
*   **Roles Permitidos:** `admin`, `empleado`
*   **Request Body:**
    ```json
    {
      "nombre": "María González",
      "telefono": "+543515554433",
      "email": "maria.gonzalez@email.com",
      "direccion": "Calle Jujuy 456"
    }
    ```
*   **Reglas de Validación (Validators):**
    *   `nombre`: Requerido, entre 2 y 100 caracteres.
    *   `telefono`: Requerido, formato de teléfono válido.
    *   `email`: Opcional, formato de correo válido si se envía.
*   **Responses:**
    *   `201 Created` ➔ Cliente registrado exitosamente.
    *   `400 Bad Request` ➔ Ya existe un cliente con ese número de teléfono en el negocio.

---

### 3. Consultar Estado de Cuenta Consolidado
*   **Endpoint:** `GET /api/v1/clientes/:id/cuenta-corriente/estado-cuenta`
*   **Headers:** `Authorization: Bearer <token_jwt>`
*   **Roles Permitidos:** `admin`, `empleado`
*   **Responses:**
    *   `200 OK` ➔ Retorna resumen financiero consolidado en vivo.
        ```json
        {
          "status": "success",
          "message": null,
          "data": {
            "cliente": {
              "id": 12,
              "nombre": "Juan Pérez",
              "telefono": "+543519876543",
              "email": "juan.perez@email.com",
              "activo": true
            },
            "resumen": {
              "deudaExigible": 4500.00,
              "deudaNoExigible": 2000.00,
              "totalCreditoDisponible": 1000.00,
              "saldoNeto": -3500.00,
              "pedidosDeudaCount": 2,
              "pedidosEnCursoCount": 1,
              "creditosCount": 1
            },
            "pedidosDeuda": [
              {
                "id": 101,
                "codigoSeguimiento": "PED-101",
                "total": "2500.00",
                "estado": "ENTREGADO",
                "cobrado": false
              }
            ],
            "creditosDisponibles": [
              {
                "id": 5,
                "montoOriginal": "1000.00",
                "montoDisponible": "1000.00",
                "tipoOrigen": "SOBREPAGO_EFECTIVO",
                "estado": "DISPONIBLE"
              }
            ]
          }
        }
        ```
    *   `404 Not Found` ➔ Cliente no encontrado.

---

### 4. Crear Ajuste Manual de Saldo a Favor
*   **Endpoint:** `POST /api/v1/clientes/:id/cuenta-corriente/ajuste-credito`
*   **Headers:** `Authorization: Bearer <token_jwt>`
*   **Roles Permitidos:** `admin` *(Exclusivo)*
*   **Request Body:**
    ```json
    {
      "monto": 1500.00,
      "motivo": "Compensación por prenda con deterioro menor en proceso de secado"
    }
    ```
*   **Responses:**
    *   `201 Created` ➔ Crédito a favor registrado exitosamente.
    *   `400 Bad Request` ➔ Monto inválido o motivo de justificación menor a 5 caracteres.
    *   `403 Forbidden` ➔ Intento de ejecución con rol de `empleado`.

---

### 5. Desactivar Cliente (Baja Lógica)
*   **Endpoint:** `PATCH /api/v1/clientes/:id/estado`
*   **Headers:** `Authorization: Bearer <token_jwt>`
*   **Roles Permitidos:** `admin`, `empleado`
*   **Request Body:**
    ```json
    {
      "motivoBaja": "Cliente cambió de domicilio a otra provincia"
    }
    ```
*   **Responses:**
    *   `200 OK` ➔ Cliente dado de baja (Soft Delete).
    *   `400 Bad Request` ➔ El cliente posee pedidos activos en curso sin finalizar.

---

## 4. Algoritmos de Negocio y Lógica en los Servicios

### A. Algoritmo de Consumo de Créditos a Favor por Estrategia FIFO (`consumirCreditosFIFO`)

Implementa la imputación de saldos a favor ordenados cronológicamente con **Bloqueo Pesimista (Pessimistic Locking)** para garantizar concurrencia segura sin condiciones de carrera:

```javascript
export const consumirCreditosFIFO = async (
    negocioId,
    clienteId,
    montoACubrir,
    pagoDestinoId,
    pedidoDestinoId,
    transaction
) => {
    if (!transaction) {
        throw new AppError("Se requiere una transacción activa para el consumo seguro de créditos.", 500);
    }

    const montoObjetivo = parseFloat(montoACubrir);
    if (isNaN(montoObjetivo) || montoObjetivo <= 0) {
        throw new AppError("El monto a cubrir con saldo a favor debe ser mayor a 0.", 400);
    }

    // 1. Bloqueo pesimista (FOR UPDATE) sobre los créditos disponibles en orden FIFO
    const creditos = await models.CreditoCliente.findAll({
        where: {
            negocioId,
            clienteId,
            estado: { [Op.in]: ["DISPONIBLE", "CONSUMIDO_PARCIAL"] },
            montoDisponible: { [Op.gt]: 0 }
        },
        order: [["id", "ASC"]], // FIFO: Los más antiguos primero
        lock: transaction.LOCK.UPDATE,
        transaction
    });

    let montoRestante = montoObjetivo;
    let totalAplicado = 0;
    const aplicaciones = [];

    for (const credito of creditos) {
        if (montoRestante <= 0) break;

        const disponible = parseFloat(credito.montoDisponible);
        const aAplicar = Math.min(disponible, montoRestante);

        const nuevoDisponible = Number((disponible - aAplicar).toFixed(2));
        const nuevoEstado = nuevoDisponible === 0 ? "CONSUMIDO_TOTAL" : "CONSUMIDO_PARCIAL";

        // Actualizar estado del crédito
        await credito.update({
            montoDisponible: nuevoDisponible,
            estado: nuevoEstado
        }, { transaction });

        // Crear registro inmutable de aplicación
        const aplicacion = await models.AplicacionCredito.create({
            negocioId,
            creditoId: credito.id,
            pagoDestinoId,
            pedidoDestinoId,
            montoAplicado: aAplicar
        }, { transaction });

        aplicaciones.push(aplicacion);

        montoRestante = Number((montoRestante - aAplicar).toFixed(2));
        totalAplicado = Number((totalAplicado + aAplicar).toFixed(2));
    }

    if (totalAplicado < montoObjetivo) {
        throw new AppError(
            `Saldo a favor insuficiente. Disponible: $${totalAplicado.toFixed(2)}, Solicitado: $${montoObjetivo.toFixed(2)}.`,
            400
        );
    }

    return { totalAplicado, aplicaciones };
};
```

---

### B. Algoritmo de Cálculo de Posición Financiera en Vivo (`obtenerEstadoCuenta`)

Calcula determinísticamente la posición financiera sin almacenar valores estáticos desincronizables:

```javascript
export const obtenerEstadoCuenta = async (negocioId, clienteId) => {
    const cliente = await models.Cliente.findOne({
        where: { id: clienteId, negocioId },
        attributes: ["id", "nombre", "telefono", "email", "activo"]
    });

    if (!cliente) {
        throw new AppError("Cliente no encontrado.", 404);
    }

    // 1. Pedidos ENTREGADOS pendientes de cobro (Deuda Exigible)
    const pedidosDeuda = await models.Pedido.findAll({
        where: { negocioId, clienteId, estado: "ENTREGADO", cobrado: false }
    });

    // 2. Pedidos en proceso no cobrados (Deuda No Exigible)
    const pedidosEnCurso = await models.Pedido.findAll({
        where: {
            negocioId,
            clienteId,
            estado: { [Op.in]: ["PENDIENTE", "EN_PROCESO", "LISTO_PARA_RETIRAR"] },
            cobrado: false
        }
    });

    // 3. Créditos a favor disponibles
    const creditosDisponibles = await models.CreditoCliente.findAll({
        where: {
            negocioId,
            clienteId,
            estado: { [Op.in]: ["DISPONIBLE", "CONSUMIDO_PARCIAL"] },
            montoDisponible: { [Op.gt]: 0 }
        }
    });

    // Cálculos en tiempo real
    const deudaExigible = pedidosDeuda.reduce((acc, p) => Number((acc + parseFloat(p.total)).toFixed(2)), 0);
    const deudaNoExigible = pedidosEnCurso.reduce((acc, p) => Number((acc + parseFloat(p.total)).toFixed(2)), 0);
    const totalCreditoDisponible = creditosDisponibles.reduce((acc, c) => Number((acc + parseFloat(c.montoDisponible)).toFixed(2)), 0);
    
    // Saldo Neto: Positivo = Crédito a favor neto; Negativo = Deuda exigible neta
    const saldoNeto = Number((totalCreditoDisponible - deudaExigible).toFixed(2));

    return {
        cliente,
        resumen: { deudaExigible, deudaNoExigible, totalCreditoDisponible, saldoNeto },
        pedidosDeuda,
        pedidosEnCurso,
        creditosDisponibles
    };
};
```

---

## 5. Middlewares y Filtros de Seguridad Involucrados

### `verificarToken` (`src/middlewares/auth/auth.middleware.js`)
*   Valida el token JWT en el encabezado `Authorization: Bearer <token_jwt>`.
*   Extrae el `negocioId` y `usuarioId` inyectándolos en `req.user`.

### `verificarSuscripcionActiva` (`src/middlewares/auth/subscription.middleware.js`)
*   Garantiza que la lavandería posee una suscripción SaaS vigente para operar.

### `verificarRol` (`src/middlewares/role.middleware.js`)
*   Informa y deniega accesos según la matriz de permisos. Por ejemplo:
    `router.post("/ajuste-credito", verificarRol(["admin"]), ...)` restringe la emisión de notas de crédito exclusivamente a usuarios administradores (HTTP 403 Forbidden para usuarios con rol `empleado`).

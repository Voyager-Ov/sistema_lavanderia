# Especificación Técnica de API y Requerimientos: Módulo de Gestión de Clientes, Cuentas Corrientes y Saldos a Favor

**Estándar de Documentación de Cátedra (UTN FRC)**  
**Proyecto:** SaaS Lavandería Multi-Negocio  
**Módulo:** Módulo 3 - Gestión de Clientes, Cuentas Corrientes y Saldos a Favor  

---

## 1. Arquitectura y Patrones de Diseño Recomendados

### Estilo Arquitectónico: Arquitectura en Capas (Layered Architecture)
El subsistema de gestión de clientes y cuentas corrientes se estructura bajo el patrón **Layered (En Capas)**, garantizando el aislamiento de responsabilidades, la seguridad multi-tenant por negocio (`negocioId`) y la integridad contable:

*   **Capa de Presentación («boundary»)**: 
    *   Pantalla Principal de Clientes (`/clientes`) con buscador predictivo y resumen contable.
    *   Detalle/Ficha del Cliente integrada mediante el componente `ResponsiveSheet` (que alterna automáticamente entre `SideSheet` en Desktop y `BottomSheet` en Móvil).
    *   Tablero de Movimientos Contables (Libro Mayor unificado de DEBE y HABER).
*   **Capa de Control/Servicios («control»)**:
    *   `ClienteController` y `ClienteCuentaController`: Gestión de peticiones HTTP, validaciones sanitarias de entrada y serialización de respuestas.
    *   `ClienteService`: Lógica CRUD de clientes, validaciones de unicidad por negocio (teléfono/email) y baja lógica controlada.
    *   `ClienteCuentaService`: Cálculo dinámico e inmutable en tiempo real de la posición financiera (Deuda Exigible, Deuda No Exigible, Saldos a Favor y Saldo Neto).
    *   `CreditoService`: Gestión del ciclo de vida de créditos a favor, liquidación por concurrencia y consumo FIFO.
    *   `PagoCoreService`: Cobro masivo de deudas y vinculación con la caja activa del turno.
*   **Capa de Dominio/Entidades («entity»)**:
    *   Modelos Sequelize: `Cliente`, `CuentaCorriente`, `CreditoCliente`, `AplicacionCredito`, `Pedido`, `Pago`, `MetodoPago`.

---

### Patrones de Diseño (GoF) Claves Aplicados al Módulo de Clientes

1.  **Patrón Strategy / Algoritmo FIFO (Consumo de Créditos a Favor)**:
    *   *Propósito:* Al abonar un pedido utilizando "Saldo a Favor", el sistema aplica una estrategia de imputación cronológica **FIFO (First-In, First-Out)**. Los créditos más antiguos se consumen primero.
    *   *Implementación:* En `CreditoService.consumirCreditosFIFO()`, el sistema obtiene los registros de `CreditoCliente` en estado `DISPONIBLE` u `CONSUMIDO_PARCIAL` ordenados por `id ASC` y aplica un bloqueo pesimista de base de datos (`LOCK.UPDATE`) para prevenir condiciones de carrera.

2.  **Patrón Observer (Observador de Movimientos y Notificaciones)**:
    *   *Propósito:* Mantener informado al cliente ante eventos financieros relevantes.
    *   *Implementación:* La entidad `Cliente` actúa como sujeto observable. Al generarse un saldo a favor (por sobrepago en efectivo o cancelación de un pedido previamente abonado), o al enviarse un recordatorio de cuenta corriente, los observadores registrados (`ServicioNotificacionSMS`, `ServicioCorreo`) disparan los avisos de forma asíncrona.

3.  **Patrón State / Solvencia Contable (Estado del Cliente)**:
    *   *Propósito:* Clasificar dinámicamente la aptitud crediticia del cliente para la toma de pedidos a crédito.
    *   *Implementación:* El estado financiero del cliente no se almacena como un valor estático editable, sino que se calcula mediante la evaluación de reglas contables:
        *   `HABILITADO`: Saldo Neto >= $0 o sin deuda exigible vencida.
        *   `DEUDOR`: Deuda Exigible (pedidos `ENTREGADO` sin cobrar) > $0.
        *   `INACTIVO`: Cliente dado de baja mediante Soft Delete (`activo = false`).

4.  **Patrón Factory Method / Builder (Creación de Ficha Contable)**:
    *   *Propósito:* Garantizar que cada cliente instanciado dentro de un tenant posea una estructura contable inicializada de manera coherente.
    *   *Implementación:* Al invocar `crearCliente()`, el sistema crea el registro del cliente y asocia implícitamente su libro mayor contable sin requerir inicializaciones manuales posteriores.

---

## 2. Jerarquía de Actores y Matriz de Permisos por Rol

### Jerarquía de Actores (Estándar UTN FRC)

El sistema está diseñado exclusivamente para soportar dos portales de usuario en el frontend, correspondientes a los dos roles operativos del negocio:

*   **Usuario** (Actor Abstracto).
    *   **Empleado** (Actor Físico):
        *   **Administrador** (Rol `admin`): Posee control total operativo, financiero y administrativo del negocio. Es el único rol autorizado para emitir notas de crédito manuales y exportar reportes ejecutivos.
        *   **Empleado Operativo / Cajero** (Rol `empleado`): Encargado de la operación diaria en mostrador, atención al cliente, registro de pedidos, cobros en caja y actualización de fichas de clientes.
*   **Servidor de Correo / Notificaciones** (Actor Secundario / Sistema Externo).

---

### Matriz de Permisos por Rol (`Administrador` vs `Empleado`)

La siguiente matriz define el nivel de acceso y las acciones permitidas para cada uno de los dos roles soportados por la aplicación:

| Operación / Acción en el Módulo de Clientes | Administrador (`admin`) | Empleado / Cajero (`empleado`) | Regla de Negocio / Alcance |
| :--- | :---: | :---: | :--- |
| **CU-14: Registrar Cliente (Alta Mostrador)** | **Sí** | **Sí** | Registro de clientes para asociación a pedidos. |
| **CU-15: Modificar Datos de Cliente (Perfil)** | **Sí** | **Sí** | Edición de teléfono, email y dirección. |
| **CU-16: Buscar / Consultar Clientes** | **Sí** | **Sí** | Búsqueda predictiva por nombre, teléfono o email. |
| **CU-17: Desactivar Cliente (Baja Lógica)** | **Sí** | **Sí** | Requiere justificación (`motivoBaja`). Bloqueado si hay pedidos en curso. |
| **CU-18: Consultar Estado de Cuenta y Libro Mayor** | **Sí** | **Sí** | Visualización de Deuda Exigible, Saldos a Favor y Movimientos. |
| **CU-19: Registrar Cobro Masivo de Deuda** | **Sí** | **Sí** | Liquidación de pedidos entregados y movimiento de caja. |
| **CU-20: Otorgar Ajuste Manual de Saldo a Favor** | **Sí** *(Exclusivo)* | ❌ *(Denegado)* | Emisión de notas de crédito manuales. Exclusivo de Admin (HTTP 403 para empleados). |
| **CU-21: Aplicar Crédito a Favor en Pago de Pedido** | **Sí** | **Sí** | Aplicación atómica de saldos a favor (Estrategia FIFO). |
| **CU-22: Consultar Historial de Pedidos del Cliente** | **Sí** | **Sí** | Listado completo de pedidos asociados al cliente. |
| **CU-23: Exportar Cartera de Clientes / Deudores** | **Sí** *(Exclusivo)* | ❌ *(Denegado)* | Generación de reportes ejecutivos en Excel/PDF. |

---

## 3. Enunciación y Especificación Detallada de Casos de Uso

*Nomenclatura formal de la UTN FRC: Verbo en Infinitivo + Objeto.*

*   **CU-14: Registrar Cliente** (AP: Empleado Operativo, Administrador)
*   **CU-15: Modificar Datos de Cliente** (AP: Empleado Operativo, Administrador)
*   **CU-16: Consultar y Buscar Clientes** (AP: Empleado Operativo, Administrador)
*   **CU-17: Desactivar Cliente (Baja Lógica)** (AP: Empleado Operativo, Administrador)
*   **CU-18: Consultar Estado de Cuenta y Libro Mayor** (AP: Empleado Operativo, Administrador)
*   **CU-19: Registrar Cobro Masivo de Deuda** (AP: Empleado Operativo, Administrador)
*   **CU-20: Otorgar Ajuste Manual de Saldo a Favor** (AP: Administrador de Negocio)
*   **CU-21: Aplicar Saldo a Favor en Pago de Pedido** (AP: Empleado Operativo, Administrador)
*   **CU-22: Consultar Historial de Pedidos del Cliente** (AP: Empleado Operativo, Administrador)
*   **CU-23: Exportar Cartera de Clientes y Deudores** (AP: Administrador de Negocio)

---

### Especificación Detallada de Casos de Uso Claves

#### CU-14: Registrar Cliente
*   **Actor Primario:** Empleado Operativo / Cajero, Administrador de Negocio.
*   **Precondición:** El usuario ha iniciado sesión con rol `admin` o `empleado` y el negocio posee una suscripción activa.
*   **Flujo Principal:**
    1. El usuario ingresa a la pantalla de Clientes o presiona "Nuevo Cliente" durante el registro de un pedido en mostrador.
    2. El sistema despliega el formulario en `ResponsiveSheet`.
    3. El usuario ingresa Nombre, Apellido, Teléfono (obligatorio para contacto/WhatsApp), Email (opcional) y Dirección (opcional).
    4. El usuario presiona "Guardar Cliente".
    5. El sistema valida la unicidad del teléfono dentro del `negocioId`.
    6. El sistema crea el registro con `activo = true` y retorna la ficha creada.
*   **Flujos Alternativos / Excepciones:**
    *   *Teléfono Duplicado:* Si ya existe un cliente activo con el mismo número de teléfono en la misma lavandería, el sistema muestra una alerta de error (HTTP 400: "Ya existe un cliente con ese teléfono en este negocio") y cancela el registro.
*   **Poscondición:** El cliente queda disponible para asociar a pedidos y recibir registros contables.

---

#### CU-17: Desactivar Cliente (Baja Lógica)
*   **Actor Primario:** Administrador de Negocio, Empleado Operativo.
*   **Precondición:** El cliente existe y se encuentra activo (`activo = true`).
*   **Flujo Principal:**
    1. El usuario selecciona un cliente y presiona la opción "Dar de baja".
    2. El sistema solicita la confirmación y el ingreso obligatorio de un `motivoBaja`.
    3. El sistema verifica que el cliente **no posea pedidos en curso** (pedidos en estado `PENDIENTE`, `EN_PROCESO` o `LISTO_PARA_RETIRAR`).
    4. El sistema actualiza el registro a `activo = false` y guarda el `motivoBaja`.
    5. El sistema notifica la baja lógica exitosa.
*   **Flujos Alternativos / Excepciones:**
    *   *Pedidos Activos Pendientes:* Si el cliente tiene 1 o más pedidos sin finalizar (`PENDIENTE`, `EN_PROCESO`, `LISTO_PARA_RETIRAR`), el sistema interrumpe la operación y retorna error HTTP 400: *"No se puede dar de baja al cliente porque tiene N pedido(s) en curso."*
*   **Poscondición:** El cliente deja de figurar en las búsquedas predictivas de mostrador, pero su historial de pedidos y movimientos contables se preservan de manera inmutable.

---

#### CU-18: Consultar Estado de Cuenta y Libro Mayor
*   **Actor Primario:** Empleado Operativo, Administrador.
*   **Precondición:** El cliente está registrado en el sistema.
*   **Flujo Principal:**
    1. El usuario abre la ficha del cliente y selecciona la pestaña "Estado de Cuenta".
    2. El sistema calcula en tiempo real:
        *   **Deuda Exigible**: Suma de pedidos en estado `ENTREGADO` y `cobrado = false`.
        *   **Deuda No Exigible**: Suma de pedidos en curso (`PENDIENTE`, `EN_PROCESO`, `LISTO_PARA_RETIRAR`) no cobrados.
        *   **Total Crédito Disponible**: Suma de registros de `CreditoCliente` con saldo a favor disponible (`montoDisponible > 0`).
        *   **Saldo Neto**: `Total Crédito Disponible - Deuda Exigible`.
    3. El sistema lista el extracto unificado de movimientos (Cargos por pedidos en el DEBE, Pagos y Créditos generados en el HABER) ordenados descendentemente por fecha.

---

#### CU-20: Otorgar Ajuste Manual de Saldo a Favor
*   **Actor Primario:** Administrador de Negocio (Exclusivo).
*   **Precondición:** El usuario está autenticado con el rol `admin`.
*   **Flujo Principal:**
    1. El administrador accede al estado de cuenta del cliente y presiona "Ajuste Manual de Crédito".
    2. Ingresa el `monto` a favor y la justificación o `motivo` (mínimo 5 caracteres).
    3. El sistema inicia una transacción manejada en Sequelize.
    4. Se crea un registro en `CreditoCliente` con `tipoOrigen = "AJUSTE_MANUAL"`, `estado = "DISPONIBLE"` y `creadoPorId = usuario.id`.
    5. El sistema confirma la transacción y refresca la posición financiera.
*   **Flujos Alternativos / Excepciones:**
    *   *Intento por Empleado Cajero:* Si un usuario con rol `empleado` intenta consumir este endpoint, el middleware de control de acceso intercepta la petición y retorna error HTTP 403 Forbidden ("Acceso denegado. Se requiere rol de Administrador.").
    *   *Motivo Insuficiente:* Si la justificación posee menos de 5 caracteres, retorna HTTP 400.

---

## 4. Especificación del Front-End (Vistas, Componentes UI y UX)

### 1. Pantalla Principal de Gestión de Clientes (`/clientes`)

*   **Layout y Estética Visual:**
    *   Encabezado con título del módulo, contador total de clientes y botón principal "+ Nuevo Cliente".
    *   **Barra de Búsqueda Predictiva**: Permite filtrar dinámicamente por nombre, teléfono o email (requiere al menos 3 caracteres, con debounce de 300ms para evitar sobrecarga a la API).
    *   **Tabla / Grid Card Responsivo**: Muestra las columnas Nombre, Teléfono, Email, Saldo Neto y Estado.
*   **Badges Visuales de Saldo Neto:**
    *   🟢 **Saldo a Favor**: Fondo verde suave con texto verde oscuro cuando `saldoNeto > 0` (ej: `+$1,500.00`).
    *   🔴 **Deuda Exigible**: Fondo rojo suave con texto rojo cuando `saldoNeto < 0` o `deudaExigible > 0` (ej: `-$3,200.00`).
    *   ⚪ **Al Día**: Badge neutro gris cuando el saldo es `$0.00`.

---

### 2. Componente de Ficha de Cliente y Estado de Cuenta (`ResponsiveSheet`)

> [!IMPORTANT]
> **Regla de Diseño Mandatoria del Sistema**:
> La vista de detalle, edición y estado de cuenta del cliente **DEBE** utilizar exclusivamente el componente `ResponsiveSheet` (`src/shared/ui/overlays/responsive-sheet.tsx`).
> - **Desktop**: Se presenta como un panel lateral de ancho fijo (`SideSheet`).
> - **Móvil**: Se adapta automáticamente como un panel deslizable inferior (`BottomSheet`).
> - **Prohibición**: No se deben aplicar clases de sobrescritura manual de dimensiones (`w-`, `max-w-`, `h-`) en el `className` para garantizar consistencia visual en toda la aplicación.

*   **Estructura de Navegación por Pestañas (Tabs) dentro del ResponsiveSheet:**
    1.  **Pestaña "Información General":** Formulario de edición de datos personales, teléfono, correo y dirección. Opción de baja lógica con campo de motivo.
    2.  **Pestaña "Estado de Cuenta y Saldos":**
        *   Tarjetas KPI superiores: *Deuda Exigible*, *Deuda en Curso*, *Saldo a Favor Disponible*, *Saldo Neto*.
        *   Botón "Cobrar Deuda" (Dispara modal de pago masivo de pedidos entregados).
        *   Botón "Ajuste de Crédito" (Visible solo si el usuario activo es `admin`).
    3.  **Pestaña "Libro Mayor / Movimientos":** Tabla cronológica de movimientos contables con filtros por rango de fechas (`desde` / `hasta`). Muestra Tipo de Movimiento (`CARGO_PEDIDO`, `PAGO_RECIBIDO`, `CREDITO_GENERADO`), Concepto, Importe e Impacto (`DEBE` / `HABER`).
    4.  **Pestaña "Historial de Pedidos":** Lista de todos los pedidos históricos asociados al cliente con badges de estado operativo y botón de acceso rápido al detalle del pedido.

---

## 5. Reglas de Negocio, Contratos de API y Diagnósticos de Error

### Reglas de Negocio Financieras y Contables

1.  **Aislamiento Multi-Tenant**: Todas las consultas y operaciones se filtran estrictamente por `negocioId` extraído del token JWT validado (`req.user.negocioId`).
2.  **Imputación de Créditos a Favor (FIFO)**:
    *   El consumo de crédito a favor es atómico y Pesimista (`transaction.LOCK.UPDATE`).
    *   Un crédito pasa de `DISPONIBLE` a `CONSUMIDO_PARCIAL` o `CONSUMIDO_TOTAL` según el monto imputado.
    *   Cada consumo genera un registro inmutable en `AplicacionCredito`.
3.  **Cobro Masivo de Deuda Exigible**:
    *   Al cobrar la deuda exigible de un cliente, el sistema liquida los pedidos abonados comenzando por el más antiguo y genera el movimiento de caja correspondiente en el turno activo.

---

### Contratos de Datos JSON (Endpoints de la API)

#### A. Obtener Lista Paginada de Clientes (`GET /api/v1/clientes`)
*   **Headers:** `Authorization: Bearer <token_jwt>`
*   **Query Params:** `page=1&limit=10&search=juan&sortBy=createdAt&sortOrder=DESC`
*   **Respuesta Exitosa (HTTP 200 OK):**
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

---

#### B. Registrar Nuevo Cliente (`POST /api/v1/clientes`)
*   **Headers:** `Authorization: Bearer <token_jwt>`
*   **Roles Permitidos:** `admin`, `empleado`
*   **Request Payload (JSON):**
```json
{
  "nombre": "María González",
  "telefono": "+543515554433",
  "email": "maria.gonzalez@email.com",
  "direccion": "Calle Jujuy 456"
}
```
*   **Respuesta Exitosa (HTTP 201 Created):**
```json
{
  "status": "success",
  "message": "Cliente creado exitosamente",
  "data": {
    "id": 15,
    "negocioId": 1,
    "nombre": "María González",
    "telefono": "+543515554433",
    "email": "maria.gonzalez@email.com",
    "direccion": "Calle Jujuy 456",
    "activo": true,
    "updatedAt": "2026-08-13T17:15:00.000Z",
    "createdAt": "2026-08-13T17:15:00.000Z"
  }
}
```
*   **Error por Teléfono Duplicado (HTTP 400 Bad Request):**
```json
{
  "status": "error",
  "message": "Ya existe un cliente con ese teléfono en este negocio."
}
```

---

#### C. Obtener Estado de Cuenta Consolidado (`GET /api/v1/clientes/:id/cuenta-corriente/estado-cuenta`)
*   **Headers:** `Authorization: Bearer <token_jwt>`
*   **Roles Permitidos:** `admin`, `empleado`
*   **Respuesta Exitosa (HTTP 200 OK):**
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
      },
      {
        "id": 102,
        "codigoSeguimiento": "PED-102",
        "total": "2000.00",
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

---

#### D. Crear Ajuste Manual de Saldo a Favor (`POST /api/v1/clientes/:id/cuenta-corriente/ajuste-credito`)
*   **Headers:** `Authorization: Bearer <token_jwt>`
*   **Roles Permitidos:** `admin` *(Exclusivo)*
*   **Request Payload (JSON):**
```json
{
  "monto": 1500.00,
  "motivo": "Compensación por prenda con deterioro menor en proceso de secado"
}
```
*   **Respuesta Exitosa (HTTP 201 Created):**
```json
{
  "status": "success",
  "message": "Ajuste de saldo a favor generado exitosamente.",
  "data": {
    "id": 8,
    "negocioId": 1,
    "clienteId": 12,
    "montoOriginal": 1500.00,
    "montoDisponible": 1500.00,
    "tipoOrigen": "AJUSTE_MANUAL",
    "estado": "DISPONIBLE",
    "motivo": "Compensación por prenda con deterioro menor en proceso de secado",
    "creadoPorId": 3,
    "createdAt": "2026-08-13T17:20:00.000Z"
  }
}
```
*   **Error por Permisos Insuficientes (HTTP 403 Forbidden):**
```json
{
  "status": "error",
  "message": "Acceso denegado. Se requiere rol de Administrador."
}
```

---

#### E. Desactivar Cliente por Baja Lógica (`PATCH /api/v1/clientes/:id/estado`)
*   **Headers:** `Authorization: Bearer <token_jwt>`
*   **Roles Permitidos:** `admin`, `empleado`
*   **Request Payload (JSON):**
```json
{
  "motivoBaja": "Cliente cambió de domicilio a otra provincia"
}
```
*   **Respuesta Exitosa (HTTP 200 OK):**
```json
{
  "status": "success",
  "message": "Cliente dado de baja (Soft Delete)"
}
```
*   **Error por Pedidos en Curso (HTTP 400 Bad Request):**
```json
{
  "status": "error",
  "message": "No se puede dar de baja al cliente porque tiene 2 pedido(s) en curso."
}
```

---

### Diagnóstico de Códigos de Respuesta HTTP del Módulo

| Código HTTP | Significado Contable / Operativo | Ejemplo de Causa |
| :---: | :--- | :--- |
| **200 OK** | Operación realizada con éxito | Consulta de clientes, estado de cuenta o baja lógica. |
| **201 Created** | Registro creado exitosamente | Alta de cliente o emisión de ajuste manual de crédito. |
| **400 Bad Request** | Error de validación de negocio | Teléfono duplicado, saldo insuficiente o pedidos en curso al dar de baja. |
| **401 Unauthorized** | Token ausente o expirado | Sesión de usuario no válida. |
| **403 Forbidden** | Violación de permisos por rol | Intento de un empleado de emitir un ajuste manual de crédito o exportar reportes. |
| **404 Not Found** | Recurso no existente | Cliente no encontrado en el negocio activo. |
| **500 Internal Server Error** | Error no controlado de servidor | Fallo de conexión a la base de datos durante la transacción. |

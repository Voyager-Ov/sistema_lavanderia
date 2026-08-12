# Especificación Técnica de API: Módulo 4 (Pedidos y Trazabilidad de Estados)

**Estándar de Documentación de Cátedra (UTN FRC)**  
**Proyecto:** SaaS Lavandería Multi-Negocio  
**Módulo:** Pedidos y Trazabilidad de Estados  

---

## 1. Arquitectura y Patrones de Diseño Recomendados

### Estilo Arquitectónico: Arquitectura en Capas (Layered Architecture)
El subsistema de pedidos y trazabilidad de estados se estructurará bajo el patrón **Layered (En Capas)**:
*   **Capa de Presentación («boundary»)**: Pantalla de Registro de Pedidos, Tablero Kanban de Trazabilidad y Detalle de Pedidos.
*   **Capa de Control/Servicios («control»)**: Controladores de Gestión de Pedidos, Máquina de Estados y Administrador de Trazabilidad de Lavado.
*   **Capa de Dominio/Entidades («entity»)**: Modelos Sequelize (`Pedido`, `DetallePedido`, `CambioEstadoPedido`, `Estado`, `Cliente`).

### Patrones de Diseño (GoF) Claves Aplicados al Módulo 4
*   **Patrón State (Estado)**: Es el patrón mandatorio para resolver el ciclo de vida del `Pedido`. En lugar de implementar condicionales anidados (if-else) en el controlador, la lógica del pedido se delega a clases de estado concretas (`EstadoPendiente`, `EstadoLavando`, `EstadoListo`, `EstadoEntregado`, `EstadoCancelado`). Esto independiza las reglas de transición y permite modificar el flujo operativo de la lavandería en el futuro sin riesgo de regresión.
*   **Patrón Observer (Observador)**: Resuelve el envío automático de notificaciones al cliente. El `Pedido` actúa como el Sujeto observable. Al transicionar al estado "Listo para Retirar", se dispara automáticamente la notificación a los suscriptores (`ServicioMailNotificacion` y `ServicioSMS`), enviando un correo al cliente de forma síncrona o asíncrona.
*   **Patrón Memento (Snapshot)**: Resuelve el congelamiento de precios. Al crearse el pedido, el `DetallePedido` captura y almacena el valor de `precio` del catálogo en el atributo `precioHistorico` de manera inmutable.

---

## 2. Enunciación de Casos de Uso y Actores del Módulo 4

*Nomenclatura formal de la UTN FRC: Verbo en Infinitivo + Objeto.*

### Jerarquía de Actores
*   **Usuario** (Actor Abstracto).
    *   **Empleado** (Actor Físico, especialización de Usuario).
        *   **Empleado Operativo / Mostrador** (Especialización de Empleado).
    *   **Cliente** (Especialización de Usuario).
*   **Servidor de Correo** (Actor Secundario / Sistema Externo).

### Casos de Uso del Módulo 4
*   **CU-24: Registrar Pedido Local** (AP: Empleado Operativo)
*   **CU-25: Registrar Pedido Web** (AP: Cliente)
*   **CU-26: Confirmar Pedido Web** (AP: Empleado Operativo)
*   **CU-27: Iniciar Lavado de Pedido** (AP: Empleado Operativo)
*   **CU-28: Finalizar Lavado de Pedido** (AP: Empleado Operativo, AS: Servidor de Correo)
*   **CU-29: Entregar Pedido** (AP: Empleado Operativo)
*   **CU-30: Cancelar Pedido** (AP: Empleado Operativo)
*   **CU-31: Consultar Pedidos** (AP: Empleado Operativo, Administrador, Cliente)

---

## 3. Especificación del Front-End (Vistas, Subvistas y Flujos)

### 1. Pantalla de Registro de Pedido Local
*   **Layout y Estética Visual:**
    *   Diseño dividido en dos paneles:
        *   *Panel Izquierdo (Catálogo)*: Listado de categorías y servicios disponibles con buscador rápido.
        *   *Panel Derecho (Detalle del Pedido)*: Tabla de ítems seleccionados, selector de cliente y resumen de totales.
*   **Entrada de Datos:**
    *   `clienteId`: Búsqueda predictiva de cliente registrado.
    *   `observaciones`: Texto largo. Opcional.
    *   `origen`: String ("Local" o "Web").
    *   `direccionEntrega`: Dirección de envío si aplica delivery. Opcional.
    *   `costoEnvio`: Numérico. Opcional.
    *   `nombreClienteFactura` y `cuitClienteFactura`: Campos para facturación opcional.
*   **Acciones:**
    *   Botón "Confirmar y Generar Pedido" (POST `/api/v1/pedidos`).
    *   Botón "Imprimir Ticket" (Lanza la previsualización del ticket físico).

### 2. Tablero de Trazabilidad (Kanban)
*   **Layout:**
    *   Tablero de 4 columnas que representan los estados operativos: "Pendiente", "Lavando", "Listo para Retirar/Delivery", "Entregado".
    *   Tarjetas (Cards) de pedidos que muestran: `numeroPedido`, fecha de entrega estimada, nombre del cliente y alertas visuales si el pedido está demorado.
*   **Acciones:**
    *   **Transicionar Estado**: El empleado puede hacer clic en "Avanzar Estado" en la tarjeta del pedido para gatillar la transición controlada por la máquina de estados.

---

## 4. Reglas de Negocio, Contratos y Funcionalidades Cruzadas (Choques)

### 1. Máquina de Estados y Transiciones Válidas (Choques Operativos)
El Patrón State restringe las transiciones físicas de estados del Pedido según la siguiente matriz de reglas de negocio:

| Estado Origen | Estado Destino Válido | Lógica / Validación |
| :--- | :--- | :--- |
| **Pendiente** | **Lavando** / **Cancelado** | El lavado solo puede iniciar si el pedido no está cancelado. |
| **Lavando** | **Listo** / **Cancelado** | Al finalizar, se crea un registro `CambioEstadoPedido` y se gatilla el Observer para notificar al cliente. |
| **Listo** | **Entregado** / **Cancelado** | El pedido solo pasa a Entregado tras registrar el Cobro o confirmar Cuenta Corriente (Módulo 6). |
| **Entregado** | *Ninguno* | Estado final del pedido. No permite más transiciones. |
| **Cancelado** | *Ninguno* | Estado final. Se registra el motivo de la cancelación. |

---

### 2. Contratos de Datos (JSON Payloads)

#### A. Registrar Pedido Local (POST `/api/v1/pedidos`)
*   **Request (JSON):**
    ```json
    {
      "clienteId": 12,
      "observaciones": "Camisa de seda planchar con vapor bajo",
      "origen": "Local",
      "costoEnvio": 0,
      "detalles": [
        {
          "servicioId": 3,
          "cantidad": 2
        },
        {
          "servicioId": 5,
          "cantidad": 1
        }
      ]
    }
    ```
*   **Response Exitoso (201 Created):**
    ```json
    {
      "success": true,
      "message": "Pedido registrado y encolado en estado Pendiente.",
      "data": {
        "numeroPedido": 1054,
        "fechaHoraCreacion": "2026-08-10T23:20:00Z",
        "origen": "Local",
        "costoEnvio": 0,
        "detalles": [
          {
            "id": 2045,
            "servicioId": 3,
            "cantidad": 2,
            "precioHistorico": 500.00
          },
          {
            "id": 2046,
            "servicioId": 5,
            "cantidad": 1,
            "precioHistorico": 1200.00
          }
        ]
      }
    }
    ```

#### B. Iniciar Lavado de Pedido (PUT `/api/v1/pedidos/:numeroPedido/iniciar-lavado`)
*   **Request (JSON vacío):**
    ```json
    {}
    ```
*   **Response Exitoso (200 OK):**
    ```json
    {
      "success": true,
      "message": "El lavado del pedido ha iniciado exitosamente.",
      "data": {
        "numeroPedido": 1054,
        "estadoActual": "Lavando"
      }
    }
    ```
*   **Response Error - Transición Inválida (HTTP 409 Conflict):**
    ```json
    {
      "success": false,
      "error": "INVALID_STATE_TRANSITION",
      "message": "No se puede iniciar el lavado de un pedido que se encuentra en estado 'Entregado' o 'Cancelado'."
    }
    ```

---

## 5. Plantilla UTN de Caso de Uso Esencial (Trazo Medio)

### Caso de Uso: Registrar Pedido Local

*   **ID:** CU-24.
*   **Actores:** Empleado Operativo (Actor principal).
*   **Precondiciones:**
    *   El Empleado ha iniciado sesión y la caja diaria se encuentra abierta (Módulo 6).

#### Flujo Básico (Camino Feliz):
1.  El Empleado ingresa a la pantalla de ventas ("Registrar Pedido").
2.  El Empleado selecciona al Cliente del buscador predictivo.
3.  El Empleado selecciona los servicios solicitados del catálogo e introduce las cantidades.
4.  El Sistema calcula y actualiza los subtotales y el monto total final en tiempo real.
5.  El Empleado ingresa observaciones (instrucciones de lavado) y presiona "Confirmar y Generar Pedido".
6.  El Sistema valida la existencia de stock/disponibilidad y verifica que el cliente no posea deuda excedida en cuenta corriente.
7.  El Sistema persiste el Pedido en la base de datos con el estado inicial "Pendiente".
8.  El Sistema genera los registros de `DetallePedido` capturando el precio vigente en el catálogo (`precioHistorico`).
9.  El Sistema genera un registro en `CambioEstadoPedido` marcando el inicio del estado "Pendiente".
10. El Sistema lanza el comando de impresión del ticket físico.

#### Flujos Alternativos:

*   **A1: Cliente no registrado en el sistema (Paso 2)**
    1. El Empleado hace clic en "Crear Nuevo Cliente" sin salir del flujo de venta.
    2. El Sistema despliega una subvista modal de registro rápido de cliente.
    3. El Empleado completa los datos mínimos (Nombre, Apellido, Teléfono) y confirma.
    4. El Sistema guarda al cliente y lo deja seleccionado automáticamente. El flujo retorna al paso 3.

*   **A2: Límite de Cuenta Corriente Excedido (Paso 6)**
    1. El Sistema detecta que el cliente tiene el crédito corriente excedido y la lavandería no permite fiar más saldo.
    2. El Sistema bloquea la generación del pedido e informa: *"Límite de cuenta corriente excedido. Se requiere el pago inmediato para continuar."*
    3. El Empleado redirecciona al flujo de cobro inmediato del pedido. El caso de uso finaliza.

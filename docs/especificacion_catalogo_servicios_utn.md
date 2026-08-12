# Especificación Técnica de API: Módulo 3 (Catálogo de Servicios)

**Estándar de Documentación de Cátedra (UTN FRC)**  
**Proyecto:** SaaS Lavandería Multi-Negocio  
**Módulo:** Catálogo de Servicios  

---

## 1. Arquitectura y Patrones de Diseño Recomendados

### Estilo Arquitectónico: Arquitectura en Capas (Layered Architecture)
El subsistema de catálogo se estructurará siguiendo el patrón **Layered (En Capas)** para asegurar un acoplamiento débil:
*   **Capa de Presentación («boundary»)**: Panel del Gestor del Catálogo y Grilla de Servicios.
*   **Capa de Control/Servicios («control»)**: Controladores del Catálogo de Servicios y Lógica de Gestión de Imágenes de catálogo.
*   **Capa de Dominio/Entidades («entity»)**: Modelos Sequelize (`Servicio`, `CategoriaServicio`).

### Patrones de Diseño (GoF) Claves Aplicados al Módulo 3
*   **Patrón Strategy (Estrategia)**: Útil para implementar diferentes algoritmos de cálculo para reportes, descuentos promocionales o balances brutos de manera dinámica de acuerdo al tipo de cliente o temporada.
*   **Patrón Memento (Snapshot)**: Resuelve el congelamiento de precios históricos en el Módulo 4. El `DetallePedido` almacena un snapshot del `precio` del servicio al momento de la venta, independientemente de futuras modificaciones en la tarifa de catálogo.

---

## 2. Enunciación de Casos de Uso y Actores del Módulo 3

*Nomenclatura formal de la UTN FRC: Verbo en Infinitivo + Objeto.*

### Jerarquía de Actores
*   **Usuario** (Actor Abstracto).
    *   **Empleado** (Actor Físico, especialización de Usuario).
        *   **Administrador** (Especialización de Empleado).
        *   **Empleado Operativo** (Especialización de Empleado).

### Casos de Uso del Módulo 3
*   **CU-14: Registrar Categoría de Servicio** (AP: Administrador de Lavandería)
*   **CU-15: Modificar Categoría de Servicio** (AP: Administrador de Lavandería)
*   **CU-16: Consultar Categoría de Servicio** (AP: Empleado Operativo, Administrador de Lavandería)
*   **CU-17: Eliminar Categoría de Servicio** (AP: Administrador de Lavandería)
*   **CU-18: Reordenar Categorías (Drag & Drop)** (AP: Administrador de Lavandería)
*   **CU-19: Registrar Servicio** (AP: Administrador de Lavandería)
*   **CU-20: Modificar Servicio** (AP: Administrador de Lavandería)
*   **CU-21: Consultar Servicio** (AP: Empleado Operativo, Administrador de Lavandería)
*   **CU-22: Eliminar Servicio (Baja Lógica)** (AP: Administrador de Lavandería)
*   **CU-23: Actualizar Disponibilidad Rápida de Servicio** (AP: Empleado Operativo, Administrador de Lavandería)

---

## 3. Especificación del Front-End (Vistas, Subvistas y Flujos)

Esta sección describe la interacción y el comportamiento de las pantallas que permiten a los administradores gestionar el menú de servicios ofrecidos.

### 1. Panel del Gestor del Catálogo (Categorías y Servicios)
*   **Layout y Estética Visual:**
    *   Diseño en dos columnas (Grid responsivo):
        *   **Columna Izquierda (Categorías)**: Lista de categorías con soporte de ordenamiento visual.
        *   **Columna Derecha (Servicios)**: Grilla de tarjetas (Cards) de servicios pertenecientes a la categoría seleccionada.
*   **Entrada de Datos (Formulario de Servicio):**
    *   `nombre`: Texto corto. Requerido.
    *   `descripcion`: Texto largo. Opcional.
    *   `costo`: Valor numérico (Double). Requerido.
    *   `precio`: Valor numérico (Double). Requerido.
    *   `categoriaServicioId`: Selector (Dropdown) cargado con las categorías del negocio.
    *   `imagen`: Campo de carga de archivos (File input, limitado a imágenes jpg/png).
*   **Acciones:**
    *   Botón "Guardar Servicio" (POST/PUT `/api/v1/servicios`).
    *   Interruptor (Toggle) de "Disponibilidad" directo en la tarjeta del servicio (PATCH `/api/v1/servicios/:id/disponibilidad`).
*   **Heurísticas de Nielsen Aplicadas:**
    *   *Prevención de Errores (H-5):* Validación en el cliente para impedir que el usuario ingrese un `precio` menor al `costo` (margen de ganancia negativo).
    *   *Flexibilidad y Eficiencia de Uso (H-7):* Filtro de búsqueda rápida en tiempo real para encontrar servicios por nombre sin recargar la página.

---

## 4. Reglas de Negocio, Contratos y Funcionalidades Cruzadas (Choques)

### 1. Funcionalidades Cruzadas y Choques Arquitectónicos (Crucial)

Al diseñar el backend, debemos prever los siguientes choques de lógica entre el Catálogo de Servicios y otros módulos del sistema:

| Funcionalidad Catálogo | Módulo con el que Choca | Tipo de Choque / Problema | Solución / Patrón de Diseño Aplicado |
| :--- | :--- | :--- | :--- |
| **Modificar Precio de Servicio** | **Módulo 4: Pedidos** | Si un servicio cambia de precio (ej. "Lavado de Camisa" de $800 a $1000), los pedidos en proceso o históricos no deben alterar sus totales. | **Patrón Snapshot (Memento)**: El modelo `DetallePedido` almacena una copia inmutable del valor en el atributo `precioHistorico` al momento de crearse el pedido. La base de datos no calcula el total dinámicamente desde la tabla `Servicio`. |
| **Eliminar una Categoría** | **Módulo 3: Servicios** | ¿Qué pasa con los servicios asociados a esa categoría si se elimina física o lógicamente? | **Restricción de Integridad**: El backend rechazará la eliminación si la categoría contiene servicios activos (`RESTRICT` a nivel de base de datos). El administrador debe moverlos o desactivarlos primero. |
| **Eliminar un Servicio** | **Módulo 4: Pedidos** | Si se borra un servicio, se rompe la integridad referencial en el historial de pedidos de los clientes (`DetallePedido` apunta a `Servicio`). | **Borrado Lógico (Soft Delete) o Desactivación**: Prohibida la sentencia `DELETE` física en la tabla `Servicio`. Se cambia el flag `disponible = false` para ocultarlo de la venta, o se usa `paranoid: true` en Sequelize (columna `deletedAt`). |

---

### 2. Contratos de Datos (JSON Payloads)

#### A. Crear un Servicio
*   **Endpoint:** `POST /api/v1/servicios`
*   **Encabezados:** `x-tenant-id: 1`
*   **Request (JSON):**
    ```json
    {
      "nombre": "Lavado Seco Premium",
      "descripcion": "Tratamiento especial para prendas delicadas y trajes",
      "costo": 450.00,
      "precio": 1200.00,
      "categoriaServicioId": 2,
      "imagenUrl": "https://img.saas.com/servicios/lavado_seco.png"
    }
    ```
*   **Response Exitoso (201 Created):**
    ```json
    {
      "success": true,
      "message": "Servicio registrado exitosamente en el catálogo.",
      "data": {
        "id": 14,
        "nombre": "Lavado Seco Premium",
        "costo": 450.00,
        "precio": 1200.00,
        "disponible": true,
        "categoriaServicioId": 2
      }
    }
    ```

#### B. Cambiar Estado de Disponibilidad (Toggle)
*   **Endpoint:** `PATCH /api/v1/servicios/:id/disponibilidad`
*   **Request (JSON):**
    ```json
    {
      "disponible": false
    }
    ```
*   **Response Exitoso (200 OK):**
    ```json
    {
      "success": true,
      "message": "El estado de disponibilidad del servicio ha sido modificado.",
      "data": {
        "id": 14,
        "disponible": false
      }
    }
    ```

---

## 5. Plantilla UTN de Caso de Uso Esencial (Trazo Medio)

### Caso de Uso: Registrar Servicio

*   **ID:** CU-19.
*   **Actores:** Administrador (Actor principal).
*   **Precondiciones:**
    *   El Administrador ha iniciado sesión y su token JWT es válido.
    *   Existe al menos una categoría de servicio registrada previamente en el tenant.

#### Flujo Básico (Camino Feliz):
1.  El Administrador ingresa a la sección "Catálogo de Servicios".
2.  El Sistema recupera y muestra la lista de categorías y servicios del negocio.
3.  El Administrador hace clic en "Nuevo Servicio".
4.  El Administrador completa los campos obligatorios: `nombre`, `costo`, `precio` y asocia una categoría.
5.  El Administrador presiona "Guardar Servicio".
6.  El Sistema valida que las entradas cumplan con los formatos y que el precio no sea inferior al costo.
7.  El Sistema persiste el registro en la tabla `Servicios` del esquema del negocio (`tenant_{id}`).
8.  El Sistema actualiza la lista visual del catálogo mostrando el nuevo servicio.

#### Flujos Alternativos:

*   **A1: Margen de Ganancia Negativo (Paso 6)**
    1. El Sistema detecta que el `precio` ingresado es menor que el `costo` (Margen negativo).
    2. El Sistema interrumpe la persistencia y muestra una alerta en el formulario: *"El precio de venta no puede ser menor al costo del servicio."*
    3. El Administrador corrige el valor y el flujo retorna al paso 5.

*   **A2: Nombre de Servicio Duplicado en la misma Categoría (Paso 6)**
    1. El Sistema detecta que ya existe un servicio activo con el mismo nombre dentro de la categoría seleccionada para este tenant.
    2. El Sistema cancela el registro y notifica al usuario: *"Ya existe un servicio con este nombre en la categoría seleccionada."*
    3. El caso de uso finaliza.

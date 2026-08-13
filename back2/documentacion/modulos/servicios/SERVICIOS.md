# Especificación del Módulo de Catálogo de Servicios y Productos (Servicios)

Este documento detalla la lógica operativa, contratos de API, flujos de datos, modelos de base de datos y diseño técnico del **Módulo de Catálogo de Servicios y Productos (`servicios`)** para la plataforma de lavandería SaaS Multi-Tenant.

---

## 1. Alcance y Objetivos del Módulo

El módulo de Servicios y Productos es un subsistema **autónomo e independiente de alta cohesión** encargado de administrar la oferta comercial de la lavandería: catálogo de servicios de lavado, secado, planchado, tintorería, limpieza de acolchados/alfombras y la venta minorista de insumos (detergentes, suavizantes, bolsas de lavandería), junto con la parametrización de precios por kg/unidad.

### Casos de Uso del Módulo:
*   **CU-01: Registrar Servicio / Producto** (AP: Administrador de Negocio). Alta de nuevos ítems en el catálogo comercial.
*   **CU-02: Modificar Precio y Parámetros del Servicio** (AP: Administrador de Negocio). Actualización del tarifario y precios vigentes.
*   **CU-03: Consultar Catálogo Comercial** (AP: Empleado Operativo, Administrador). Listado y filtro predictivo por categoría para la venta en mostrador.
*   **CU-04: Desactivar Servicio / Producto** (AP: Administrador de Negocio). Deshabilitación lógica para impedir su selección en nuevas órdenes.

---

## 2. Modelos de Base de Datos Vinculados

El módulo interactúa con los modelos comerciales del esquema tenant (`tenant_{id}`).

### A. Modelo `Servicio` (o `Producto`)
*   `id` (DataTypes.INTEGER, **PK**, autoIncrement): Identificador único del ítem comercial.
*   `nombre` (DataTypes.STRING, allowNull: false): Nombre del servicio o producto (ej: "Lavado General por Kilo", "Planchado de Camisa", "Acolchado 2 Plazas").
*   `descripcion` (DataTypes.TEXT, allowNull: true): Detalle de la prestación o producto.
*   `precioUnitario` (DataTypes.DOUBLE, allowNull: false): Precio de lista vigente.
*   `unidadMedida` (DataTypes.STRING, defaultValue: "Unidad"): Unidad de tarificación ("Kilo", "Unidad", "Prenda").
*   `activo` (DataTypes.BOOLEAN, defaultValue: true): Flag de baja lógica (Soft Delete).
*   `categoriaId` (DataTypes.INTEGER, allowNull: false): FK hacia `CategoriaServicio`.
*   `negocioId` (DataTypes.INTEGER, allowNull: false): Llave tenant.

---

### B. Modelo `CategoriaServicio`
*   `id` (DataTypes.INTEGER, **PK**, autoIncrement): Código de la categoría.
*   `nombre` (DataTypes.STRING, allowNull: false): Nombre de la categoría (ej: "Lavandería", "Tintorería", "Planchado", "Insumos").
*   `descripcion` (DataTypes.STRING, allowNull: true): Alcance.
*   `negocioId` (DataTypes.INTEGER, allowNull: false): Llave tenant.

---

## 3. Contratos de API (JSON Payloads)

### 1. Consultar Catálogo Comercial Activo
*   **Endpoint:** `GET /api/v1/servicios`
*   **Headers:** `Authorization: Bearer <token_jwt>`
*   **Responses:**
    *   `200 OK` ➔ Retorna la lista del catálogo ordenado por categoría.
        ```json
        {
          "status": "success",
          "message": null,
          "data": [
            {
              "id": 1,
              "nombre": "Lavado Completo por Kilo",
              "precioUnitario": 1200.00,
              "unidadMedida": "Kilo",
              "categoria": { "id": 1, "nombre": "Lavandería" },
              "activo": true
            }
          ]
        }
        ```

---

### 2. Registrar Servicio en Catálogo
*   **Endpoint:** `POST /api/v1/servicios`
*   **Headers:** `Authorization: Bearer <token_jwt>`
*   **Roles Permitidos:** `admin` *(Exclusivo)*
*   **Request Body:**
    ```json
    {
      "nombre": "Limpieza de Acolchado Pluma 21/2 Plazas",
      "precioUnitario": 8500.00,
      "unidadMedida": "Unidad",
      "categoriaId": 2
    }
    ```
*   **Responses:**
    *   `201 Created` ➔ Servicio creado en catálogo.
    *   `403 Forbidden` ➔ Intento de ejecución con rol de `empleado`.

---

## 4. Algoritmos de Negocio y Lógica en los Servicios

### Algoritmo de Actualización de Tarifario con Validación de Inmutabilidad

Garantiza que la modificación de un precio en el catálogo no altere los precios cobrados en pedidos históricos (snapshot `precioHistorico` en `DetallePedido`):

```javascript
export const actualizarPrecioServicio = async (negocioId, servicioId, nuevoPrecio) => {
    const servicio = await models.Servicio.findOne({
        where: { id: servicioId, negocioId }
    });

    if (!servicio) throw new AppError("Servicio no encontrado", 404);

    if (nuevoPrecio <= 0) throw new AppError("El precio debe ser mayor a 0", 400);

    // Actualiza únicamente la tarifa vigente del catálogo.
    // Los pedidos existentes conservan su snapshot `precioHistorico` en DetallePedido.
    await servicio.update({ precioUnitario: nuevoPrecio });

    return servicio;
};
```

---

## 5. Middlewares y Filtros de Seguridad Involucrados

### `verificarRol(["admin"])`
*   Protege la creación, edición y deshabilitación de ítems del catálogo comercial para asegurar el control de precios exclusivamente por parte del dueño o gerente.

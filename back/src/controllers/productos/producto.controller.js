import * as productoService from "../../services/productos/producto.service.js";
import { successResponse } from "../../utils/response.util.js";

export const getProductos = async (req, res, next) => {
    try {
        const result = await productoService.obtenerProductos(req.user.negocioId, req.user.rol, req.query);
        return successResponse(res, 200, null, result);
    } catch (error) {
        next(error);
    }
};

export const crearProducto = async (req, res, next) => {
    try {
        const producto = await productoService.crearProducto(req.body, req.user.negocioId);
        return successResponse(res, 201, "Producto creado con éxito", producto);
    } catch (error) {
        next(error);
    }
};

export const actualizarProducto = async (req, res, next) => {
    try {
        const producto = await productoService.actualizarProducto(req.params.id, req.body, req.user.negocioId);
        return successResponse(res, 200, "Producto actualizado", producto);
    } catch (error) {
        next(error);
    }
};

export const actualizarDisponibilidad = async (req, res, next) => {
    try {
        const producto = await productoService.actualizarDisponibilidad(req.params.id, req.body.disponible, req.user.negocioId);
        return successResponse(res, 200, "Disponibilidad actualizada", producto);
    } catch (error) {
        next(error);
    }
};

export const eliminarProducto = async (req, res, next) => {
    try {
        await productoService.eliminarProducto(req.params.id, req.user.negocioId);
        return successResponse(res, 200, "Producto eliminado exitosamente");
    } catch (error) {
        next(error);
    }
};

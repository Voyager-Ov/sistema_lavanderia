import * as clienteService from "../../services/clientes/cliente.service.js";
import { successResponse } from "../../utils/response.util.js";

export const getClientes = async (req, res, next) => {
    try {
        const clientesData = await clienteService.obtenerClientes(req.user.negocioId, req.query);
        return successResponse(res, 200, null, clientesData);
    } catch (error) {
        next(error);
    }
};

export const getClienteById = async (req, res, next) => {
    try {
        const cliente = await clienteService.obtenerClientePorId(req.user.negocioId, req.params.id);
        return successResponse(res, 200, null, cliente);
    } catch (error) {
        next(error);
    }
};

export const crearCliente = async (req, res, next) => {
    try {
        const nuevoCliente = await clienteService.crearCliente(req.user.negocioId, req.body);
        return successResponse(res, 201, "Cliente creado exitosamente", nuevoCliente);
    } catch (error) {
        next(error);
    }
};

export const actualizarCliente = async (req, res, next) => {
    try {
        const clienteEditado = await clienteService.actualizarCliente(req.user.negocioId, req.params.id, req.body);
        return successResponse(res, 200, "Cliente actualizado exitosamente", clienteEditado);
    } catch (error) {
        next(error);
    }
};

export const desactivarCliente = async (req, res, next) => {
    try {
        await clienteService.desactivarCliente(req.user.negocioId, req.params.id, req.body.motivoBaja);
        return successResponse(res, 200, "Cliente dado de baja (Soft Delete)");
    } catch (error) {
        next(error);
    }
};

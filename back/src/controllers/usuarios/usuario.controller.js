import * as usuarioService from "../../services/usuarios/usuario.service.js";
import { successResponse } from "../../utils/response.util.js";

export const getUsuarios = async (req, res, next) => {
    try {
        const result = await usuarioService.obtenerUsuarios(req.user.negocioId, req.user.rol, req.user.id, req.query);
        return successResponse(res, 200, null, result);
    } catch (error) {
        next(error);
    }
};

export const getUsuarioById = async (req, res, next) => {
    try {
        const usuario = await usuarioService.obtenerUsuarioPorId(req.user.negocioId, req.user.rol, req.user.id, req.params.id);
        return successResponse(res, 200, null, usuario);
    } catch (error) {
        next(error);
    }
};

export const crearUsuario = async (req, res, next) => {
    try {
        const usuario = await usuarioService.crearUsuario(req.user.negocioId, req.body);
        return successResponse(res, 201, "Usuario creado exitosamente", usuario);
    } catch (error) {
        next(error);
    }
};

export const actualizarUsuario = async (req, res, next) => {
    try {
        const usuarioActualizado = await usuarioService.actualizarUsuario(req.user.negocioId, req.params.id, req.body);
        return successResponse(res, 200, "Usuario actualizado exitosamente", usuarioActualizado);
    } catch (error) {
        next(error);
    }
};

export const desactivarUsuario = async (req, res, next) => {
    try {
        await usuarioService.desactivarUsuario(req.user.negocioId, req.params.id, req.user.id);
        return successResponse(res, 200, "Usuario desactivado exitosamente");
    } catch (error) {
        next(error);
    }
};

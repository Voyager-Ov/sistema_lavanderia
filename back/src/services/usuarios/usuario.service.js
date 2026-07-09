import { AppError } from "../../utils/errors.js";
import { connectionManager } from "../../models/connectionManager.js";
import { getPaginationParams, getPagingData } from "../../utils/pagination.util.js";
import { Op } from "sequelize";
import { generarCodigoVerificacionEmail } from "../../utils/codeGenerator.util.js";
import * as emailService from "../email.service.js";
import bcrypt from "bcryptjs";

export const obtenerUsuarios = async (negocioId, currentRole, currentUserId, queryParams = {}) => {
    const { limit, offset, page } = getPaginationParams(queryParams);
    const { search, rol, sortBy, sortOrder } = queryParams;
    
    // Si es EMPLEADO solo puede verse a sí mismo
    if (currentRole === "EMPLEADO") {
        const usuario = await connectionManager.centralModels.Usuario.findOne({
            where: { id: currentUserId, negocioId, activo: true },
            attributes: { exclude: ["passwordHash"] }
        });
        return getPagingData({ count: usuario ? 1 : 0, rows: usuario ? [usuario] : [] }, page, limit);
    }

    let where = { negocioId, activo: true };
    if (search) {
        where[Op.or] = [
            { nombre: { [Op.iLike]: `%${search}%` } },
            { email: { [Op.iLike]: `%${search}%` } }
        ];
    }
    if (rol) {
        where.rol = rol;
    }

    let order = [["createdAt", "DESC"]];
    if (sortBy) {
        const direction = sortOrder && sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";
        order = [[sortBy, direction]];
    }

    const { count, rows } = await connectionManager.centralModels.Usuario.findAndCountAll({
        where,
        attributes: { exclude: ["passwordHash"] },
        order,
        limit,
        offset
    });

    return getPagingData({ count, rows }, page, limit);
};

export const obtenerUsuarioPorId = async (negocioId, rol, miId, targetId) => {
    if (rol === "EMPLEADO" && parseInt(targetId) !== miId) {
        throw new AppError("No tienes permiso para ver a otro usuario.", 403);
    }

    const usuario = await connectionManager.centralModels.Usuario.findOne({
        where: { id: targetId, negocioId },
        attributes: { exclude: ['passwordHash'] }
    });

    if (!usuario) {
        throw new AppError("Usuario no encontrado en este negocio.", 404);
    }

    return usuario;
};

export const crearUsuario = async (negocioId, userData) => {
    const { nombre, email, password, rol: nuevoRol, sueldoBase, horasSemanalesObjetivo } = userData;

    const existe = await connectionManager.centralModels.Usuario.findOne({ where: { email } });
    if (existe) {
        throw new AppError("El email ya está registrado.", 400);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const nuevoUsuario = await connectionManager.centralModels.Usuario.create({
        negocioId,
        nombre,
        email,
        passwordHash,
        rol: nuevoRol,
        sueldoBase: sueldoBase || 0,
        horasSemanalesObjetivo: horasSemanalesObjetivo || 40,
        activo: true,
        emailVerificado: false,
        verificationCode: generarCodigoVerificacionEmail(),
        verificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    emailService.enviarCodigoVerificacion(nuevoUsuario.email, nuevoUsuario.nombre, nuevoUsuario.verificationCode).catch(console.error);

    const dataDevuelta = nuevoUsuario.toJSON();
    delete dataDevuelta.passwordHash;
    
    return dataDevuelta;
};

export const actualizarUsuario = async (negocioId, targetId, updateData) => {
    const { nombre, sueldoBase, horasSemanalesObjetivo, rol } = updateData;

    const usuario = await connectionManager.centralModels.Usuario.findOne({ where: { id: targetId, negocioId } });
    if (!usuario) {
        throw new AppError("Usuario no encontrado.", 404);
    }

    await usuario.update({ nombre, sueldoBase, horasSemanalesObjetivo, rol });

    const dataDevuelta = usuario.toJSON();
    delete dataDevuelta.passwordHash;

    return dataDevuelta;
};

export const desactivarUsuario = async (negocioId, targetId, miId) => {
    if (parseInt(targetId) === miId) {
        throw new AppError("No puedes desactivar tu propia cuenta. Si deseas cancelar el servicio, contáctanos.", 400);
    }

    const usuario = await connectionManager.centralModels.Usuario.findOne({ where: { id: targetId, negocioId } });
    if (!usuario) {
        throw new AppError("Usuario no encontrado.", 404);
    }

    await usuario.update({ activo: false });
    return true;
};

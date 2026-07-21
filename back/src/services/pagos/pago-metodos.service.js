import { AppError } from "../../utils/errors.js";
import { models } from "../../models/index.js";

export const obtenerMetodosPago = async (negocioId) => {
    return await models.MetodoPago.findAll({ where: { negocioId } });
};

export const crearMetodoPago = async (negocioId, data) => {
    return await models.MetodoPago.create({
        negocioId,
        nombre: data.nombre,
        icono: data.icono || "Banknote",
        activo: data.activo !== undefined ? data.activo : true,
        esFijo: false
    });
};

export const toggleMetodoPago = async (negocioId, id) => {
    const metodo = await models.MetodoPago.findOne({ where: { id, negocioId } });
    if (!metodo) {
        throw new AppError("Método de pago no encontrado.", 404);
    }
    await metodo.update({ activo: !metodo.activo });
    return metodo;
};

export const eliminarMetodoPago = async (negocioId, id) => {
    const metodo = await models.MetodoPago.findOne({ where: { id, negocioId } });
    if (!metodo) {
        throw new AppError("Método de pago no encontrado.", 404);
    }
    if (metodo.esFijo) {
        throw new AppError("No se puede eliminar un método de pago fijo del sistema.", 400);
    }
    await metodo.destroy();
    return true;
};

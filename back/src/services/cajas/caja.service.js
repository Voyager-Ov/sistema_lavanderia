import { AppError } from "../../utils/errors.js";
import { models } from "../../models/index.js";

export const abrirCaja = async (negocioId, usuarioId, montoInicial) => {
    // Verificar si ya tiene una abierta
    const cajaAbierta = await models.Caja.findOne({ where: { negocioId, usuarioId, estado: "ABIERTA" } });
    if (cajaAbierta) {
        throw new AppError("No se puede abrir otra caja. Ya tienes una caja abierta.", 400);
    }

    return await models.Caja.create({
        negocioId,
        usuarioId,
        montoInicial: montoInicial || 0,
        estado: "ABIERTA"
    });
};

export const obtenerCajaActual = async (negocioId, usuarioId) => {
    const cajaAbierta = await models.Caja.findOne({
        where: { negocioId, usuarioId, estado: "ABIERTA" },
        include: [
            { model: models.Pago, as: "pagos", where: { estado: "COMPLETADO" }, required: false },
            { model: models.Gasto, as: "gastos", required: false }
        ]
    });

    if (!cajaAbierta) {
        throw new AppError("Caja actual no encontrada. No tienes ninguna caja abierta.", 404);
    }

    // Cálculos en vivo
    let totalIngresos = 0;
    let totalEgresos = 0;

    cajaAbierta.pagos.forEach(p => totalIngresos += parseFloat(p.monto));
    cajaAbierta.gastos.forEach(g => totalEgresos += parseFloat(g.monto));

    const cajaJSON = cajaAbierta.toJSON();
    cajaJSON.totalIngresosEnVivo = totalIngresos;
    cajaJSON.totalEgresosEnVivo = totalEgresos;
    cajaJSON.efectivoEsperadoEnVivo = parseFloat(cajaAbierta.montoInicial) + totalIngresos - totalEgresos;

    return cajaJSON;
};

export const cerrarCaja = async (negocioId, usuarioId, cajaId, efectivoReal) => {
    const caja = await models.Caja.findOne({
        where: { id: cajaId, negocioId, usuarioId, estado: "ABIERTA" },
        include: [
            { model: models.Pago, as: "pagos", where: { estado: "COMPLETADO" }, required: false },
            { model: models.Gasto, as: "gastos", required: false }
        ]
    });

    if (!caja) {
        throw new AppError("Caja no encontrada o ya está cerrada.", 404);
    }

    let totalIngresos = 0;
    let totalEgresos = 0;

    caja.pagos.forEach(p => totalIngresos += parseFloat(p.monto));
    caja.gastos.forEach(g => totalEgresos += parseFloat(g.monto));

    const efectivoEsperado = parseFloat(caja.montoInicial) + totalIngresos - totalEgresos;
    const diferencia = parseFloat(efectivoReal) - efectivoEsperado;

    await caja.update({
        estado: "CERRADA",
        fechaCierre: new Date(),
        totalIngresosEfectivo: totalIngresos,
        totalEgresosEfectivo: totalEgresos,
        efectivoEsperado,
        efectivoReal,
        diferenciaEfectivo: diferencia
    });

    return caja;
};

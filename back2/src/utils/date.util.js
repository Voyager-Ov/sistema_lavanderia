import { Op } from "sequelize";

/**
 * Parsea un rango de fechas de consulta (YYYY-MM-DD o ISO) para uso en Sequelize.
 * Asegura que la fecha 'hasta' cubra hasta las 23:59:59.999 del día local.
 */
export function parseDateRange(desdeStr, hastaStr) {
    if (!desdeStr && !hastaStr) return null;

    let dStart = null;
    let dEnd = null;

    if (desdeStr) {
        if (typeof desdeStr === "string" && desdeStr.includes("T")) {
            dStart = new Date(desdeStr);
        } else if (typeof desdeStr === "string" && desdeStr.includes("-")) {
            const [y, m, d] = desdeStr.split("-").map(Number);
            dStart = new Date(y, m - 1, d, 0, 0, 0, 0);
        } else {
            dStart = new Date(desdeStr);
        }
    }

    if (hastaStr) {
        if (typeof hastaStr === "string" && hastaStr.includes("T")) {
            dEnd = new Date(hastaStr);
        } else if (typeof hastaStr === "string" && hastaStr.includes("-")) {
            const [y, m, d] = hastaStr.split("-").map(Number);
            dEnd = new Date(y, m - 1, d, 23, 59, 59, 999);
        } else {
            dEnd = new Date(hastaStr);
            dEnd.setHours(23, 59, 59, 999);
        }
    }

    if (dStart && dEnd) {
        return { [Op.between]: [dStart, dEnd] };
    } else if (dStart) {
        return { [Op.gte]: dStart };
    } else if (dEnd) {
        return { [Op.lte]: dEnd };
    }
    return null;
}

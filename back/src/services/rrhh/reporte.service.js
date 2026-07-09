import { AppError } from "../../utils/errors.js";
import { models } from "../../models/index.js";
import { Op } from "sequelize";

export const obtenerReporteMensual = async (negocioId, mes, anio) => {
    // Validar parámetros
    if (!mes || !anio || mes < 1 || mes > 12) {
        throw new AppError("Mes o año inválidos.", 400);
    }

    const fechaInicio = new Date(anio, mes - 1, 1);
    const fechaFin = new Date(anio, mes, 1); // 1er día del mes siguiente

    // Obtener empleados del negocio (ignoramos a los admins para el cálculo de sueldos)
    const { connectionManager } = await import("../../models/index.js");
    const empleados = await connectionManager.centralModels.Usuario.findAll({
        where: {
            negocioId,
            rol: "EMPLEADO"
        },
        attributes: ["id", "nombre", "email", "sueldoBase", "horasSemanalesObjetivo", "activo"]
    });

    const reportes = [];

    for (const empleado of empleados) {
        // Obtener asistencias FINALIZADAS en este mes
        const asistencias = await models.RegistroAsistencia.findAll({
            where: {
                usuarioId: empleado.id,
                fechaHoraSalida: { [Op.not]: null },
                fechaHoraEntrada: {
                    [Op.gte]: fechaInicio,
                    [Op.lt]: fechaFin
                }
            }
        });

        let totalHorasTrabajadas = 0;

        for (const asistencia of asistencias) {
            // Diferencia en milisegundos a horas
            const ms = asistencia.fechaHoraSalida.getTime() - asistencia.fechaHoraEntrada.getTime();
            const horas = ms / (1000 * 60 * 60);
            totalHorasTrabajadas += horas;
        }

        // Regla de Negocio: 
        // Valor hora = sueldoBase / (horasSemanalesObjetivo * 4 semanas)
        // Sueldo estimado = totalHorasTrabajadas * valor hora
        
        let valorHora = 0;
        let sueldoEstimado = 0;
        
        const sueldoBase = parseFloat(empleado.sueldoBase) || 0;
        const horasObjetivo = parseInt(empleado.horasSemanalesObjetivo) || 40;

        if (sueldoBase > 0 && horasObjetivo > 0) {
            valorHora = sueldoBase / (horasObjetivo * 4);
            sueldoEstimado = totalHorasTrabajadas * valorHora;
        }

        reportes.push({
            empleadoId: empleado.id,
            nombre: empleado.nombre,
            email: empleado.email,
            activo: empleado.activo,
            sueldoBase,
            horasSemanalesObjetivo: horasObjetivo,
            valorHoraEstimado: parseFloat(valorHora.toFixed(2)),
            totalHorasTrabajadas: parseFloat(totalHorasTrabajadas.toFixed(2)),
            sueldoEstimado: parseFloat(sueldoEstimado.toFixed(2)),
            cantidadTurnos: asistencias.length
        });
    }

    return reportes;
};

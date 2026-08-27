import { query, validationResult } from "express-validator";
import { AppError } from "../../../utils/appError.js";

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const firstErr = errors.array()[0];
        throw new AppError(firstErr.msg, 400, "VALIDATION_ERROR");
    }
    next();
};

export const validateReporteFechas = [
    query("fechaInicio")
        .optional({ checkFalsy: true })
        .isDate({ format: "YYYY-MM-DD" })
        .withMessage("La fecha de inicio debe tener el formato YYYY-MM-DD"),
    query("fechaFin")
        .optional({ checkFalsy: true })
        .isDate({ format: "YYYY-MM-DD" })
        .withMessage("La fecha de fin debe tener el formato YYYY-MM-DD"),
    handleValidationErrors
];

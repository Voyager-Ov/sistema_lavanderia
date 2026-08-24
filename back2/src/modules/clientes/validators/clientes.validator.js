import { param, query, body, validationResult } from "express-validator";
import { AppError } from "../../../utils/appError.js";

const handleValidationErrors = (errorCode = "VALIDATION_ERROR") => {
    return (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const firstErr = errors.array()[0];
            // Si el mensaje de error indica un error específico de id o nombre o concepto, asignamos código adecuado
            let code = errorCode;
            if (firstErr.msg.includes("ID de cliente")) {
                code = "INVALID_CLIENT_ID";
            } else if (firstErr.msg.includes("nombre")) {
                code = "MISSING_CLIENT_NAME";
            } else if (firstErr.msg.includes("concepto")) {
                code = "MISSING_CONCEPT";
            } else if (firstErr.msg.includes("monto")) {
                code = firstErr.msg.includes("obligatorio") ? "MISSING_AMOUNT" : "INVALID_AMOUNT";
            }
            throw new AppError(firstErr.msg, 400, code);
        }
        next();
    };
};

export const validateIdParam = [
    param("id")
        .isInt({ min: 1 })
        .withMessage("ID de cliente inválido."),
    handleValidationErrors("INVALID_CLIENT_ID")
];

export const validateListarClientesQuery = [
    query("page")
        .optional()
        .isInt({ min: 1 })
        .withMessage("El número de página debe ser un entero positivo."),
    query("limit")
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage("El límite de elementos debe ser entre 1 y 100."),
    query("sortBy")
        .optional()
        .isIn(["id", "nombre", "apellido", "fechaAlta", "createdAt"])
        .withMessage("El campo de ordenamiento no es válido."),
    query("sortOrder")
        .optional()
        .isIn(["asc", "desc", "ASC", "DESC"])
        .withMessage("El sentido de ordenamiento debe ser ASC o DESC."),
    handleValidationErrors("INVALID_QUERY_PARAMS")
];

export const validateCrearCliente = [
    body("nombre")
        .trim()
        .notEmpty()
        .withMessage("El nombre del cliente es obligatorio.")
        .isString()
        .withMessage("El nombre debe ser una cadena de texto."),
    body("apellido")
        .optional({ nullable: true })
        .isString()
        .withMessage("El apellido debe ser una cadena de texto."),
    body("telefono")
        .optional({ nullable: true })
        .isString()
        .withMessage("El teléfono debe ser una cadena de texto."),
    body("email")
        .optional({ nullable: true, checkFalsy: true })
        .isEmail()
        .withMessage("El correo electrónico no es válido."),
    body("direccion")
        .optional({ nullable: true })
        .isString()
        .withMessage("La dirección debe ser una cadena de texto."),
    handleValidationErrors("MISSING_CLIENT_NAME")
];

export const validateActualizarCliente = [
    param("id")
        .isInt({ min: 1 })
        .withMessage("ID de cliente inválido."),
    body("nombre")
        .optional()
        .trim()
        .notEmpty()
        .withMessage("El nombre del cliente no puede estar vacío.")
        .isString(),
    body("apellido")
        .optional({ nullable: true })
        .isString(),
    body("telefono")
        .optional({ nullable: true })
        .isString(),
    body("email")
        .optional({ nullable: true, checkFalsy: true })
        .isEmail()
        .withMessage("El correo electrónico no es válido."),
    body("direccion")
        .optional({ nullable: true })
        .isString(),
    handleValidationErrors("VALIDATION_ERROR")
];

export const validateAjusteCredito = [
    param("id")
        .isInt({ min: 1 })
        .withMessage("ID de cliente inválido."),
    body("monto")
        .exists()
        .withMessage("El campo 'monto' es obligatorio.")
        .isFloat({ gt: 0 })
        .withMessage("El monto del ajuste debe ser un valor numérico positivo."),
    body("concepto")
        .trim()
        .notEmpty()
        .withMessage("El campo 'concepto' es obligatorio.")
        .isString()
        .withMessage("El concepto debe ser texto.")
        .isLength({ min: 3 })
        .withMessage("El concepto debe tener al menos 3 caracteres."),
    handleValidationErrors("VALIDATION_ERROR")
];

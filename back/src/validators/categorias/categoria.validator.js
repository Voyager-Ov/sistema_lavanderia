import { body } from "express-validator";

export const categoriaValidator = [
    body("nombre").notEmpty().withMessage("El nombre de la categoría es obligatorio").isString().trim()
];

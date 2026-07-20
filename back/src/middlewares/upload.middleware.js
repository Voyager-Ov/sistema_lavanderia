import multer from "multer";
import path from "path";
import crypto from "crypto";
import { AppError } from "../utils/errors.js";

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "public/uploads/productos");
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = crypto.randomBytes(8).toString("hex");
        const ext = path.extname(file.originalname);
        cb(null, `producto-${uniqueSuffix}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new AppError("Formato de archivo no soportado. Solo se permite .jpg, .png y .webp", 400), false);
    }
};

export const uploadProductoImagen = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 2 * 1024 * 1024 // 2MB
    }
});

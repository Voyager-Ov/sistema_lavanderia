import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";
import { AppError } from "../utils/appError.js";
import { emailService } from "../utils/email.util.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Límite máximo global de almacenamiento del sistema: 1 GB (1,073,741,824 bytes)
const MAX_SYSTEM_STORAGE_BYTES = 1 * 1024 * 1024 * 1024; // 1 GB
const UPLOADS_DIR = path.join(__dirname, "../../public/uploads");

class StorageService {
    constructor() {
        this.accountId = process.env.R2_ACCOUNT_ID;
        this.accessKeyId = process.env.R2_ACCESS_KEY_ID;
        this.secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
        this.bucketName = process.env.R2_BUCKET_NAME;
        this.publicUrl = process.env.R2_PUBLIC_URL?.replace(/\/$/, "");

        this.isR2Configured = Boolean(
            this.accountId &&
            this.accessKeyId &&
            this.secretAccessKey &&
            this.bucketName
        );

        if (this.isR2Configured) {
            this.s3Client = new S3Client({
                region: "auto",
                endpoint: `https://${this.accountId}.r2.cloudflarestorage.com`,
                credentials: {
                    accessKeyId: this.accessKeyId,
                    secretAccessKey: this.secretAccessKey,
                },
            });
            console.log("☁️ [StorageService] Cloudflare R2 activo. Límite de seguridad: 1 GB.");
        } else {
            console.log("📁 [StorageService] Almacenamiento local activo. Límite de seguridad: 1 GB.");
        }
    }

    /**
     * Calcula recursivamente el tamaño actual consumido en el directorio local de uploads
     */
    getLocalUploadsSize(dir = UPLOADS_DIR) {
        let totalSize = 0;
        try {
            if (!fs.existsSync(dir)) return 0;
            const files = fs.readdirSync(dir);
            for (const file of files) {
                const filePath = path.join(dir, file);
                const stat = fs.statSync(filePath);
                if (stat.isDirectory()) {
                    totalSize += this.getLocalUploadsSize(filePath);
                } else {
                    totalSize += stat.size;
                }
            }
        } catch (e) {
            console.warn("⚠️ [StorageService] Error al calcular espacio local:", e.message);
        }
        return totalSize;
    }

    /**
     * Procesa, comprime a WebP y sube una imagen aplicando el tope de 1 GB.
     * @param {Object} file Objeto req.file de Multer
     * @param {string} folder Subcarpeta de destino (ej: 'productos')
     * @returns {Promise<string>} URL de Cloudflare R2 o ruta estática local
     */
    async uploadFile(file, folder = "productos") {
        if (!file) return null;

        // 1. Verificar tope de 1 GB del sistema antes de procesar
        const currentSize = this.getLocalUploadsSize();
        if (currentSize >= MAX_SYSTEM_STORAGE_BYTES) {
            emailService.enviarAlertaLimiteStorage({
                espacioConsumidoBytes: currentSize,
                maxBytes: MAX_SYSTEM_STORAGE_BYTES,
                negocioId: file.negocioId || null,
                ip: file.ip || null
            }).catch(err => console.error("Error al enviar email de alerta de storage:", err));

            throw new AppError(
                "Has alcanzado el límite máximo de almacenamiento total del sistema (1 GB). Por seguridad de costos no se permiten más subidas.",
                400,
                "STORAGE_CAP_EXCEEDED"
            );
        }

        // 2. Procesar y optimizar la imagen con Sharp (Convertir a WebP ultra ligero y redimensionar a máx 1200px)
        const rawBuffer = file.buffer ? file.buffer : (file.path ? fs.readFileSync(file.path) : null);
        if (!rawBuffer) {
            throw new AppError("No se pudo leer el archivo de imagen adjunto.", 400, "INVALID_FILE_STREAM");
        }

        const webpBuffer = await sharp(rawBuffer)
            .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
            .webp({ quality: 80 })
            .toBuffer();

        // Verificar si el nuevo archivo superaría el límite de 1 GB
        if (currentSize + webpBuffer.length > MAX_SYSTEM_STORAGE_BYTES) {
            throw new AppError(
                "Esta imagen excede el límite disponible de almacenamiento seguro (1 GB max).",
                400,
                "STORAGE_CAP_EXCEEDED"
            );
        }

        const fileName = `prod-${Date.now()}-${Math.round(Math.random() * 1e9)}.webp`;

        // 3. Subir a Cloudflare R2 si está configurado
        if (this.isR2Configured) {
            const key = `${folder}/${fileName}`;
            const command = new PutObjectCommand({
                Bucket: this.bucketName,
                Key: key,
                Body: webpBuffer,
                ContentType: "image/webp",
            });

            await this.s3Client.send(command);

            // Limpiar archivo temporal en disco de Multer si existía
            if (file.path && fs.existsSync(file.path)) {
                try { fs.unlinkSync(file.path); } catch (e) {}
            }

            const baseUrl = this.publicUrl || `https://${this.bucketName}.${this.accountId}.r2.dev`;
            return `${baseUrl}/${key}`;
        }

        // 4. Si es local/fallback (cuando R2 no está activo):
        const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NOW_REGION);
        const baseUploadsDir = isServerless ? "/tmp/uploads" : UPLOADS_DIR;
        const targetDir = path.join(baseUploadsDir, folder);
        if (!fs.existsSync(targetDir)) {
            try { fs.mkdirSync(targetDir, { recursive: true }); } catch (e) {}
        }

        const targetFilePath = path.join(targetDir, fileName);
        try {
            fs.writeFileSync(targetFilePath, webpBuffer);
        } catch (err) {
            console.warn("⚠️ [StorageService] No se pudo escribir en disco local:", err.message);
        }

        // Eliminar el archivo original no-optimizado de Multer si existía en disco
        if (file.path && fs.existsSync(file.path) && file.path !== targetFilePath) {
            try { fs.unlinkSync(file.path); } catch (e) {}
        }

        return `/uploads/${folder}/${fileName}`;
    }

    /**
     * Elimina un archivo de Cloudflare R2 o del disco local
     * @param {string} fileUrl URL completa o ruta relativa
     */
    async deleteFile(fileUrl) {
        if (!fileUrl || typeof fileUrl !== "string") return;

        try {
            if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) {
                if (this.isR2Configured) {
                    const urlObj = new URL(fileUrl);
                    const key = urlObj.pathname.replace(/^\//, "");

                    const command = new DeleteObjectCommand({
                        Bucket: this.bucketName,
                        Key: key,
                    });
                    await this.s3Client.send(command);
                    console.log(`☁️ [R2 Storage] Imagen eliminada de R2: ${key}`);
                }
                return;
            }

            const cleanPath = fileUrl.replace(/^\/uploads\//, "");
            const fullPath = path.join(UPLOADS_DIR, cleanPath);
            if (fs.existsSync(fullPath)) {
                fs.unlinkSync(fullPath);
                console.log(`📁 [Local Storage] Imagen eliminada del disco: ${cleanPath}`);
            }
        } catch (error) {
            console.warn("⚠️ [StorageService] Error al intentar eliminar imagen:", error.message);
        }
    }
}

export const storageService = new StorageService();

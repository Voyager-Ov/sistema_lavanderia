import crypto from "crypto";

const algorithm = "aes-256-cbc";

// Usamos el JWT_SECRET u otra variable como llave, pero debe ser de 32 bytes.
// En caso de que sea más corto o más largo, lo hasheamos con sha256 para obtener exactamente 32 bytes.
const getKey = () => {
    const secret = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || "default_secret_key_change_me_now";
    return crypto.createHash("sha256").update(String(secret)).digest("base64").substr(0, 32);
};

export const encrypt = (text) => {
    if (!text) return null;
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, getKey(), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString("hex") + ":" + encrypted.toString("hex");
};

export const decrypt = (text) => {
    if (!text) return null;
    try {
        const textParts = text.split(":");
        const iv = Buffer.from(textParts.shift(), "hex");
        const encryptedText = Buffer.from(textParts.join(":"), "hex");
        const decipher = crypto.createDecipheriv(algorithm, getKey(), iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    } catch (error) {
        console.error("Error al desencriptar:", error);
        return null;
    }
};

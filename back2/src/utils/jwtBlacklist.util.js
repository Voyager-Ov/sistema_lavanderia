/**
 * In-Memory JWT Blacklist (Registry for Password Changes)
 * 
 * Este mapa guarda el timestamp (en milisegundos) de la última vez que un usuario
 * cambió su contraseña. Cualquier token emitido ANTES de este timestamp será rechazado.
 */
const passwordChangedMap = new Map();

/**
 * Registra que un usuario cambió su contraseña en este instante.
 * @param {string} email 
 */
export const invalidateTokensForUser = (email) => {
    if (email) {
        passwordChangedMap.set(email.toLowerCase(), Date.now());
    }
};

/**
 * Verifica si un token es válido de acuerdo a la lista negra en memoria.
 * @param {string} email - Email del usuario extraído del payload del JWT.
 * @param {number} iat - Timestamp de emisión (Issued At) en SEGUNDOS (jwt payload).
 * @returns {boolean} - true si es válido, false si fue invalidado.
 */
export const isTokenValid = (email, iat) => {
    if (!email || !iat) return false;
    
    const userEmail = email.toLowerCase();
    
    // Si el usuario no ha cambiado su clave desde que el servidor arrancó, el token es válido
    if (!passwordChangedMap.has(userEmail)) {
        return true;
    }

    const changedAtMs = passwordChangedMap.get(userEmail);
    // El JWT guarda `iat` en Segundos, mientras Date.now() es Milisegundos.
    const issuedAtMs = iat * 1000;

    // Si el token fue emitido ANTES del cambio de contraseña, es inválido.
    return issuedAtMs >= changedAtMs;
};

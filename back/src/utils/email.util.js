export const normalizeEmail = (email) => {
    if (!email || typeof email !== 'string') return email;
    
    let [localPart, domain] = email.trim().toLowerCase().split('@');
    
    if (!domain) return email.trim().toLowerCase(); // Por si no es un email válido
    
    // Ya no quitamos puntos ni alias para permitir registros múltiples con trucos de Gmail
    
    return `${localPart}@${domain}`;
};

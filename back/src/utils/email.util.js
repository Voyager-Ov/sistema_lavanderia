export const normalizeEmail = (email) => {
    if (!email || typeof email !== 'string') return email;
    
    let [localPart, domain] = email.trim().toLowerCase().split('@');
    
    if (!domain) return email.trim().toLowerCase(); // Por si no es un email válido
    
    // Si es gmail, quitamos todos los puntos de la primera parte
    if (domain === 'gmail.com' || domain === 'googlemail.com') {
        localPart = localPart.replace(/\./g, '');
    }
    
    return `${localPart}@${domain}`;
};

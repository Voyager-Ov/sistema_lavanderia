/**
 * Genera un código alfanumérico único para seguimiento de pedidos o facturas
 * @param {string} prefijo - El prefijo del código (ej: 'LAV')
 * @param {number} longitud - La longitud de la parte aleatoria
 * @returns {string} El código generado (ej: 'LAV-X98J2L')
 */
export const generarCodigoSeguimiento = (prefijo = 'LAV', longitud = 6) => {
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let resultado = '';
    for (let i = 0; i < longitud; i++) {
        const indiceAleatorio = Math.floor(Math.random() * caracteres.length);
        resultado += caracteres.charAt(indiceAleatorio);
    }
    return `${prefijo}-${resultado}`;
};

export const generarCodigoVerificacionEmail = () => {
    return Math.floor(100000 + Math.random() * 900000).toString(); // 6 dígitos numéricos
};

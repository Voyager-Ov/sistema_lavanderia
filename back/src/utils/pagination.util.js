/**
 * Extrae y valida los parámetros de paginación de la query
 * @param {Object} query - req.query de Express
 * @returns {Object} { limit, offset, page }
 */
export const getPaginationParams = (query) => {
    let page = parseInt(query.page, 10) || 1;
    let limit = parseInt(query.limit, 10) || 10;
    
    if (page < 1) page = 1;
    if (limit < 1) limit = 10;
    if (limit > 100) limit = 100; // Hard limit para evitar consultas excesivas

    const offset = (page - 1) * limit;

    return { limit, offset, page };
};

/**
 * Formatea la respuesta de findAndCountAll de Sequelize
 * @param {Object} data - Resultado de findAndCountAll ({ count, rows })
 * @param {number} page - Página actual
 * @param {number} limit - Límite de ítems por página
 * @returns {Object} Objeto con rows y meta data
 */
export const getPagingData = (data, page, limit) => {
    const { count: totalItems, rows: items } = data;
    const currentPage = page;
    const totalPages = Math.ceil(totalItems / limit);

    return {
        items,
        meta: {
            totalItems,
            totalPages,
            currentPage,
            itemsPerPage: limit
        }
    };
};

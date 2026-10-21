const getPaginationParams = (page = 1, limit = 10, maxLimit = 100) => {
    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.min(maxLimit, Math.max(1, parseInt(limit, 10) || 10));
    const offset = (parsedPage - 1) * parsedLimit;
    return { page: parsedPage, limit: parsedLimit, offset };
};

const buildPaginationResponse = (totalItems, page, limit) => {
    const total = parseInt(totalItems, 10) || 0;
    const totalPages = Math.ceil(total / limit) || 1;
    return {
        page,
        limit,
        totalItems: total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
    };
};

module.exports = {
    getPaginationParams,
    buildPaginationResponse,
};
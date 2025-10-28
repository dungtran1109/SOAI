export const HTTP_ERROR_CODE: Record<number, string> = {
    204: 'No content',
    400: 'Bad request, please check your input.',
    401: 'Unauthorized, please log in again.',
    403: 'Forbidden, you do not have permission to access this resource.',
    404: 'Not found.',
    408: 'Request timeout, please try again later.',
    429: 'Too many requests, please try again later.',
    500: 'Internal server error, please try again later.',
    502: 'Bad gateway, please try again later.',
    503: 'Service unavailable, please try again later.',
    504: 'Gateway timeout, please try again later.',
};

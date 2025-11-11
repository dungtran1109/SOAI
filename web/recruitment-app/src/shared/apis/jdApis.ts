import { API_BASE_URL } from '../constants/baseUrls';
import { HTTP_ERROR_CODE } from '../constants/httpCodes';
import { getToken } from '../helpers/authUtils';
import type { JD } from '../types/adminTypes';

/**
 * Fetch all job descriptions (JDs). Optionally filter by position, no authentication required.
 * @param {string} position - (optional) Position to filter JDs by.
 * @returns {Promise<Array>} List of JDs.
 */
export const getJDByPosition = async (position: string = ''): Promise<JD[]> => {
    const query = position ? `?position=${encodeURIComponent(position)}` : '';
    const url = `${API_BASE_URL}/recruitment/jds${query}`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${getToken()}`,
            },
        });
        if (!response.ok) {
            const message = HTTP_ERROR_CODE[response.status] || 'An unexpected error occurred.';
            throw new Error(message);
        }
        return await response.json();
    } catch (err) {
        console.error(`[DEBUG getJDByPosition] Failed to parse JSON: ${err}`);
        return [];
    }
};

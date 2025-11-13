import { API_BASE_URL } from '../constants/baseUrls';
import { HTTP_ERROR_CODE } from '../constants/httpCodes';
import { getToken } from '../helpers/authUtils';
import type { JD } from '../types/adminTypes';

/**
 * Helper for generating authorization headers.
 * If isJson is true, includes Content-Type: application/json.
 * Always includes the Bearer token.
 */
const authHeaders = (isJson: boolean = true) => ({
    ...(isJson && { 'Content-Type': 'application/json' }),
    Authorization: `Bearer ${getToken()}`,
});

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

/**
 * update an existing JD (admin only).
 * @param {Object} updatedJD - The JD data is updated by new information.
 * @returns {Promise<Object>} The updated JD info.
 */
export const updateJD = async (updatedJD: JD): Promise<{ message: string }> => {
    const url = `${API_BASE_URL}/recruitment/jds/${updatedJD.id}`;
    try {
        const response = await fetch(url, {
            method: 'PUT',
            headers: authHeaders(),
            body: JSON.stringify(updatedJD),
        });
        if (!response.ok) {
            const message = HTTP_ERROR_CODE[response.status] || 'An unexpected error occurred.';
            throw new Error(message);
        }
        return await response.json();
    } catch (err) {
        console.error(`[DEBUG updateJD] Failed to parse JSON: ${err}`);
        return { message: `Failed to update JD information: ${err}` };
    }
};

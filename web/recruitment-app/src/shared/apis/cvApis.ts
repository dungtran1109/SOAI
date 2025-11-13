import { API_BASE_URL } from '../constants/baseUrls';
import { HTTP_ERROR_CODE } from '../constants/httpCodes';
import type { CandidateCV } from '../types/adminTypes';
import { getToken } from '../helpers/authUtils';

/**
 * Helper for generating authorization headers.
 * Always includes the Bearer token.
 */
const authHeaders = (): HeadersInit => ({
    Authorization: `Bearer ${getToken()}`,
});

/**
 * Get all CVs based on position (admin).
 * @param {string} position - (optional) Position to filter CVs by.
 * @returns {Promise<Array>} List of CVs.
 */
export const getCVByPosition = async (position: string = ''): Promise<CandidateCV[]> => {
    const query = position ? `?position=${encodeURIComponent(position)}` : '';
    const url = `${API_BASE_URL}/recruitment/cvs/position${query}`;

    try {
        const response = await fetch(url, { headers: authHeaders() });
        if (!response.ok) {
            const message = HTTP_ERROR_CODE[response.status] || 'An unexpected error occurred.';
            throw new Error(message);
        }
        return await response.json();
    } catch (err) {
        console.error(`[DEBUG getCVs] Failed to parse JSON: ${err}`);
        return [];
    }
};

/**
 * Update a CV (admin).
 * @param {Object} cv - The fields to update.
 * @returns {Promise<Object>} The updated CV info.
 */
export const updateCV = async (cv: CandidateCV): Promise<{ message: string }> => {
    const url = `${API_BASE_URL}/recruitment/cvs/${cv.id}`;
    try {
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                ...authHeaders(),
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(cv),
        });

        if (!response.ok) {
            const message = HTTP_ERROR_CODE[response.status] || 'An unexpected error occurred.';
            throw new Error(message);
        }
        return await response.json();
    } catch (err) {
        console.error(`[DEBUG updateCV] Failed to parse JSON: ${err}`);
        return { message: `Failed to update candidate information: ${err}` };
    }
};

/**
 * Delete a CV (admin).
 * @param {string|number} cvId - The CV's ID.
 * @returns {Promise<Object>} The server's response.
 */
export const deleteCV = async (cvId: number): Promise<{ message: string }> => {
    const url = `${API_BASE_URL}/recruitment/cvs/${cvId}`;
    try {
        const response = await fetch(url, {
            method: 'DELETE',
            headers: authHeaders(),
        });

        if (!response.ok) {
            const message = HTTP_ERROR_CODE[response.status] || 'An unexpected error occurred.';
            throw new Error(message);
        }
        return await response.json();
    } catch (err) {
        console.error(`[DEBUG deleteCV] Failed to parse JSON: ${err}`);
        return { message: `Failed to delete candidate information: ${err}` };
    }
};

/**
 * Get a preview URL for a CV (admin).
 * @param {number} cvId - The ID of the CV to preview.
 * @returns {string} The URL to access the CV preview.
 */
export const getCVPreviewUrl = (cvId: number): string => {
    return `${API_BASE_URL}/recruitment/cvs/${cvId}/preview`;
};

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
 * Create a new JD (admin only, JSON body).
 * @param {Object} jd - The JD data.
 * @returns {Promise<Object>} The created JD info.
 */
export const createJD = async (jd: JD): Promise<{ message: string }> => {
    const url = `${API_BASE_URL}/recruitment/jds`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${getToken()}`,
            },
            body: JSON.stringify(jd),
        });

        if (!response.ok) {
            const message = HTTP_ERROR_CODE[response.status] || 'An unexpected error occurred.';
            throw new Error(message);
        }
        return await response.json();
    } catch (err) {
        console.error(`[DEBUG createJD] Failed to parse JSON: ${err}`);
        return { message: `Failed to create a job description: ${err}` };
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

/**
 * Delete a JD by ID (admin only).
 * @param {string|number} jdId - The ID of the JD to delete.
 * @returns {Promise<Object>} The server's response.
 */
export const deleteJD = async (jdId: number): Promise<{ message: string }> => {
    const url = `${API_BASE_URL}/recruitment/jds/${jdId}`;
    try {
        const response = await fetch(url, {
            method: 'DELETE',
            headers: authHeaders(false),
        });

        if (!response.ok) {
            const message = HTTP_ERROR_CODE[response.status] || 'An unexpected error occurred.';
            throw new Error(message);
        }
        return await response.json();
    } catch (err) {
        console.error(`[DEBUG deleteJD] Failed to parse JSON: ${err}`);
        return { message: `Failed to delete a job description: ${err}` };
    }
};

/**
 * Get a JD preview URL (admin only).
 * @param {number} jdId - The ID of the JD to preview.
 * @returns {string} The URL to access the JD preview.
 */
export const getJDPreviewUrl = (jdId: number): string => {
    return `${API_BASE_URL}/recruitment/jds/${jdId}/preview`;
};

/**
 * Upload a new JD file (admin only).
 * Uses FormData, so Content-Type is not set manually.
 * @param {File} file - The JD file to upload.
 * @returns {Promise<Object>} The uploaded JD info.
 */
export const uploadJDFile = async (file: File): Promise<{ message: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const url = `${API_BASE_URL}/recruitment/jds/upload`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { Authorization: `Bearer ${getToken()}` }, // Don't set Content-Type for FormData
            body: formData,
        });

        if (!response.ok) {
            const message = HTTP_ERROR_CODE[response.status] || 'An unexpected error occurred.';
            throw new Error(message);
        }
        return await response.json();
    } catch (err) {
        console.error(`[DEBUG uploadJDFile] Failed to parse JSON: ${err}`);
        return { message: `Failed to upload a file of job description: ${err}` };
    }
};

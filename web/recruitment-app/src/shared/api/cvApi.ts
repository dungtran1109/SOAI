import { API_BASE_URL } from '../constants/baseUrl';
import { HTTP_ERROR_CODE } from '../constants/httpCode';
import type { CandidateCV } from '../interfaces/adminInterface';
import { getToken } from '../utils/authUtils';

const authHeaders = (): HeadersInit => ({
    Authorization: `Bearer ${getToken()}`,
});

export const fetchCVsByPosition = async (position: string = ''): Promise<CandidateCV[]> => {
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
        console.log(`[DEBUG fetchCVsByPosition] Failed to parse JSON: ${err}`);
        return [];
    }
};

export const getCVPreviewUrl = (cvId: number): string => {
    return `${API_BASE_URL}/recruitment/cvs/${cvId}/preview`;
};

export const updateCV = async (updateData: CandidateCV): Promise<{ message: string }> => {
    const url = `${API_BASE_URL}/recruitment/cvs/${updateData.id}`;
    try {
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                ...authHeaders(),
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updateData),
        });

        if (!response.ok) {
            const message = HTTP_ERROR_CODE[response.status] || 'An unexpected error occurred.';
            throw new Error(message);
        }
        return await response.json();
    } catch (err) {
        console.log(`[DEBUG updateCV] Failed to parse JSON: ${err}`);
        return { message: `Failed to update candidate information: ${err}` };
    }
};

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
        console.log(`[DEBUG deleteCV] Failed to parse JSON: ${err}`);
        return { message: `Failed to delete candidate information: ${err}` };
    }
};

import { RECRUITMENT_API_URL_PREFIX } from '../../shared/constants/baseUrls';
import type { JD } from '../../shared/types/adminTypes';
import axiosClient from '../axios/axiosClient';

/**
 * Get all existing job descriptions (JDs) (admin role).
 * @param position - Position of a job description (optional).
 * @returns List of job description.
 */
export const getJDs = async (position: string = ''): Promise<JD[]> => {
    interface Params {
        position?: string;
    }
    try {
        const params: Params = {};
        if (position) params.position = position;
        return axiosClient.get('/jds', { params });
    } catch (error) {
        console.error('[DEBUG getJDs]', error);
        return [];
    }
};

/**
 * Create a new job description (JD) (admin role).
 * @param jdData - Object include JD data.
 * @returns Object includes a message after creating a new JD.
 */
export const createJD = async (jdData: JD): Promise<{ message: string }> => {
    try {
        return axiosClient.post('/jds', jdData);
    } catch (error) {
        console.error('[DEBUG createJD]', error);
        return { message: `${error}` };
    }
};

/**
 * Create a job description (JD) by uploading a JSON file (admin only).
 * @param file - The JD uploaded file (JSON format).
 * @returns Object includes a message after creating a new JD by uploading JSON file.
 */
export const uploadJDFile = async (file: File): Promise<{ message: string }> => {
    try {
        const formData = new FormData();
        formData.append('file', file);
        return axiosClient.post('/jds/upload', formData);
    } catch (error) {
        console.error('[DEBUG uploadJDFile]', error);
        return { message: `${error}` };
    }
};

/**
 * Update properties a job description (JD) (admin role).
 * @param updatedJD - Object include new JD data.
 * @returns Object includes a message after update properties of a JD.
 */
export const updateJD = async (updatedJD: JD): Promise<{ message: string }> => {
    try {
        return axiosClient.put(`/jds/${updatedJD.id}`, updatedJD);
    } catch (error) {
        console.error('[DEBUG updateJD]', error);
        return { message: `${error}` };
    }
};

/**
 * Delete a job description (JD) (admin role).
 * @param jdId - ID of a JD.
 * @returns Object includes a message after deleting the JD.
 */
export const deleteJD = async (jdId: number): Promise<{ message: string }> => {
    try {
        return axiosClient.delete(`/jds/${jdId}`);
    } catch (error) {
        console.error('[DEBUG deleteJD]', error);
        return { message: `${error}` };
    }
};

/**
 * Get a preview URL of a job description (JD) (admin role).
 * @param jdId - ID of a JD.
 * @returns Preview URL of the JD.
 */
export const getJDPreviewUrl = (jdId: number): string => {
    return `${RECRUITMENT_API_URL_PREFIX}/jds/${jdId}/preview`;
};

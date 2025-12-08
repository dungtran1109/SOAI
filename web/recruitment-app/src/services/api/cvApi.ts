import axiosClient from '../axios/axiosClient';
import type { CV } from '../../shared/types/adminTypes';
import { RECRUITMENT_API_URL_PREFIX } from '../../shared/constants/baseUrls';

/**
 * Get all existing CVs (admin role).
 * @param position - Position that candidates applied following JDs (optional).
 * @returns List of candidate CVs.
 */
export const getCVs = async (position: string = ''): Promise<CV[]> => {
    interface Params {
        position?: string;
    }
    try {
        const params: Params = {};
        if (position) params.position = position;

        return axiosClient.get('/cvs/position', { params });
    } catch (error) {
        console.error('[DEBUG getCVs]', error);
        return [];
    }
};

/**
 * Get all approved CVs that are waiting for scheduling interview (admin role).
 * @param candidateName - Name of candidate (optional).
 * @returns List of approved CVs.
 */
export const getApprovedCVs = async (candidateName: string = ''): Promise<CV[]> => {
    interface Params {
        candidate_name?: string;
    }
    try {
        const params: Params = {};
        if (candidateName) params.candidate_name = candidateName;
        return axiosClient.get('/cvs/approved', { params });
    } catch (error) {
        console.error('[DEBUG getApprovedCVs]', error);
        return [];
    }
};

/**
 * Update properties of a CV (admin role).
 * @param cv - Object include new CV data.
 * @returns Object includes a message after updating properties of the CV.
 */
export const updateCV = async (cv: CV): Promise<{ message: string }> => {
    try {
        return axiosClient.put(`/cvs/${cv.id}`, cv);
    } catch (error) {
        console.error('[DEBUG updateCV]', error);
        return { message: `${error}` };
    }
};

/**
 * Delete a CV (admin role).
 * @param cvId - ID of a CV.
 * @returns Object includes a message after deleting the CV.
 */
export const deleteCV = async (cvId: number): Promise<{ message: string }> => {
    try {
        return axiosClient.delete(`/cvs/${cvId}`);
    } catch (error) {
        console.error('[DEBUG deleteCV]', error);
        return { message: `${error}` };
    }
};

/**
 * Get a preview URL of a CV (admin role).
 * @param cvId - ID of a CV.
 * @returns Preview URL of the CV.
 */
export const getCVPreviewUrl = (cvId: number): string => {
    return `${RECRUITMENT_API_URL_PREFIX}/cvs/${cvId}/preview`;
};

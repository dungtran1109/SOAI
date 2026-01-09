import axiosClient from '../axios/axiosClient';
import type { CV } from '../../shared/types/adminTypes';
import { RECRUITMENT_API_BASE_URL } from '../../shared/constants/baseUrls';
import type { AppliedJob } from '../../shared/types/userTypes';

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
    return `${RECRUITMENT_API_BASE_URL}/cvs/${cvId}/preview`;
};

/**
 * Upload a CV file (user role).
 * @param file - The CV file to upload.
 * @param position - The position that candidate applied.
 * @param email - Override email address (optional).
 * @returns Object includes a message after uploading CV.
 */
export const uploadCV = async (file: File, jdId: number, email: string | null = null): Promise<{ message: string }> => {
    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('jd_id', String(jdId));
        if (email) formData.append('override_email', email);
        return axiosClient.post('/cvs/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    } catch (error) {
        console.error('[DEBUG uploadCV]', error);
        return { message: `${error}` };
    }
};

/**
 * Get all owner application information (user role).
 * @returns List of user application.
 */
export const getUserAppliedJobs = async (): Promise<AppliedJob[]> => {
    try {
        return axiosClient.get(`/cvs/me`);
    } catch (error) {
        console.error('[DEBUG getUserAppliedJobs]', error);
        return [];
    }
};

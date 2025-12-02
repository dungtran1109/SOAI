import { API_BASE_URL } from '../../shared/constants/baseUrls';
import { HTTP_ERROR_CODE } from '../../shared/constants/httpCodes';
import { getToken } from '../../shared/helpers/authUtils';
import type { CV, Interview, InterviewQuestion, ScheduleInterview } from '../../shared/types/adminTypes';

/**
 * Helper for generating authorization headers.
 */
const authHeaders = (isJson = true) => ({
    ...(isJson && { 'Content-Type': 'application/json' }),
    Authorization: `Bearer ${getToken()}`,
});

/**
 * Get all interview sessions (admin only).
 * @param {string} interviewDate - Interview date
 * @param {string} candidateName - Candidate name
 * @returns {Promise<Array>}
 */
export const getInterviews = async (interviewDate: string = '', candidateName: string = ''): Promise<Interview[]> => {
    const query = [];
    if (interviewDate) {
        query.push(`interview_date=${encodeURIComponent(interviewDate)}`);
    }
    if (candidateName) {
        query.push(`candidate_name=${encodeURIComponent(candidateName)}`);
    }

    const queryString = query.length > 0 ? `?${query.join('&')}` : '';
    const url = `${API_BASE_URL}/recruitment/interviews${queryString}`;
    try {
        const response = await fetch(url, { headers: authHeaders(false) });
        if (!response.ok) {
            const message = HTTP_ERROR_CODE[response.status] || 'An unexpected error occurred.';
            throw new Error(message);
        }
        return await response.json();
    } catch (err) {
        console.error(`[DEBUG getInterviews] Failed to parse JSON: ${err}`);
        return [];
    }
};

/**
 * Get all approved CVs (admin).
 * @param {string} [candidateName] - Optional candidate name filter.
 * @returns {Promise<Array>} List of approved CVs.
 * @description This fetches all CVs that have been approved by the admin.
 * This is useful for displaying a list of candidates who have been approved for further recruitment steps.
 */
export const getApprovedCVs = async (candidateName = ''): Promise<CV[]> => {
    const query = candidateName ? `?candidate_name=${encodeURIComponent(candidateName)}` : '';
    const url = `${API_BASE_URL}/recruitment/cvs/approved${query}`;
    try {
        const response = await fetch(url, {
            headers: authHeaders(),
        });
        if (!response.ok) {
            const message = HTTP_ERROR_CODE[response.status] || 'An unexpected error occurred.';
            throw new Error(message);
        }
        return await response.json();
    } catch (err) {
        console.error(`[DEBUG getApprovedCVs] Failed to parse JSON: ${err}`);
        return [];
    }
};

/**
 * Schedule an interview (admin only).
 * @param {Object} interviewData
 * @returns {Promise<Object>}
 */
export const scheduleInterview = async (interviewData: ScheduleInterview): Promise<{ message: string }> => {
    const url = `${API_BASE_URL}/recruitment/interviews/schedule`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(interviewData),
        });
        if (!response.ok) {
            const message = HTTP_ERROR_CODE[response.status] || 'An unexpected error occurred.';
            throw new Error(message);
        }
        return await response.json();
    } catch (err) {
        console.error(`[DEBUG scheduleInterview] Failed to parse JSON: ${err}`);
        return { message: `Failed to schedule interview session: ${err}` };
    }
};

/**
 * Generate interview questions for a CV (admin only).
 * @param {number|string} cvId
 * @returns {Promise<Array>}
 */
export const generateInterviewQuestions = async (cvId: number): Promise<InterviewQuestion[]> => {
    const url = `${API_BASE_URL}/recruitment/interview-questions/${cvId}/questions/regenerate`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: authHeaders(false),
        });
        if (!response.ok) {
            const message = HTTP_ERROR_CODE[response.status] || 'An unexpected error occurred.';
            throw new Error(message);
        }
        return await response.json();
    } catch (err) {
        console.error(`[DEBUG generatesInterviewQuestions] Failed to parse JSON: ${err}`);
        return [];
    }
};

/**
 * Get available interview questions for a CV (admin only).
 * @param {number|string} cvId
 * @returns {Promise<Array>}
 */
export const getAvailableInterviewQuestions = async (cvId: number): Promise<InterviewQuestion[]> => {
    const url = `${API_BASE_URL}/recruitment/interview-questions/${cvId}/questions`;
    try {
        const response = await fetch(url, { headers: authHeaders(false) });
        if (!response.ok) {
            const message = HTTP_ERROR_CODE[response.status] || 'An unexpected error occurred.';
            throw new Error(message);
        }
        return await response.json();
    } catch (err) {
        console.error(`[DEBUG getAvailableInterviewQuestions] Failed to parse JSON: ${err}`);
        return [];
    }
};

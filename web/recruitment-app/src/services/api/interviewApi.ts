import type { Interview, InterviewSchedule, InterviewSession, InterviewQuestion } from '../../shared/types/adminTypes';
import axiosClient from '../axios/axiosClient';

/**
 * Get all scheduled interview sessions (admin role).
 * @param interviewDate - Datetime of interview session (optional).
 * @param candidateName - Name of candidate (optional).
 * @returns List of scheduled interviews.
 */
export const getInterviews = async (interviewDate: string = '', candidateName: string = ''): Promise<Interview[]> => {
    interface Params {
        interview_date?: string;
        candidate_name?: string;
    }
    try {
        const params: Params = {};
        if (interviewDate) params.interview_date = interviewDate;
        if (candidateName) params.candidate_name = candidateName;
        return await axiosClient.get('/interviews', { params });
    } catch (error) {
        console.error('[DEBUG getInterviews]', error);
        return [];
    }
};

/**
 * Schedule an interview session (admin role).
 * @param interviewData - Data object of interview session.
 * @returns Object includes a message after scheduling an interview session.
 */
export const scheduleInterview = async (interviewData: InterviewSchedule): Promise<{ message: string }> => {
    try {
        return axiosClient.post('/interviews/schedule', interviewData);
    } catch (error) {
        console.error('[DEBUG scheduleInterview]', error);
        return { message: `${error}` };
    }
};

/**
 * Accept an interview session (admin role).
 * @param interviewData - Data object of interview session.
 * @returns Object includes a message after accepting an interviewed session.
 */
export const acceptInterview = async (interviewData: InterviewSession): Promise<{ message: string }> => {
    try {
        const param = {
            candidate_name: interviewData.candidate_name,
            interview_datetime: interviewData.interview_datetime,
            candidate_id: interviewData.id,
        };

        return axiosClient.post('/interviews/accept', param);
    } catch (error) {
        console.error('[DEBUG acceptInterview]', error);
        return { message: `${error}` };
    }
};

/**
 * Delete an interview session (admin role).
 * @param interviewId - ID of interview session.
 * @returns Object includes a message after deleting an interview session.
 */
export const deleteInterview = async (interviewId: number): Promise<{ message: string }> => {
    try {
        return axiosClient.delete(`/interviews/${interviewId}`);
    } catch (error) {
        console.error('[DEBUG deleteInterview]', error);
        return { message: `${error}` };
    }
};

/**
 * Cancel an interview session (admin role).
 * @param interviewId - ID of interview session.
 * @returns Object includes a message after canceling an interview session.
 */
export const cancelInterview = async (interviewId: number): Promise<{ message: string }> => {
    try {
        return axiosClient.post(`/interviews/${interviewId}/cancel`);
    } catch (error) {
        console.error('[DEBUG cancelInterview]', error);
        return { message: `${error}` };
    }
};

/**
 * Generate potential interview questions following candidate insight (admin role).
 * @param cvId - ID of cadidate CV.
 * @returns List of potential questions.
 */
export const generateInterviewQuestions = async (cvId: number): Promise<InterviewQuestion[]> => {
    try {
        return axiosClient.post(`/interview-questions/${cvId}/questions/regenerate`);
    } catch (error) {
        console.error('[DEBUG generateInterviewQuestions]', error);
        return [];
    }
};

/**
 * Get available interview questions that were generated in last (admin role).
 * @param cvId - ID of cadidate CV.
 * @returns List of available interview questions.
 */
export const getAvailableInterviewQuestions = async (cvId: number): Promise<InterviewQuestion[]> => {
    try {
        return axiosClient.get(`/interview-questions/${cvId}/questions`);
    } catch (error) {
        console.error('[DEBUG getAvailableInterviewQuestions]', error);
        return [];
    }
};

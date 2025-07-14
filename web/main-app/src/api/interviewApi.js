import { API_BASE_URL } from "../constants/constants";
import { handleResponse } from "./responseHandler";
import { getToken } from "./authApi";

/**
 * Helper for generating authorization headers.
 */
const authHeaders = (isJson = true) => ({
  ...(isJson && { "Content-Type": "application/json" }),
  "Authorization": `Bearer ${getToken()}`
});

// === INTERVIEW SERVICES ===

/**
 * Schedule an interview (admin only).
 * @param {Object} interviewData
 * @returns {Promise<Object>}
 */
export const scheduleInterview = async (interviewData) => {
  const response = await fetch(`${API_BASE_URL}/recruitment/interviews/schedule`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(interviewData),
  });
  return await handleResponse(response);
};

/**
 * Get all interviews (admin only).
 * @param {Object} params - { interview_date, candidate_name }
 * @returns {Promise<Array>}
 */
export const getInterviews = async (params = {}) => {
  const query = [];
  if (params.interview_date) {
    query.push(`interview_date=${encodeURIComponent(params.interview_date)}`);
  }
  if (params.candidate_name) {
    query.push(`candidate_name=${encodeURIComponent(params.candidate_name)}`);
  }
  const queryString = query.length > 0 ? `?${query.join("&")}` : "";
  const url = `${API_BASE_URL}/recruitment/interviews${queryString}`;

  const response = await fetch(url, {
    headers: authHeaders(false),
  });
  return await handleResponse(response);
};

/**
 * Delete an interview by ID (admin only).
 * @param {number|string} interviewId
 * @returns {Promise<Object>}
 */
export const deleteInterview = async (interviewId) => {
  const response = await fetch(`${API_BASE_URL}/recruitment/interviews/${interviewId}`, {
    method: "DELETE",
    headers: authHeaders(false),
  });
  return await handleResponse(response);
};

/**
 * Delete all interviews (admin only, optional candidate_name filter).
 * @param {string} candidateName
 * @returns {Promise<Object>}
 */
export const deleteAllInterviews = async (candidateName = "") => {
  const query = candidateName ? `?candidate_name=${encodeURIComponent(candidateName)}` : "";
  const url = `${API_BASE_URL}/recruitment/interviews${query}`;

  const response = await fetch(url, {
    method: "DELETE",
    headers: authHeaders(false),
  });
  return await handleResponse(response);
};

/**
 * Accept interview (candidate).
 * @param {Object} acceptData
 * @returns {Promise<Object>}
 */
export const acceptInterview = async (acceptData) => {
  const response = await fetch(`${API_BASE_URL}/recruitment/interviews/accept`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(acceptData),
  });
  return await handleResponse(response);
};

/**
 * Update interview (admin only).
 * @param {number|string} interviewId
 * @param {Object} updateData
 * @returns {Promise<Object>}
 */
export const updateInterview = async (interviewId, updateData) => {
  const response = await fetch(`${API_BASE_URL}/recruitment/interviews/${interviewId}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(updateData),
  });
  return await handleResponse(response);
};

/**
 * Cancel interview (candidate).
 * @param {number|string} interviewId
 * @returns {Promise<Object>}
 */
export const cancelInterview = async (interviewId) => {
  const response = await fetch(`${API_BASE_URL}/recruitment/interviews/${interviewId}/cancel`, {
    method: "POST",
    headers: authHeaders(false),
  });
  return await handleResponse(response);
};

// === INTERVIEW QUESTION SERVICES ===

/**
 * Get interview questions for a CV (admin only).
 * @param {number|string} cvId
 * @returns {Promise<Array>}
 */
export const getInterviewQuestions = async (cvId) => {
  const response = await fetch(`${API_BASE_URL}/recruitment/interview-questions/${cvId}/questions`, {
    headers: authHeaders(false),
  });
  return await handleResponse(response);
};

/**
 * Edit an interview question (admin only).
 * @param {number|string} questionId
 * @param {string} newQuestion
 * @returns {Promise<Object>}
 */
export const editInterviewQuestion = async (questionId, newQuestion) => {
  const response = await fetch(`${API_BASE_URL}/recruitment/interview-questions/${questionId}/edit`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({ new_question: newQuestion }),
  });
  return await handleResponse(response);
};

/**
 * Regenerate interview questions for a CV (admin only).
 * @param {number|string} cvId
 * @returns {Promise<Array>}
 */
export const regenerateInterviewQuestions = async (cvId) => {
  const response = await fetch(`${API_BASE_URL}/recruitment/interview-questions/${cvId}/questions/regenerate`, {
    method: "POST",
    headers: authHeaders(false),
  });
  return await handleResponse(response);
};
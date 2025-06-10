import { API_BASE_URL } from "../constants/constants";
import { handleResponse } from "./responseHandler";
import { getToken } from "./authApi";

/**
 * Helper for generating authorization headers.
 * Always includes the Bearer token.
 */
const authHeaders = () => ({
  'Authorization': `Bearer ${getToken()}`
});

// === CV SERVICES ===

/**
 * Upload a CV file (candidate).
 * Uses FormData, so Content-Type is not set manually.
 * @param {File} file - The CV file to upload.
 * @param {string} position_applied_for - The position the candidate is applying for.
 * @param {string|null} override_email - (optional) Override email address.
 * @returns {Promise<Object>} The uploaded CV info.
 */
export const uploadCV = async (file, position_applied_for, override_email = null) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("position_applied_for", position_applied_for);
  if (override_email) formData.append("override_email", override_email);

  const response = await fetch(`${API_BASE_URL}/api/v1/recruitment/cvs/upload`, {
    method: "POST",
    headers: authHeaders(),
    body: formData,
  });
  return await handleResponse(response);
};

/**
 * Approve a CV (admin).
 * @param {string|number} candidateId - The candidate's ID.
 * @returns {Promise<Object>} The approval result.
 */
export const approveCV = async (candidateId) => {
  const response = await fetch(`${API_BASE_URL}/api/v1/recruitment/cvs/${candidateId}/approve`, {
    method: "POST",
    headers: authHeaders()
  });
  return await handleResponse(response);
};

/**
 * Get all pending CVs (admin).
 * @returns {Promise<Array>} List of pending CVs.
 */
export const getPendingCVs = async () => {
  const response = await fetch(`${API_BASE_URL}/api/v1/recruitment/cvs/pending`, {
    headers: authHeaders()
  });
  return await handleResponse(response);
};

/**
 * Update a CV (admin).
 * @param {string|number} cvId - The CV's ID.
 * @param {Object} updateData - The fields to update.
 * @returns {Promise<Object>} The updated CV info.
 */
export const updateCV = async (cvId, updateData) => {
  const response = await fetch(`${API_BASE_URL}/api/v1/recruitment/cvs/${cvId}`, {
    method: "PUT",
    headers: {
      ...authHeaders(),
      "Content-Type": "application/json"
    },
    body: JSON.stringify(updateData)
  });
  return await handleResponse(response);
};

/**
 * Delete a CV (admin).
 * @param {string|number} cvId - The CV's ID.
 * @returns {Promise<Object>} The server's response.
 */
export const deleteCV = async (cvId) => {
  const response = await fetch(`${API_BASE_URL}/api/v1/recruitment/cvs/${cvId}`, {
    method: "DELETE",
    headers: authHeaders()
  });
  return await handleResponse(response);
};

/**
 * List all CVs by position (admin).
 * @param {string} position - (optional) Position to filter CVs by.
 * @returns {Promise<Array>} List of CVs.
 */
export const listCVsByPosition = async (position = "") => {
  const url = new URL(`${API_BASE_URL}/api/v1/recruitment/cvs/position`);
  if (position) url.searchParams.append("position", position);

  const response = await fetch(url, {
    headers: authHeaders()
  });
  return await handleResponse(response);
};

/**
 * Get a CV by ID (admin).
 * @param {string|number} cvId - The CV's ID.
 * @returns {Promise<Object>} The CV info.
 */
export const getCVById = async (cvId) => {
  const response = await fetch(`${API_BASE_URL}/api/v1/recruitment/cvs/${cvId}`, {
    headers: authHeaders()
  });
  return await handleResponse(response);
};
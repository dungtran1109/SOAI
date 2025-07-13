import { API_BASE_URL } from "../constants/constants";
import { handleResponse } from "./responseHandler";
import { getToken } from "./authApi";

/**
 * Helper for generating authorization headers.
 * If isJson is true, includes Content-Type: application/json.
 * Always includes the Bearer token.
 */
const authHeaders = (isJson = true) => ({
  ...(isJson && { "Content-Type": "application/json" }),
  "Authorization": `Bearer ${getToken()}`
});

// === JD SERVICES ===

/**
 * Fetch all job descriptions (JDs).
 * Optionally filter by position.
 * No authentication required.
 * @param {string} position - (optional) Position to filter JDs by.
 * @returns {Promise<Array>} List of JDs.
 */
export const getAllJD = async (position = "") => {
  const query = position ? `?position=${encodeURIComponent(position)}` : "";
  const url = `${API_BASE_URL}/recruitment/jds${query}`;
  const response = await fetch(url, {
    method: "GET"
  });
  return (await handleResponse(response)) || [];
};

/**
 * Upload a new JD file (admin only).
 * Uses FormData, so Content-Type is not set manually.
 * @param {File} file - The JD file to upload.
 * @returns {Promise<Object>} The uploaded JD info.
 */
export const uploadJDFile = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch(`${API_BASE_URL}/recruitment/jds/upload`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${getToken()}` }, // Don't set Content-Type for FormData
    body: formData,
  });
  return await handleResponse(response);
};

/**
 * Create a new JD (admin only, JSON body).
 * @param {Object} jdData - The JD fields.
 * @returns {Promise<Object>} The created JD info.
 */
export const createJD = async (jdData) => {
  const response = await fetch(`${API_BASE_URL}/recruitment/jds`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${getToken()}`
    },
    body: JSON.stringify(jdData),
  });
  return await handleResponse(response);
};

/**
 * Edit an existing JD (admin only).
 * @param {string|number} jdId - The ID of the JD to edit.
 * @param {Object} updateData - The fields to update.
 * @returns {Promise<Object>} The updated JD info.
 */
export const editJD = async (jdId, updateData) => {
  const response = await fetch(`${API_BASE_URL}/recruitment/jds/${jdId}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(updateData),
  });
  return await handleResponse(response);
};

/**
 * Delete a JD by ID (admin only).
 * @param {string|number} jdId - The ID of the JD to delete.
 * @returns {Promise<Object>} The server's response.
 */
export const deleteJD = async (jdId) => {
  const response = await fetch(`${API_BASE_URL}/recruitment/jds/${jdId}`, {
    method: "DELETE",
    headers: authHeaders(false), // Don't set Content-Type for DELETE
  });
  return await handleResponse(response);
};

/**
 * Delete all JDs (admin only).
 * @returns {Promise<Object>} The server's response.
 */
export const deleteAllJDs = async () => {
  const response = await fetch(`${API_BASE_URL}/recruitment/jds`, {
    method: "DELETE",
    headers: authHeaders(false),
  });
  return await handleResponse(response);
};

/**
 * Get a JD by ID (admin only).
 * @param {string|number} jdId - The ID of the JD to fetch.
 * @returns {Promise<Object>} The JD info.
 */
export const getJDById = async (jdId) => {
  const response = await fetch(`${API_BASE_URL}/recruitment/jds/${jdId}`, {
    headers: authHeaders()
  });
  return await handleResponse(response);
};

/**
 * Get a JD preview URL (admin only).
 * @param {string|number} jdId - The ID of the JD to preview.
 * @returns {string} The URL to access the JD preview.
 */
export const getJDPreviewUrl = (jdId) => {
  return `${API_BASE_URL}/recruitment/jds/${jdId}/preview`;
};

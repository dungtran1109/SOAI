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
 * @param {string} position - (optional) Position to filter JDs by.
 * @returns {Promise<Array>} List of JDs.
 */
export const getAllJD = async (position = "") => {
  const query = position ? `?position=${encodeURIComponent(position)}` : "";
  const url = `${API_BASE_URL}/recruitment/jds${query}`;
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: authHeaders(),
    });
    // Returns an array of JDs or an empty array if none found
    return (await handleResponse(response)) || [];
  } catch (error) {
    console.error("Error fetching JD list:", error);
    throw error;
  }
};

/**
 * Upload a new JD file.
 * Uses FormData, so Content-Type is not set manually.
 * @param {File} file - The JD file to upload.
 * @returns {Promise<Object>} The uploaded JD info.
 */
export const uploadJDFile = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  try {
    const response = await fetch(`${API_BASE_URL}/recruitment/jds/upload`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${getToken()}` }, // Don't set Content-Type for FormData
      body: formData,
    });
    return await handleResponse(response);
  } catch (error) {
    console.error("Error uploading JD:", error);
    throw error;
  }
};

/**
 * Edit an existing JD.
 * @param {string|number} jdId - The ID of the JD to edit.
 * @param {Object} updateData - The fields to update.
 * @returns {Promise<Object>} The updated JD info.
 */
export const editJD = async (jdId, updateData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/recruitment/jds/${jdId}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(updateData),
    });
    return await handleResponse(response);
  } catch (error) {
    console.error("Error updating JD:", error);
    throw error;
  }
};

/**
 * Delete a JD by ID.
 * @param {string|number} jdId - The ID of the JD to delete.
 * @returns {Promise<Object>} The server's response.
 */
export const deleteJD = async (jdId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/recruitment/jds/${jdId}`, {
      method: "DELETE",
      headers: authHeaders(false), // Don't set Content-Type for DELETE
    });
    return await handleResponse(response);
  } catch (error) {
    console.error("Error deleting JD:", error);
    throw error;
  }
};
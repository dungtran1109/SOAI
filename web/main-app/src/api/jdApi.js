import { API_BASE_URL } from "../constants/constants";
import Cookies from 'js-cookie';
import { handleResponse } from "./responseHandler";

// === AUTH HELPERS ===

export const getToken = () => {
    try {
        return getProfile()?.token || null;
    } catch (err) {
        console.error('Error retrieving token:', err.message || err);
        return null;
    }
};

export const getProfile = () => {
    try {
        const cookie = Cookies.get('profile');
        return cookie ? JSON.parse(cookie) : null;
    } catch (err) {
        console.error('Error retrieving profile:', err.message || err);
        return null;
    }
};

// === JD SERVICES ===

export const getAllJD = async (position = "") => {
    const query = position ? `?position=${encodeURIComponent(position)}` : "";
    const url = `${API_BASE_URL}/api/v1/recruitment/jds${query}`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            }
        });
        return await handleResponse(response) || [];
    } catch (error) {
        console.error('Error fetching JD list:', error);
        throw error;
    }
};

export const uploadJDFile = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/recruitment/jds/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getToken()}`
            },
            body: formData
        });
        return await handleResponse(response);
    } catch (error) {
        console.error('Error uploading JD:', error);
        throw error;
    }
};

export const editJD = async (jdId, updateData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/recruitment/jds/${jdId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify(updateData)
        });
        return await handleResponse(response);
    } catch (error) {
        console.error('Error updating JD:', error);
        throw error;
    }
};

export const deleteJD = async (jdId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/recruitment/jds/${jdId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        return await handleResponse(response);
    } catch (error) {
        console.error('Error deleting JD:', error);
        throw error;
    }
};

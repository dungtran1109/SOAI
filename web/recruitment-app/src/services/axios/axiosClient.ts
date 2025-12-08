import axios from 'axios';
import { RECRUITMENT_API_URL_PREFIX } from '../../shared/constants/baseUrls';
import { getToken } from '../../shared/helpers/authUtils';

const axiosClient = axios.create({
    baseURL: RECRUITMENT_API_URL_PREFIX, // Set RECRUITMENT_API_URL_PREFIX by default
    headers: { 'Content-Type': 'application/json' },
});

axiosClient.interceptors.request.use((config) => {
    const authToken = getToken();
    if (authToken) {
        config.headers.Authorization = `Bearer ${authToken}`;
    }
    return config;
});

axiosClient.interceptors.response.use(
    (response) => {
        return response.data;
    },
    (error) => {
        const status = error.response?.status;
        const message = error.response?.message || `Request failed with status ${status}`;
        return Promise.reject(new Error(message));
    },
);

export default axiosClient;

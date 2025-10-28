// This exports used for calling the nginx proxy after docker built
// export const AUTH_BASE_URL = "/api/v1";
// export const API_HOST = ""

// If you want to run in the local environment without Docker,
// you can uncomment the lines below and comment the above lines.
export const AUTH_BASE_URL = 'http://localhost:9090/api/v1';
export const API_HOST = 'http://localhost:8003';

export const API_BASE_URL = `${API_HOST}/api/v1`;

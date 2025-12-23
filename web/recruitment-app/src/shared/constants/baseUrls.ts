// Vite React provide an environment variable called PROD
//   + Start on local (import.meta.env.PROD = false): npm run dev
//   + Start on production (import.meta.env.PROD = true): npm run build → npm run preview

const LOCATION_HOST = window.location.host;
const HTTP_PROTOCOL = window.location.protocol.replace(':', '');
const WS_PROTOCOL = HTTP_PROTOCOL === 'https' ? 'wss' : 'ws';

export const AUTH_API_BASE_URL = `${HTTP_PROTOCOL}://${import.meta.env.PROD ? LOCATION_HOST : 'localhost:9090'}/api/v1/authentications`;

export const RECRUITMENT_API_BASE_URL = `${HTTP_PROTOCOL}://${import.meta.env.PROD ? LOCATION_HOST : 'localhost:8003'}/api/v1/recruitment`;

export const CHAT_API_BASE_URL = `${HTTP_PROTOCOL}://${import.meta.env.PROD ? LOCATION_HOST : 'localhost:8005'}/api/v1/agent-controller`;

export const CHAT_WS_ENDPOINT = `${WS_PROTOCOL}://${import.meta.env.PROD ? LOCATION_HOST : 'localhost:8005'}/api/v1/agent-controller/conversations/realtime`;

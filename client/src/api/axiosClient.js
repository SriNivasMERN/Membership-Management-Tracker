import axios from 'axios';
import { enqueueSnackbar } from 'notistack';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

let onAuthFailed = null;
let refreshInFlight = null;

function readCookie(name) {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : '';
}

function getCsrfHeader() {
  const token = readCookie('XSRF-TOKEN');
  return token ? { 'X-CSRF-Token': token } : {};
}

export function configureAuthClient({ onUnauthorized }) {
  onAuthFailed = onUnauthorized || null;
}

async function refreshSession() {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = axios
    .post(
      `${baseURL}/auth/refresh`,
      {},
      {
        withCredentials: true,
        headers: { ...getCsrfHeader() },
      }
    )
    .finally(() => {
      refreshInFlight = null;
    });
  return refreshInFlight;
}

const api = axios.create({
  baseURL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const nextConfig = { ...config };
  nextConfig.headers = nextConfig.headers || {};
  const method = String(nextConfig.method || 'get').toUpperCase();

  if (method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
    Object.assign(nextConfig.headers, getCsrfHeader());
  }

  return nextConfig;
});

api.interceptors.response.use(
  (response) => {
    const data = response.data;
    if (data && data.success === false) {
      if (data.message) enqueueSnackbar(data.message, { variant: 'error' });
      return Promise.reject(new Error(data.message || 'Request failed'));
    }
    return data?.data !== undefined ? data.data : data;
  },
  async (error) => {
    const originalRequest = error.config || {};
    const status = error.response?.status;
    const requestUrl = String(originalRequest.url || '');
    const isAuthRequest =
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/refresh') ||
      requestUrl.includes('/auth/logout') ||
      requestUrl.includes('/auth/setup') ||
      requestUrl.includes('/auth/setup-status') ||
      requestUrl.includes('/auth/reset-password');

    if (status === 401 && !isAuthRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        await refreshSession();
        const retryResponse = await api.request(originalRequest);
        return retryResponse;
      } catch {
        if (onAuthFailed) onAuthFailed();
        enqueueSnackbar('Session expired, please login again', { variant: 'warning' });
        return Promise.reject(error);
      }
    }

    if (isAuthRequest && (status === 401 || status === 403)) {
      return Promise.reject(error);
    }

    const message =
      error.response?.data?.message || error.message || 'Network error, please try again';
    enqueueSnackbar(message, { variant: 'error' });
    return Promise.reject(error);
  }
);

export default api;

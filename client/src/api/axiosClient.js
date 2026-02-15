import axios from 'axios';
import { enqueueSnackbar } from 'notistack';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL,
});

api.interceptors.response.use(
  (response) => {
    const data = response.data;
    if (data && data.success === false) {
      if (data.message) {
        enqueueSnackbar(data.message, { variant: 'error' });
      }
      return Promise.reject(new Error(data.message || 'Request failed'));
    }
    return data.data !== undefined ? data.data : data;
  },
  (error) => {
    const message =
      error.response?.data?.message || error.message || 'Network error, please try again';
    enqueueSnackbar(message, { variant: 'error' });
    return Promise.reject(error);
  }
);

export default api;


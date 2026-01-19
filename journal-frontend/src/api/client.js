import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/journal';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add auth interceptor to include credentials
apiClient.interceptors.request.use(
    (config) => {
        const auth = localStorage.getItem('auth');
        if (auth) {
            const { username, password } = JSON.parse(auth);
            config.auth = { username, password };
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('auth');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default apiClient;

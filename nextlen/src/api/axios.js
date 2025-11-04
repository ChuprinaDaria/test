import axios from 'axios';

const MOCK_MODE = import.meta.env.VITE_MOCK_MODE === 'true' || !import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor для додавання токена та API ключа
api.interceptors.request.use((config) => {
  // Додаємо Bearer token якщо є
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Додаємо X-API-Key якщо є (працює разом з Bearer token)
  const apiKey = localStorage.getItem('api_key');
  if (apiKey) {
    config.headers['X-API-Key'] = apiKey;
  }
  
  return config;
});

// Interceptor для обробки помилок та refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Якщо це помилка мережі, додаємо мок позначку для обробки в AuthContext
    if (error.code === 'ERR_NETWORK' || error.code === 'ERR_CONNECTION_REFUSED') {
      error.mock = true;
      return Promise.reject(error);
    }
    
    // Якщо 401 і це не був спроб refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = localStorage.getItem('refresh_token');
      
      // Якщо є refresh token, намагаємося оновити access token
      if (refreshToken) {
        try {
          const { authAPI } = await import('./auth');
          const response = await authAPI.refreshToken(refreshToken);
          
          if (response.data?.access) {
            localStorage.setItem('access_token', response.data.access);
            if (response.data.refresh) {
              localStorage.setItem('refresh_token', response.data.refresh);
            }
            
            // Повторюємо оригінальний запит з новим токеном
            originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
            return api(originalRequest);
          }
        } catch (refreshError) {
          // Якщо refresh не вдався, очищаємо токени і перенаправляємо на login
          console.error('Token refresh failed:', refreshError);
        }
      }
      
      // Якщо refresh token немає або він не спрацював, очищаємо токени
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      
      // Перенаправляємо на login тільки якщо це не запит на /auth/me
      if (!originalRequest.url?.includes('/auth/me') && !originalRequest.url?.includes('/rag/auth/')) {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
export { MOCK_MODE };

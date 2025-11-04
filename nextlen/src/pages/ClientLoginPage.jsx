import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

const ClientLoginPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, loginByClientToken, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const tag = searchParams.get('tag');
    
    if (!tag) {
      setError('Tag parameter is required');
      setLoading(false);
      return;
    }

    // Якщо вже авторизований, просто перенаправляємо на dashboard
    if (isAuthenticated && !authLoading) {
      navigate('/dashboard', { replace: true });
      return;
    }

    // Якщо AuthContext ще завантажується, чекаємо
    if (authLoading) {
      return;
    }

    // Автоматичний вхід через client_token (tag)
    handleAutoLogin(tag);
  }, [searchParams, navigate, isAuthenticated, authLoading, loginByClientToken]);

  const handleAutoLogin = async (clientToken) => {
    try {
      setLoading(true);
      
      // Використовуємо метод з AuthContext для входу
      await loginByClientToken(clientToken);
      
      // Чекаємо трохи, щоб AuthContext оновився
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Перенаправляємо на dashboard
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error('Auto login error:', err);
      setError(err.response?.data?.error || err.message || 'Failed to login. Please try again.');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-accent-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary-500 mx-auto mb-4" />
          <p className="text-gray-600">Вхід до системи...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-accent-50">
        <div className="text-center max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Помилка входу</h2>
          <p className="text-gray-700 mb-4">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="btn-primary"
          >
            Перейти на головну
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default ClientLoginPage;


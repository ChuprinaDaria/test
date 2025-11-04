import api from './axios';

export const embeddingModelAPI = {
  // Отримати список embedding моделей
  getModels: () => api.get('/embedding-model/models/'),

  // Вибрати embedding модель для клієнта
  selectModel: (modelId, clientId) => 
    api.post('/embedding-model/select/', { model_id: modelId, client_id: clientId }),

  // Переіндексувати документи клієнта
  reindex: () => api.post('/embedding-model/reindex/'),
};


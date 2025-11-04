import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MessageSquare, Loader2 } from 'lucide-react';
import { clientAPI } from '../../api/client';

const ChatList = ({ onSelectChat, selectedChatId }) => {
  const { t } = useTranslation();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    loadConversations();
  }, []);
  
  const loadConversations = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await clientAPI.getConversations();
      setChats(response.data?.conversations || []);
    } catch (err) {
      console.error('Failed to load conversations:', err);
      setError(t('history.loadError') || 'Failed to load conversations');
      // Fallback на порожній список
      setChats([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card h-[600px] overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{t('history.allConversations')}</h3>
        <button
          onClick={loadConversations}
          className="text-sm text-primary-600 hover:text-primary-700"
          title={t('history.refresh') || 'Refresh'}
        >
          ↻
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="animate-spin text-primary-500" size={24} />
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 text-red-700 rounded text-sm">
          {error}
        </div>
      ) : chats.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          <p>{t('history.noChats') || 'No conversations yet'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {chats.map((chat) => (
          <div
            key={chat.id}
            onClick={() => onSelectChat(chat)}
            className={`p-3 rounded-lg cursor-pointer transition-colors ${
              selectedChatId === chat.id
                ? 'bg-primary-50 border-2 border-primary-200'
                : 'hover:bg-gray-50 border-2 border-transparent'
            }`}
          >
            <div className="flex items-start justify-between mb-1">
              <div className="flex items-center gap-2">
                <MessageSquare size={16} className="text-gray-500" />
                <span className="font-medium text-sm">{chat.customerName}</span>
              </div>
              {chat.unread > 0 && (
                <span className="bg-primary-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {chat.unread}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 truncate">{chat.lastMessage}</p>
            <p className="text-xs text-gray-400 mt-1">{chat.timestamp}</p>
          </div>
        ))}
        </div>
      )}
    </div>
  );
};

export default ChatList;

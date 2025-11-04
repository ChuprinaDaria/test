import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Bot, Plus, Loader2 } from 'lucide-react';
import { ragAPI } from '../../api/agent';
import { clientAPI } from '../../api/client';

const ChatDetail = ({ chat }) => {
  const { t } = useTranslation();
  const [uploading, setUploading] = useState({});
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [chatData, setChatData] = useState(null);
  
  useEffect(() => {
    if (chat && chat.conversation_id) {
      loadConversationDetail();
    } else {
      // Fallback на mock дані якщо немає conversation_id
      setMessages([
        {
          id: 1,
          text: 'Hello! I would like to book an appointment',
          sender: 'customer',
          timestamp: '10:30 AM',
          photo: null,
        },
        {
          id: 2,
          text: 'Hello! I would be happy to help you book an appointment. What service are you interested in?',
          sender: 'ai',
          timestamp: '10:30 AM',
          photo: null,
        },
      ]);
    }
  }, [chat]);
  
  const loadConversationDetail = async () => {
    if (!chat?.conversation_id) return;
    
    setLoading(true);
    try {
      const response = await clientAPI.getConversationDetail(chat.conversation_id);
      const data = response.data;
      setChatData(data);
      
      // Форматуємо повідомлення
      const formattedMessages = (data.messages || []).map((msg, idx) => ({
        id: idx + 1,
        text: msg.text,
        sender: msg.sender,
        timestamp: msg.timestamp,
        photo: msg.photo || null,
      }));
      
      setMessages(formattedMessages);
    } catch (err) {
      console.error('Failed to load conversation detail:', err);
      // Fallback на mock дані
      setMessages([
        {
          id: 1,
          text: chat.lastMessage || 'No messages',
          sender: 'customer',
          timestamp: chat.timestamp || '',
          photo: null,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddChatToKnowledge = async () => {
    if (!chat || !messages.length) return;

    setUploading(prev => ({ ...prev, chat: true }));

    try {
      // Формуємо текст всього чату як документ
      const chatText = messages.map(msg => {
        const sender = msg.sender === 'customer' ? 'Customer' : 'AI';
        return `${sender}: ${msg.text}`;
      }).join('\n\n');

      // Створюємо файл з текстом чату
      const blob = new Blob([chatText], { type: 'text/plain' });
      const file = new File([blob], `chat-${chat.id}-${chat.customerName}.txt`, { type: 'text/plain' });

      // Завантажуємо до RAG з назвою "Clients Chats"
      await ragAPI.uploadDocument(file, 'Clients Chats');

      // Запускаємо індексування тільки нового документу (syncData індексує тільки нові файли)
      await clientAPI.syncData();

      alert(t('history.addedToKnowledge') || 'Chat added to knowledge base and indexing started!');
    } catch (error) {
      console.error('Error adding chat to knowledge:', error);
      alert(t('history.addToKnowledgeError') || 'Failed to add chat to knowledge base');
    } finally {
      setUploading(prev => ({ ...prev, chat: false }));
    }
  };

  return (
    <div className="card h-[600px] flex flex-col">
      <div className="pb-4 border-b border-gray-200 mb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold">{chat.customerName}</h3>
            <p className="text-sm text-gray-500">{t('history.lastActive')} {chat.timestamp}</p>
          </div>
          <button
            onClick={handleAddChatToKnowledge}
            disabled={uploading.chat}
            className="ml-4 px-3 py-1.5 bg-primary-600 text-white rounded-lg shadow hover:bg-primary-700 transition flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            title={t('history.addToKnowledge') || 'Add to Knowledge'}
          >
            {uploading.chat ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>{t('history.adding') || 'Adding...'}</span>
              </>
            ) : (
              <>
                <Plus size={14} />
                <span>{t('history.addToKnowledge') || 'Add to Knowledge'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="animate-spin text-primary-500" size={24} />
            <span className="ml-2 text-gray-600">{t('history.loading') || 'Loading...'}</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>{t('history.noMessages') || 'No messages in this conversation'}</p>
          </div>
        ) : (
          messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.sender === 'customer' ? '' : 'flex-row-reverse'}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.sender === 'customer'
                  ? 'bg-gray-200 text-gray-600'
                  : 'bg-primary-100 text-primary-600'
              }`}
            >
              {msg.sender === 'customer' ? <User size={16} /> : <Bot size={16} />}
            </div>

            <div className="flex-1">
              <div
                className={`p-3 rounded-lg ${
                  msg.sender === 'customer' ? 'bg-gray-100' : 'bg-primary-50'
                }`}
              >
                <p className="text-sm whitespace-pre-line">{msg.text}</p>
                
                {/* Photo display */}
                {msg.photo && (
                  <div className="mt-3">
                    <img 
                      src={msg.photo} 
                      alt="Chat photo" 
                      className="max-w-full h-auto rounded-lg border border-gray-200"
                    />
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-1">{msg.timestamp}</p>
            </div>
          </div>
        ))
        )}
      </div>
    </div>
  );
};

export default ChatDetail;

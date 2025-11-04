import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, Mic, Volume2 } from 'lucide-react';
import { ragAPI } from '../../api/agent';

const ChatWindow = () => {
  const { t, i18n } = useTranslation();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioPlayerRef = useRef(null);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        { id: 1, text: t('sandbox.helloMessage'), sender: 'ai', timestamp: new Date() },
      ]);
    }
  }, [i18n.language, t]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: input,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages([...messages, userMessage]);
    const messageText = input;
    setInput('');
    setLoading(true);

    try {
      // Використовуємо RAG API для чату
      const response = await ragAPI.chat(messageText);
      const aiMessage = {
        id: Date.now() + 1,
        text: response.data?.response || t('sandbox.testResponse'),
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      // Fallback на мок відповідь
      const aiMessage = {
        id: Date.now() + 1,
        text: t('sandbox.testResponse'),
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } finally {
      setLoading(false);
    }
  };

  // Запис голосу (STT)
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await handleSpeechToText(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert(t('sandbox.micPermissionError') || 'Microphone permission denied');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSpeechToText = async (audioBlob) => {
    try {
      setLoading(true);
      // Конвертуємо Blob в File для відправки
      const audioFile = new File([audioBlob], 'recording.webm', { type: 'audio/webm' });
      const response = await ragAPI.speechToText(audioFile);
      const transcribedText = response.data?.text || '';
      
      if (transcribedText) {
        // Автоматично відправляємо розпізнаний текст
        const userMessage = {
          id: Date.now(),
          text: transcribedText,
          sender: 'user',
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setLoading(true);

        try {
          // Використовуємо RAG API для чату
          const chatResponse = await ragAPI.chat(transcribedText);
          const aiMessage = {
            id: Date.now() + 1,
            text: chatResponse.data?.response || t('sandbox.testResponse'),
            sender: 'ai',
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, aiMessage]);
        } catch (error) {
          console.error('Chat error:', error);
          // Fallback на мок відповідь
          const aiMessage = {
            id: Date.now() + 1,
            text: t('sandbox.testResponse'),
            sender: 'ai',
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, aiMessage]);
        } finally {
          setLoading(false);
        }
      }
    } catch (error) {
      console.error('STT error:', error);
      alert(t('sandbox.sttError') || 'Failed to transcribe audio');
      setLoading(false);
    }
  };

  // Відтворення голосу (TTS)
  const handleTextToSpeech = async (text) => {
    if (!text || isPlaying) return;

    try {
      setIsPlaying(true);
      const response = await ragAPI.textToSpeech(text, 'alloy');
      
      // Створюємо audio URL з blob
      const audioUrl = URL.createObjectURL(response.data);
      const audio = new Audio(audioUrl);
      audioPlayerRef.current = audio;

      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
        console.error('Audio playback error');
      };

      await audio.play();
    } catch (error) {
      console.error('TTS error:', error);
      setIsPlaying(false);
      alert(t('sandbox.ttsError') || 'Failed to generate speech');
    }
  };

  return (
    <div className="card h-[600px] flex flex-col">
      <h3 className="text-lg font-semibold mb-4">{t('sandbox.chatTest')}</h3>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] p-3 rounded-lg ${
                msg.sender === 'user'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm flex-1">{msg.text}</p>
                {msg.sender === 'ai' && (
                  <button
                    onClick={() => handleTextToSpeech(msg.text)}
                    disabled={isPlaying}
                    className={`p-1 rounded hover:bg-opacity-20 transition ${
                      msg.sender === 'ai'
                        ? 'hover:bg-gray-600 text-gray-700'
                        : ''
                    }`}
                    title={t('sandbox.playVoice') || 'Play voice'}
                  >
                    <Volume2 size={16} />
                  </button>
                )}
              </div>
              <p
                className={`text-xs mt-1 ${
                  msg.sender === 'user' ? 'text-primary-100' : 'text-gray-500'
                }`}
              >
                {msg.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 p-3 rounded-lg">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`p-2 rounded-lg transition ${
            isRecording
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          title={isRecording ? (t('sandbox.stopRecording') || 'Stop recording') : (t('sandbox.startRecording') || 'Start recording')}
          disabled={loading}
        >
          <Mic size={18} />
        </button>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder={t('sandbox.typeMessage')}
          className="flex-1 input"
          disabled={isRecording}
        />
        <button onClick={handleSend} disabled={loading || isRecording} className="btn-primary">
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};

export default ChatWindow;

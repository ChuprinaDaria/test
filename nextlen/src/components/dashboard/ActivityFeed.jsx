import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MessageSquare, Calendar, CheckCircle, Loader2 } from 'lucide-react';
import { clientAPI } from '../../api/client';

const ActivityFeed = () => {
  const { t } = useTranslation();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    setLoading(true);
    try {
      const response = await clientAPI.getRecentActivity();
      const activitiesData = response.data?.activities || [];
      
      // Форматуємо активності для відображення
      const formattedActivities = activitiesData.map((activity) => {
        let icon = MessageSquare;
        let color = 'bg-blue-50 text-blue-600';
        
        if (activity.type === 'new_chat') {
          icon = MessageSquare;
          color = 'bg-blue-50 text-blue-600';
        } else if (activity.type === 'booking') {
          icon = Calendar;
          color = 'bg-green-50 text-green-600';
        } else if (activity.type === 'training') {
          icon = CheckCircle;
          color = 'bg-primary-50 text-primary-600';
        }
        
        return {
          icon,
          text: activity.text || activity.type,
          time: activity.time || activity.timestamp,
          color,
          timestamp: activity.timestamp,
        };
      });
      
      setActivities(formattedActivities);
    } catch (err) {
      console.error('Failed to load activities:', err);
      // Fallback на порожній список
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="animate-spin text-primary-500" size={24} />
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        <p>{t('dashboard.noActivity') || 'No recent activity'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity, index) => (
        <div key={index} className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${activity.color}`}>
            <activity.icon size={16} />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-800">{activity.text}</p>
            <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ActivityFeed;

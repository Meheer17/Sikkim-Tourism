'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClockRotateLeft } from '@fortawesome/free-solid-svg-icons';
import axiosInstance from '@/lib/axios';

interface Activity {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
}

export default function ActivityLogs() {
  const [logs, setLogs] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await axiosInstance.get<Activity[]>('/api/v1/government/activities', {
          params: { limit: 6 }
        });
        setLogs(response.data);
      } catch (error) {
        console.error('Error fetching activities:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
      
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } catch {
      return timestamp;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <FontAwesomeIcon icon={faClockRotateLeft} className="text-indigo-500" />
          Activity Logs
        </h2>
        <div className="space-y-4">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="animate-pulse flex items-start gap-4 p-3">
              <div className="w-2 h-2 bg-gray-300 rounded-full mt-2"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                <div className="h-3 bg-gray-300 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <FontAwesomeIcon icon={faClockRotateLeft} className="text-indigo-500" />
        Activity Logs
      </h2>
      
      <div className="space-y-4">
        {logs.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No recent activities</p>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="flex items-start gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-gray-900 font-medium">{log.title}</p>
                <p className="text-sm text-gray-600">{log.description}</p>
              </div>
              <span className="text-sm text-gray-500">{formatTime(log.timestamp)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

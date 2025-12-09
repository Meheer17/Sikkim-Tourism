'use client';

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClockRotateLeft } from '@fortawesome/free-solid-svg-icons';

export default function ActivityLogs() {
  const [logs] = useState([
    { id: 1, action: 'New user registration', user: 'John Doe', time: '2 minutes ago' },
    { id: 2, action: 'Business approved', user: 'Admin', time: '15 minutes ago' },
    { id: 3, action: 'Booking created', user: 'Jane Smith', time: '1 hour ago' },
    { id: 4, action: 'Place updated', user: 'Admin', time: '2 hours ago' },
    { id: 5, action: 'Review posted', user: 'Mike Johnson', time: '3 hours ago' },
    { id: 6, action: 'Payment received', user: 'Sarah Wilson', time: '5 hours ago' }
  ]);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <FontAwesomeIcon icon={faClockRotateLeft} className="text-indigo-500" />
        Activity Logs
      </h2>
      
      <div className="space-y-4">
        {logs.map((log) => (
          <div key={log.id} className="flex items-start gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
            <div className="flex-1">
              <p className="text-gray-900 font-medium">{log.action}</p>
              <p className="text-sm text-gray-600">{log.user}</p>
            </div>
            <span className="text-sm text-gray-500">{log.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

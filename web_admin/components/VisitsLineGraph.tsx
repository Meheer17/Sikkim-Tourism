'use client';

import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine } from '@fortawesome/free-solid-svg-icons';

export default function VisitsLineGraph() {
  const [data] = useState([
    { month: 'Jan', actual: 120, predicted: 130 },
    { month: 'Feb', actual: 190, predicted: 200 },
    { month: 'Mar', actual: 150, predicted: 180 },
    { month: 'Apr', actual: 220, predicted: 240 },
    { month: 'May', actual: 280, predicted: 300 },
    { month: 'Jun', actual: 250, predicted: 280 },
    { month: 'Jul', actual: 310, predicted: 320 },
    { month: 'Aug', actual: 290, predicted: 310 },
    { month: 'Sep', actual: 340, predicted: 350 },
    { month: 'Oct', actual: 380, predicted: 390 },
    { month: 'Nov', actual: 420, predicted: 440 },
    { month: 'Dec', actual: 450, predicted: 470 }
  ]);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <FontAwesomeIcon icon={faChartLine} className="text-blue-500" />
        Visits Over Time
      </h2>
      
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="month" stroke="#6b7280" />
          <YAxis stroke="#6b7280" />
          <Tooltip />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="actual" 
            stroke="#3b82f6" 
            strokeWidth={3}
            dot={{ fill: '#3b82f6', r: 4 }}
          />
          <Line 
            type="monotone" 
            dataKey="predicted" 
            stroke="#22c55e" 
            strokeWidth={3}
            strokeDasharray="8 4"
            dot={{ fill: '#22c55e', r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

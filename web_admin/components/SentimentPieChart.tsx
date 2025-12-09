'use client';

import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartPie } from '@fortawesome/free-solid-svg-icons';

export default function SentimentPieChart() {
  const [data] = useState([
    { name: 'Positive', value: 45 },
    { name: 'Neutral', value: 30 },
    { name: 'Negative', value: 15 },
    { name: 'Mixed', value: 10 }
  ]);

  const COLORS = ['#22c55e', '#d1d5db', '#ef4444', '#f3f4f6'];

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <FontAwesomeIcon icon={faChartPie} className="text-green-500" />
        Sentiment Analysis
      </h2>
      
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

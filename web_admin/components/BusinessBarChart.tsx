'use client';

import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartBar } from '@fortawesome/free-solid-svg-icons';

export default function BusinessBarChart() {
  const [data] = useState([
    { type: 'Hotels', count: 45 },
    { type: 'Restaurants', count: 32 },
    { type: 'Travel Agencies', count: 28 },
    { type: 'Adventure Sports', count: 15 },
    { type: 'Tour Guides', count: 22 },
    { type: 'Homestays', count: 38 },
    { type: 'Car Rentals', count: 19 },
    { type: 'Souvenir Shops', count: 25 }
  ]);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <FontAwesomeIcon icon={faChartBar} className="text-purple-500" />
        Business by Type
      </h2>
      
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="type" stroke="#6b7280" angle={-45} textAnchor="end" height={100} />
          <YAxis stroke="#6b7280" />
          <Tooltip />
          <Legend />
          <Bar dataKey="count" fill="#3b82f6" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

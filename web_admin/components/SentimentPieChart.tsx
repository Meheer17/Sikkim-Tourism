'use client';

import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartPie } from '@fortawesome/free-solid-svg-icons';
import axiosInstance from '@/lib/axios';

interface RatingData {
  under_2: number;
  between_2_4: number;
  above_4: number;
  total: number;
}

interface ChartData {
  name: string;
  value: number;
}

export default function SentimentPieChart() {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const COLORS = ['#ef4444', '#f59e0b', '#22c55e'];

  useEffect(() => {
    const fetchRatings = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get<RatingData>('/api/v1/analytics/service-ratings');
        
        const chartData: ChartData[] = [
          { name: 'Under 2', value: response.data.under_2 },
          { name: '2-4', value: response.data.between_2_4 },
          { name: '4-5', value: response.data.above_4 }
        ];
        
        setData(chartData);
        setError(null);
      } catch (err: any) {
        console.error('Failed to fetch service ratings:', err);
        setError(err.response?.data?.detail || 'Failed to load ratings data');
      } finally {
        setLoading(false);
      }
    };

    fetchRatings();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <FontAwesomeIcon icon={faChartPie} className="text-green-500" />
          Sentiment Analysis
        </h2>
        <div className="flex items-center justify-center h-[300px]">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <FontAwesomeIcon icon={faChartPie} className="text-green-500" />
          Sentiment Analysis
        </h2>
        <div className="flex items-center justify-center h-[300px]">
          <div className="text-red-500">{error}</div>
        </div>
      </div>
    );
  }

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

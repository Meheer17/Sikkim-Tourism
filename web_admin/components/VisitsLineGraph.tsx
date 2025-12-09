'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine } from '@fortawesome/free-solid-svg-icons';
import axiosInstance from '@/lib/axios';

interface AnalyticsData {
  month_number: number;
  year: number;
  actual_data: number;
  predicted_data: number;
  predicted_at: string;
}

interface ChartData {
  month: string;
  actual: number | null;
  predicted: number | null;
  value: number;
}

export default function VisitsLineGraph() {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get<AnalyticsData[]>('/api/v1/analytics/user-analytics');
        
        // Sort by year and month_number to ensure correct order
        const sortedData = response.data.sort((a, b) => {
          if (a.year !== b.year) return a.year - b.year;
          return a.month_number - b.month_number;
        });
        
        // Remove duplicates by keeping the last occurrence of each month
        const uniqueData = sortedData.reduce((acc: AnalyticsData[], item) => {
          const existingIndex = acc.findIndex(d => d.month_number === item.month_number && d.year === item.year);
          if (existingIndex >= 0) {
            acc[existingIndex] = item; // Replace with latest
          } else {
            acc.push(item);
          }
          return acc;
        }, []);
        
        // Get current date
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1; // 1-12
        
        // Calculate the start month (9 months back from current)
        let startYear = currentYear;
        let startMonth = currentMonth - 9;
        if (startMonth <= 0) {
          startYear--;
          startMonth += 12;
        }
        
        // Filter and get 12 months of data (9 months back + current + 3 future)
        const filteredData = uniqueData.filter(item => {
          const itemDate = new Date(item.year, item.month_number - 1);
          const startDate = new Date(startYear, startMonth - 1);
          const endDate = new Date(currentYear, currentMonth + 2); // current + 3 months
          return itemDate >= startDate && itemDate <= endDate;
        });
        
        // Take only first 12 months
        const last12Months = filteredData.slice(0, 12);
        
        // Transform the data for the chart with combined value
        const chartData: ChartData[] = last12Months.map((item, index) => {
          const isFuture = item.year > currentYear || (item.year === currentYear && item.month_number > currentMonth);
          const isCurrent = item.year === currentYear && item.month_number === currentMonth;
          
          // Check if this is the first future month (right after current month)
          const isFirstFuture = isFuture && index > 0 && 
            (last12Months[index - 1].year < currentYear || 
             (last12Months[index - 1].year === currentYear && last12Months[index - 1].month_number <= currentMonth));
          
          return {
            month: `${monthNames[item.month_number - 1]} ${item.year === 2026 ? "'26" : ""}`,
            // Blue line: show actual data only up to current month (inclusive)
            actual: (isCurrent || !isFuture) ? item.actual_data : null as any,
            // Green line: show predicted data for future months + include current month's actual value for connection
            predicted: isFuture ? item.predicted_data : (isCurrent ? item.actual_data : null as any),
            value: isFuture ? item.predicted_data : item.actual_data
          };
        });
        
        setData(chartData);
        setError(null);
      } catch (err: any) {
        console.error('Failed to fetch analytics:', err);
        setError(err.response?.data?.detail || 'Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <FontAwesomeIcon icon={faChartLine} className="text-blue-500" />
          Visits Over Time
        </h2>
        <div className="flex items-center justify-center h-[300px]">
          <div className="text-gray-500">Loading analytics...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <FontAwesomeIcon icon={faChartLine} className="text-blue-500" />
          Visits Over Time
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
        <FontAwesomeIcon icon={faChartLine} className="text-blue-500" />
        Visits Over Time
      </h2>
      
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="month" stroke="#6b7280" />
          <YAxis stroke="#6b7280" />
          <Tooltip />
          <Legend 
            payload={[
              { value: 'Actual', type: 'line', color: '#3b82f6' },
              { value: 'Predicted', type: 'line', color: '#22c55e' }
            ]}
          />
          {/* Blue solid line for actual data */}
          <Line 
            type="monotone" 
            dataKey="actual" 
            stroke="#3b82f6" 
            strokeWidth={3}
            dot={{ fill: '#3b82f6', r: 4 }}
            connectNulls={false}
          />
          {/* Green dashed line for predicted data */}
          <Line 
            type="monotone" 
            dataKey="predicted" 
            stroke="#22c55e" 
            strokeWidth={3}
            strokeDasharray="8 4"
            dot={{ fill: '#22c55e', r: 4 }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

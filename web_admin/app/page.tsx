'use client';

import { useState } from 'react';

export default function Home() {
  const [stats] = useState({
    totalUsers: 1250,
    totalBusinesses: 85,
    totalPlaces: 342,
    totalBookings: 1567,
    totalRevenue: 245680,
    activeUsers: 892
  });

  const [visitsData] = useState({
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    actual: [1200, 1900, 1500, 2200, 2800, 2400],
    predicted: [1300, 1800, 1700, 2100, 2600, 2900]
  });

  const [sentimentData] = useState([
    { label: 'Positive', value: 45, color: '#22c55e' },
    { label: 'Neutral', value: 30, color: '#d1d5db' },
    { label: 'Negative', value: 15, color: '#ef4444' },
    { label: 'Unknown', value: 10, color: '#f3f4f6' }
  ]);

  const [businessData] = useState([
    { type: 'Hotels', count: 25 },
    { type: 'Restaurants', count: 18 },
    { type: 'Tours', count: 15 },
    { type: 'Transport', count: 12 },
    { type: 'Activities', count: 15 }
  ]);

  const [activityLogs] = useState([
    { time: '10:30 AM', action: 'New user registered', user: 'John Doe' },
    { time: '10:15 AM', action: 'Business approved', user: 'Mountain Resort' },
    { time: '9:45 AM', action: 'Booking confirmed', user: 'Sarah Smith' },
    { time: '9:20 AM', action: 'Place added', user: 'Admin' },
    { time: '8:55 AM', action: 'Payment received', user: 'Mike Johnson' }
  ]);

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 text-white">
        <div className="p-6">
          <h1 className="text-2xl font-bold">Admin Panel</h1>
        </div>
        <nav className="mt-6">
          <button className="w-full px-6 py-3 text-left bg-gray-700 hover:bg-gray-600">
            Dashboard
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-8">Dashboard</h2>
        
        {/* Info Cards */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm font-medium mb-2">Total Users</h3>
            <p className="text-3xl font-bold text-gray-800">{stats.totalUsers}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm font-medium mb-2">Total Businesses</h3>
            <p className="text-3xl font-bold text-gray-800">{stats.totalBusinesses}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm font-medium mb-2">Total Places</h3>
            <p className="text-3xl font-bold text-gray-800">{stats.totalPlaces}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm font-medium mb-2">Total Bookings</h3>
            <p className="text-3xl font-bold text-gray-800">{stats.totalBookings}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm font-medium mb-2">Total Revenue</h3>
            <p className="text-3xl font-bold text-gray-800">₹{stats.totalRevenue.toLocaleString()}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm font-medium mb-2">Active Users</h3>
            <p className="text-3xl font-bold text-gray-800">{stats.activeUsers}</p>
          </div>
        </div>

        {/* Line Graph */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Visits Overview</h3>
          <div className="relative h-64">
            <svg width="100%" height="100%" viewBox="0 0 600 250">
              {/* Grid lines */}
              {[0, 1, 2, 3, 4].map((i) => (
                <line
                  key={i}
                  x1="50"
                  y1={50 + i * 40}
                  x2="580"
                  y2={50 + i * 40}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                />
              ))}

              {/* Actual line (blue) */}
              <path
                d={visitsData.actual
                  .map((val, i) => {
                    const x = 50 + (i * 530) / (visitsData.actual.length - 1);
                    const y = 210 - (val / 3000) * 160;
                    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                  })
                  .join(' ')}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="3"
              />
              
              {/* Actual data points */}
              {visitsData.actual.map((val, i) => {
                const x = 50 + (i * 530) / (visitsData.actual.length - 1);
                const y = 210 - (val / 3000) * 160;
                return (
                  <circle
                    key={i}
                    cx={x}
                    cy={y}
                    r="5"
                    fill="#3b82f6"
                  />
                );
              })}

              {/* Predicted line (green, dotted) */}
              <path
                d={visitsData.predicted
                  .map((val, i) => {
                    const x = 50 + (i * 530) / (visitsData.predicted.length - 1);
                    const y = 210 - (val / 3000) * 160;
                    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                  })
                  .join(' ')}
                fill="none"
                stroke="#10b981"
                strokeWidth="2"
                strokeDasharray="5,5"
              />

              {/* Labels */}
              {visitsData.labels.map((label, i) => {
                const x = 50 + (i * 530) / (visitsData.labels.length - 1);
                return (
                  <text
                    key={i}
                    x={x}
                    y="235"
                    textAnchor="middle"
                    fill="#6b7280"
                    fontSize="12"
                  >
                    {label}
                  </text>
                );
              })}
            </svg>
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-blue-500"></div>
                <span className="text-sm text-gray-600">Actual</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-green-500" style={{borderTop: '2px dotted #10b981'}}></div>
                <span className="text-sm text-gray-600">Predicted</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Sentiment Analysis</h3>
          <div className="flex items-center justify-center">
            <svg width="200" height="200" viewBox="0 0 200 200">
              {(() => {
                let currentAngle = 0;
                return sentimentData.map((segment, i) => {
                  const angle = (segment.value / 100) * 360;
                  const startAngle = currentAngle;
                  const endAngle = currentAngle + angle;
                  currentAngle += angle;

                  const startRad = (startAngle - 90) * (Math.PI / 180);
                  const endRad = (endAngle - 90) * (Math.PI / 180);

                  const x1 = 100 + 80 * Math.cos(startRad);
                  const y1 = 100 + 80 * Math.sin(startRad);
                  const x2 = 100 + 80 * Math.cos(endRad);
                  const y2 = 100 + 80 * Math.sin(endRad);

                  const largeArc = angle > 180 ? 1 : 0;

                  return (
                    <path
                      key={i}
                      d={`M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z`}
                      fill={segment.color}
                      stroke="#fff"
                      strokeWidth="2"
                    />
                  );
                });
              })()}
            </svg>
            <div className="ml-8">
              {sentimentData.map((segment, i) => (
                <div key={i} className="flex items-center gap-3 mb-2">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: segment.color }}
                  ></div>
                  <span className="text-gray-700">{segment.label}: {segment.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Business Types</h3>
          <div className="h-64">
            <svg width="100%" height="100%" viewBox="0 0 600 250">
              {/* Y-axis grid lines */}
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <line
                  key={i}
                  x1="50"
                  y1={50 + i * 40}
                  x2="580"
                  y2={50 + i * 40}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                />
              ))}

              {/* Bars */}
              {businessData.map((item, i) => {
                const barWidth = 60;
                const spacing = 80;
                const x = 80 + i * spacing;
                const barHeight = (item.count / 30) * 180;
                const y = 230 - barHeight;

                return (
                  <g key={i}>
                    <rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={barHeight}
                      fill="#3b82f6"
                      rx="4"
                    />
                    <text
                      x={x + barWidth / 2}
                      y={y - 5}
                      textAnchor="middle"
                      fill="#374151"
                      fontSize="12"
                      fontWeight="bold"
                    >
                      {item.count}
                    </text>
                    <text
                      x={x + barWidth / 2}
                      y="245"
                      textAnchor="middle"
                      fill="#6b7280"
                      fontSize="12"
                    >
                      {item.type}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Activity Logs */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Activity Logs</h3>
          <div className="space-y-3">
            {activityLogs.map((log, i) => (
              <div key={i} className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <p className="text-gray-800 font-medium">{log.action}</p>
                  <p className="text-sm text-gray-500">{log.user}</p>
                </div>
                <span className="text-sm text-gray-500">{log.time}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

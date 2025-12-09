'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faBuilding, faMapLocationDot, faCalendarCheck, faIndianRupeeSign, faUserCheck } from '@fortawesome/free-solid-svg-icons';
import axiosInstance from '@/lib/axios';

interface StatsData {
  total_users: number;
  total_businesses: number;
  total_locations: number;
  total_bookings: number;
  revenue: number;
  active_users: number;
}

export default function InfoCards() {
  const [stats, setStats] = useState<StatsData>({
    total_users: 0,
    total_businesses: 0,
    total_locations: 0,
    total_bookings: 0,
    revenue: 0,
    active_users: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axiosInstance.get<StatsData>('/api/v1/government/stats');
        console.log('Fetched stats:', response.data);
        setStats(response.data);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []); 

  const cards = [
    { title: 'Total Users', value: stats.total_users, color: 'bg-blue-500', icon: faUsers },
    { title: 'Total Businesses', value: stats.total_businesses, color: 'bg-purple-500', icon: faBuilding },
    { title: 'Total Places', value: stats.total_locations, color: 'bg-green-500', icon: faMapLocationDot },
    { title: 'Total Bookings', value: stats.total_bookings, color: 'bg-yellow-500', icon: faCalendarCheck },
    { title: 'Total Revenue', value: `₹${stats.revenue || 0}`, color: 'bg-red-500', icon: faIndianRupeeSign },
    { title: 'Active Users', value: stats.active_users, color: 'bg-indigo-500', icon: faUserCheck }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
            <div className="w-12 h-12 bg-gray-300 rounded-lg mb-4"></div>
            <div className="h-4 bg-gray-300 rounded w-24 mb-2"></div>
            <div className="h-8 bg-gray-300 rounded w-16"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {cards.map((card, index) => (
        <div key={index} className="bg-white rounded-lg shadow-md p-6">
          <div className={`w-12 h-12 ${card.color} rounded-lg mb-4 flex items-center justify-center`}>
            <FontAwesomeIcon icon={card.icon} className="text-white text-xl" />
          </div>
          <h3 className="text-gray-600 text-sm font-medium mb-2">{card.title}</h3>
          <p className="text-3xl font-bold text-gray-900">{card.value}</p>
        </div>
      ))}
    </div>
  );
}

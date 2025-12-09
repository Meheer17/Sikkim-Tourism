'use client';

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faBuilding, faMapLocationDot, faCalendarCheck, faIndianRupeeSign, faUserCheck } from '@fortawesome/free-solid-svg-icons';

export default function InfoCards() {
  const [stats] = useState({
    totalUsers: 1234,
    totalBusinesses: 89,
    totalPlaces: 156,
    totalBookings: 567,
    totalRevenue: 45678,
    activeUsers: 892
  });

  const cards = [
    { title: 'Total Users', value: stats.totalUsers, color: 'bg-blue-500', icon: faUsers },
    { title: 'Total Businesses', value: stats.totalBusinesses, color: 'bg-purple-500', icon: faBuilding },
    { title: 'Total Places', value: stats.totalPlaces, color: 'bg-green-500', icon: faMapLocationDot },
    { title: 'Total Bookings', value: stats.totalBookings, color: 'bg-yellow-500', icon: faCalendarCheck },
    { title: 'Total Revenue', value: `₹${stats.totalRevenue}`, color: 'bg-red-500', icon: faIndianRupeeSign },
    { title: 'Active Users', value: stats.activeUsers, color: 'bg-indigo-500', icon: faUserCheck }
  ];

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

'use client';

import { useRouter, usePathname } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine, faGauge, faRightFromBracket, faUser, faCheckCircle, faBuilding, faUsersCog, faMapMarkerAlt, faComments } from '@fortawesome/free-solid-svg-icons';
import { authService } from '@/lib/auth';
import { useEffect, useState } from 'react';

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [userName, setUserName] = useState('Admin');

  useEffect(() => {
    const user = authService.getUser();
    if (user) {
      setUserName(user.name);
    }
  }, []);

  const handleLogout = () => {
    authService.logout();
    router.push('/login');
  };

  const navItems = [
    { label: 'Dashboard', icon: faChartLine, path: '/' },
    { label: 'Approvals', icon: faCheckCircle, path: '/approvals' },
    { label: 'Businesses', icon: faBuilding, path: '/businesses' },
    { label: 'Places', icon: faMapMarkerAlt, path: '/places' },
    { label: 'Community Chat', icon: faComments, path: '/community-chat' },
    { label: 'Users & Roles', icon: faUsersCog, path: '/users' },
  ];

  return (
    <div className="w-64 h-screen bg-gray-900 fixed left-0 top-0 p-6 flex flex-col">
      <div className="mb-8">
        <h1 className="text-white text-2xl font-bold flex items-center gap-2">
          <FontAwesomeIcon icon={faGauge} />
          Admin Panel
        </h1>
      </div>
      
      <nav className="flex-1 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => router.push(item.path)}
            className={`w-full text-left px-4 py-3 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-3 ${
              pathname === item.path ? 'bg-gray-800' : ''
            }`}
          >
            <FontAwesomeIcon icon={item.icon} />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="border-t border-gray-700 pt-4">
        <div className="flex items-center gap-3 text-white mb-4 px-2">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
            <FontAwesomeIcon icon={faUser} />
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="font-medium truncate">{userName}</p>
            <p className="text-xs text-gray-400">Administrator</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full px-4 py-3 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-3"
        >
          <FontAwesomeIcon icon={faRightFromBracket} />
          Logout
        </button>
      </div>
    </div>
  );
}

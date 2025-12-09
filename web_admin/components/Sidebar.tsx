'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine, faGauge } from '@fortawesome/free-solid-svg-icons';

export default function Sidebar() {
  return (
    <div className="w-64 h-screen bg-gray-900 fixed left-0 top-0 p-6">
      <div className="mb-8">
        <h1 className="text-white text-2xl font-bold flex items-center gap-2">
          <FontAwesomeIcon icon={faGauge} />
          Admin Panel
        </h1>
      </div>
      
      <nav>
        <button className="w-full text-left px-4 py-3 text-white bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-3">
          <FontAwesomeIcon icon={faChartLine} />
          Dashboard
        </button>
      </nav>
    </div>
  );
}

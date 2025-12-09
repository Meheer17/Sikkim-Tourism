'use client';

import Sidebar from '@/components/Sidebar';
import InfoCards from '@/components/InfoCards';
import VisitsLineGraph from '@/components/VisitsLineGraph';
import SentimentPieChart from '@/components/SentimentPieChart';
import BusinessBarChart from '@/components/BusinessBarChart';
import ActivityLogs from '@/components/ActivityLogs';

export default function Home() {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      
      <main className="flex-1 ml-64 p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>
        
        <InfoCards />
        
        <VisitsLineGraph />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SentimentPieChart />
          <BusinessBarChart />
        </div>
        
        <ActivityLogs />
      </main>
    </div>
  );
}

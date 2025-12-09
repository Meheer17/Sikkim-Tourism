'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faCheck, faTimes, faEye, faCalendar, faSpinner } from '@fortawesome/free-solid-svg-icons';
import axiosInstance from '@/lib/axios';
import Sidebar from '@/components/Sidebar';
import router from 'next/router';

interface Business {
  id: string;
  name: string;
  description: string;
  short_description?: string;
  approved: boolean;
  created_at: string;
  scheduled_at?: string;
}

export default function ApprovalsPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const itemsPerPage = 20;

  useEffect(() => {
    loadPendingApprovals();
  }, []);

  const loadPendingApprovals = async (page: number = 1, append: boolean = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      const skip = (page - 1) * itemsPerPage;
      const response = await axiosInstance.get<Business[]>('/api/v1/business', {
        params: { skip, limit: itemsPerPage, approved: false }
      });
      
      if (append) {
        setBusinesses(prev => [...prev, ...response.data]);
      } else {
        setBusinesses(response.data);
      }
      
      setHasMore(response.data.length === itemsPerPage);
      setCurrentPage(page);
    } catch (error) {
      console.error('Failed to load pending approvals:', error);
    } finally {
      if (append) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  };

  const loadMoreBusinesses = () => {
    if (!loadingMore && hasMore) {
      loadPendingApprovals(currentPage + 1, true);
    }
  };

  const handleApprove = async (business: Business) => {
    if (!confirm(`Are you sure you want to approve "${business.name}"?`)) return;

    setProcessingId(business.id);
    try {
      await axiosInstance.put(`/api/v1/business/${business.id}/approve`);
      setBusinesses(prev => prev.filter(b => b.id !== business.id));
    } catch (error) {
      console.error('Failed to approve business:', error);
      alert('Failed to approve business');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (business: Business) => {
    if (!confirm(`Are you sure you want to reject and delete "${business.name}"?`)) return;

    setProcessingId(business.id);
    try {
      await axiosInstance.delete(`/api/v1/business/${business.id}`);
      setBusinesses(prev => prev.filter(b => b.id !== business.id));
    } catch (error) {
      console.error('Failed to reject business:', error);
      alert('Failed to reject business');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      
      <main className="flex-1 ml-64 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <FontAwesomeIcon icon={faCheckCircle} className="text-yellow-500" />
              Pending Approvals
            </h1>
            <p className="text-gray-600 mt-2">Review and approve business submissions</p>
          </div>
          <div className="bg-yellow-100 px-4 py-2 rounded-full">
            <span className="text-yellow-800 font-bold">{businesses.length} Pending</span>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <FontAwesomeIcon icon={faSpinner} className="animate-spin text-4xl text-gray-400" />
          </div>
        ) : businesses.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <FontAwesomeIcon icon={faCheckCircle} className="text-6xl text-green-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">All caught up!</h2>
            <p className="text-gray-600">No pending approvals at the moment</p>
          </div>
        ) : (
          <div className="space-y-4">
            {businesses.map((business) => (
              <div key={business.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      business.scheduled_at
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-purple-100 text-purple-700'
                    }`}>
                      {business.scheduled_at ? 'Event' : 'Service'}
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(business.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-2">{business.name}</h3>
                <p className="text-gray-600 mb-4">
                  {business.short_description || business.description}
                </p>

                {business.scheduled_at && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                    <FontAwesomeIcon icon={faCalendar} />
                    <span>
                      {new Date(business.scheduled_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                )}

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => handleApprove(business)}
                    disabled={processingId === business.id}
                    className="flex-1 bg-green-500 text-white px-4 py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors disabled:bg-gray-400 flex items-center justify-center gap-2"
                  >
                    {processingId === business.id ? (
                      <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                    ) : (
                      <FontAwesomeIcon icon={faCheck} />
                    )}
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(business)}
                    disabled={processingId === business.id}
                    className="flex-1 bg-red-500 text-white px-4 py-3 rounded-lg font-semibold hover:bg-red-600 transition-colors disabled:bg-gray-400 flex items-center justify-center gap-2"
                  >
                    <FontAwesomeIcon icon={faTimes} />
                    Reject
                  </button>
                  <button
                    onClick={() => router.push(`/business-details?id=${business.id}`)}
                    className="px-4 py-3 border-2 border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
                    title="View Details"
                  >
                    <FontAwesomeIcon icon={faEye} className="text-gray-600" />
                  </button>
                </div>
              </div>
            ))}
            
            {/* Pagination Controls */}
            {!loading && businesses.length > 0 && hasMore && (
              <div className="mt-8 flex justify-center">
                <button
                  onClick={loadMoreBusinesses}
                  disabled={loadingMore}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loadingMore ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} spin />
                      Loading...
                    </>
                  ) : (
                    'Load More'
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

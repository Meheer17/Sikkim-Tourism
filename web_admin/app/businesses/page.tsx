'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBuilding, 
  faSearch, 
  faFilter, 
  faStar, 
  faCheck, 
  faTimes, 
  faPause, 
  faPlay, 
  faTrash,
  faSpinner,
  faEye 
} from '@fortawesome/free-solid-svg-icons';
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
  updated_at: string;
}

export default function BusinessesPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending'>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const itemsPerPage = 20;

  useEffect(() => {
    loadBusinesses();
  }, []);

  useEffect(() => {
    filterBusinesses();
  }, [businesses, searchQuery, statusFilter]);

  const loadBusinesses = async (page: number = 1, append: boolean = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      const response = await axiosInstance.get<Business[]>('/api/v1/business', {
        params: { skip: (page - 1) * itemsPerPage, limit: itemsPerPage }
      });
      const newBusinesses = response.data || [];
      if (append) {
        setBusinesses(prev => [...prev, ...newBusinesses]);
      } else {
        setBusinesses(newBusinesses);
      }
      setHasMore(newBusinesses.length === itemsPerPage);
      setCurrentPage(page);
    } catch (error) {
      console.error('Failed to load businesses:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreBusinesses = () => {
    if (!loadingMore && hasMore) {
      loadBusinesses(currentPage + 1, true);
    }
  };

  const filterBusinesses = () => {
    let filtered = businesses;

    // Filter by status
    if (statusFilter === 'active') {
      filtered = filtered.filter(b => b.approved);
    } else if (statusFilter === 'pending') {
      filtered = filtered.filter(b => !b.approved);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(b =>
        b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredBusinesses(filtered);
  };

  const handleApprove = async (businessId: string) => {
    setProcessingId(businessId);
    try {
      await axiosInstance.put(`/api/v1/business/${businessId}/approve`);
      setBusinesses(prev =>
        prev.map(b => (b.id === businessId ? { ...b, approved: true } : b))
      );
    } catch (error) {
      console.error('Failed to approve business:', error);
      alert('Failed to approve business');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (businessId: string, businessName: string) => {
    if (!confirm(`Are you sure you want to delete "${businessName}"?`)) return;

    setProcessingId(businessId);
    try {
      await axiosInstance.delete(`/api/v1/business/${businessId}`);
      setBusinesses(prev => prev.filter(b => b.id !== businessId));
    } catch (error) {
      console.error('Failed to delete business:', error);
      alert('Failed to delete business');
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (approved: boolean) => {
    if (approved) {
      return (
        <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-semibold rounded-full">
          Active
        </span>
      );
    }
    return (
      <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-sm font-semibold rounded-full">
        Pending
      </span>
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      
      <main className="flex-1 ml-64 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <FontAwesomeIcon icon={faBuilding} className="text-purple-500" />
            Businesses
          </h1>
          <p className="text-gray-600 mt-2">{filteredBusinesses.length} businesses found</p>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <FontAwesomeIcon 
                icon={faSearch} 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
              />
              <input
                type="text"
                placeholder="Search businesses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-gray-900 placeholder:text-gray-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  statusFilter === 'all'
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('active')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  statusFilter === 'active'
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  statusFilter === 'pending'
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Pending
              </button>
            </div>
          </div>
        </div>

        {/* Business List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <FontAwesomeIcon icon={faSpinner} className="animate-spin text-4xl text-gray-400" />
          </div>
        ) : filteredBusinesses.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <FontAwesomeIcon icon={faBuilding} className="text-6xl text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No businesses found</h2>
            <p className="text-gray-600">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredBusinesses.map((business) => (
              <div key={business.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{business.name}</h3>
                      {getStatusBadge(business.approved)}
                    </div>
                    <p className="text-gray-600">
                      {business.short_description || business.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-500">
                    Created: {new Date(business.created_at).toLocaleDateString()}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push(`/business-details?id=${business.id}`)}
                      className="w-10 h-10 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center"
                      title="View Details"
                    >
                      <FontAwesomeIcon icon={faEye} />
                    </button>
                    {!business.approved && (
                      <button
                        onClick={() => handleApprove(business.id)}
                        disabled={processingId === business.id}
                        className="w-10 h-10 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:bg-gray-400 flex items-center justify-center"
                        title="Approve"
                      >
                        <FontAwesomeIcon icon={faCheck} />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(business.id, business.name)}
                      disabled={processingId === business.id}
                      className="w-10 h-10 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:bg-gray-400 flex items-center justify-center"
                      title="Delete"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Pagination Controls */}
        {!loading && filteredBusinesses.length > 0 && hasMore && (
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
      </main>
    </div>
  );
}

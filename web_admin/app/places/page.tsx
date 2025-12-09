'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import axiosInstance from '@/lib/axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMapMarkerAlt, faPlus, faSearch, faSpinner, faEye, faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import { buildImageUrl } from '@/utils/image-url';

interface Place {
  id: string;
  name: string;
  short_description: string;
  type: string;
  position: { x: number; y: number };
  metadata?: {
    images?: string[];
    panorama_360?: string;
  };
}

export default function PlacesPage() {
  const router = useRouter();
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const itemsPerPage = 20;

  useEffect(() => {
    loadPlaces();
  }, []);

  const loadPlaces = async (page: number = 1, append: boolean = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    try {
      const response = await axiosInstance.get('/api/v1/location', {
        params: { skip: (page - 1) * itemsPerPage, limit: itemsPerPage }
      });
      const newPlaces = response.data || [];
      if (append) {
        setPlaces(prev => [...prev, ...newPlaces]);
      } else {
        setPlaces(newPlaces);
      }
      setHasMore(newPlaces.length === itemsPerPage);
      setCurrentPage(page);
    } catch (error) {
      console.error('Failed to load places:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMorePlaces = () => {
    if (!loadingMore && hasMore) {
      loadPlaces(currentPage + 1, true);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This action cannot be undone.`)) return;

    try {
      await axiosInstance.delete(`/api/v1/location/${id}`);
      alert('Place deleted successfully');
      loadPlaces();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to delete place');
    }
  };

  const filteredPlaces = places.filter(place => {
    const matchesSearch = place.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         place.short_description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || place.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const types = ['all', ...Array.from(new Set(places.map(p => p.type)))];

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 overflow-auto ml-64">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Places & Locations</h1>
              <p className="text-sm text-gray-500 mt-1">Manage tourism locations and attractions</p>
            </div>
            <button
              onClick={() => router.push('/add-place')}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <FontAwesomeIcon icon={faPlus} />
              Add New Place
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <FontAwesomeIcon 
                icon={faSearch} 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Search places..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
              />
            </div>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            >
              {types.map(type => (
                <option key={type} value={type}>
                  {type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <FontAwesomeIcon icon={faSpinner} spin size="3x" className="text-blue-600" />
            </div>
          ) : filteredPlaces.length === 0 ? (
            <div className="text-center py-20">
              <FontAwesomeIcon icon={faMapMarkerAlt} size="4x" className="text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg">No places found</p>
              <button
                onClick={() => router.push('/add-place')}
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add First Place
              </button>
            </div>
          ) : (
            <>
              <div className="mb-4 text-sm text-gray-600">
                Showing {filteredPlaces.length} of {places.length} places
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPlaces.map((place) => (
                  <div key={place.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                    {/* Image */}
                    {place.metadata?.images && place.metadata.images.length > 0 ? (
                      <div className="relative h-48 bg-gray-200">
                        <img 
                          src={buildImageUrl(place.metadata.images[0]) || place.metadata.images[0]} 
                          alt={place.name}
                          className="w-full h-full object-cover"
                        />
                        {place.metadata.panorama_360 && (
                          <div className="absolute top-2 right-2 bg-green-600 text-white px-2 py-1 rounded text-xs font-semibold">
                            360°
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="h-48 bg-gray-100 flex items-center justify-center">
                        <FontAwesomeIcon icon={faMapMarkerAlt} size="3x" className="text-gray-300" />
                      </div>
                    )}

                    {/* Content */}
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-1">
                            {place.name}
                          </h3>
                          <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded uppercase">
                            {place.type}
                          </span>
                        </div>
                      </div>

                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {place.short_description}
                      </p>

                      <div className="text-xs text-gray-500 mb-4">
                        <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-1" />
                        {place.position.y.toFixed(4)}, {place.position.x.toFixed(4)}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => router.push(`/place-details?id=${place.id}`)}
                          className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                        >
                          <FontAwesomeIcon icon={faEye} className="mr-1" />
                          View
                        </button>
                        <button
                          onClick={() => router.push(`/edit-place?id=${place.id}`)}
                          className="flex-1 px-3 py-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
                        >
                          <FontAwesomeIcon icon={faEdit} className="mr-1" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(place.id, place.name)}
                          className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Pagination Controls */}
              {hasMore && (
                <div className="mt-8 flex justify-center">
                  <button
                    onClick={loadMorePlaces}
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}

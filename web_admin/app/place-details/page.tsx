'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import axiosInstance from '@/lib/axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMapMarkerAlt, faArrowLeft, faEdit, faSpinner, faImage, faGlobe, faMapPin, faTag } from '@fortawesome/free-solid-svg-icons';
import { buildImageUrl } from '@/utils/image-url';

interface Place {
  id: string;
  name: string;
  description: string;
  short_description: string;
  position: { x: number; y: number };
  type: string;
  metadata?: {
    images?: string[];
    panorama_360?: string;
    [key: string]: any;
  };
  created_at?: string;
  updated_at?: string;
}

export default function PlaceDetailsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  
  const [place, setPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (id) {
      loadPlaceDetails();
    } else {
      alert('No place ID provided');
      router.push('/places');
    }
  }, [id]);

  const loadPlaceDetails = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/api/v1/location/${id}`);
      setPlace(response.data);
    } catch (error) {
      console.error('Failed to load place:', error);
      alert('Failed to load place details');
      router.push('/places');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    router.push(`/edit-place?id=${id}`);
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <FontAwesomeIcon icon={faSpinner} spin size="3x" className="text-blue-600 mb-4" />
            <p className="text-gray-600">Loading place details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!place) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600 text-lg mb-4">Place not found</p>
            <button
              onClick={() => router.push('/places')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back to Places
            </button>
          </div>
        </div>
      </div>
    );
  }

  const images = (place.metadata?.images || []).map(img => buildImageUrl(img) || img);
  const has360 = !!place.metadata?.panorama_360;

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FontAwesomeIcon icon={faArrowLeft} className="text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Place Details</h1>
                <p className="text-sm text-gray-500 mt-1">{place.name}</p>
              </div>
            </div>
            <button
              onClick={handleEdit}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FontAwesomeIcon icon={faEdit} />
              Edit Place
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Image Gallery */}
            {images.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="relative">
                  <img 
                    src={images[currentImageIndex]} 
                    alt={place.name}
                    className="w-full h-96 object-cover"
                  />
                  {images.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                      {images.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentImageIndex(idx)}
                          className={`w-3 h-3 rounded-full transition-all ${
                            idx === currentImageIndex 
                              ? 'bg-white w-8' 
                              : 'bg-white/50 hover:bg-white/75'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
                <div className="p-4 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-600">
                    <FontAwesomeIcon icon={faImage} />
                    <span className="text-sm font-medium">
                      {images.length} {images.length === 1 ? 'Image' : 'Images'}
                    </span>
                  </div>
                  {has360 && (
                    <div className="flex items-center gap-2 text-green-600">
                      <FontAwesomeIcon icon={faGlobe} />
                      <span className="text-sm font-medium">360° Panorama Available</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Main Info Card */}
            <div className="bg-white rounded-lg shadow-sm p-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full uppercase">
                      <FontAwesomeIcon icon={faTag} className="mr-1" />
                      {place.type}
                    </span>
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">{place.name}</h2>
                  <p className="text-lg text-gray-600">{place.short_description}</p>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-6 mt-6">
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Full Description</h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{place.description}</p>
              </div>
            </div>

            {/* Location Info Card */}
            <div className="bg-white rounded-lg shadow-sm p-8">
              <div className="flex items-center gap-3 mb-6">
                <FontAwesomeIcon icon={faMapPin} className="text-blue-600 text-xl" />
                <h2 className="text-xl font-bold text-gray-800">Location Information</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Latitude</label>
                  <p className="text-gray-900 font-mono">{place.position.y.toFixed(6)}</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Longitude</label>
                  <p className="text-gray-900 font-mono">{place.position.x.toFixed(6)}</p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Coordinates</label>
                  <p className="text-gray-600 text-sm">
                    <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-2 text-blue-500" />
                    {place.position.y.toFixed(6)}, {place.position.x.toFixed(6)}
                  </p>
                </div>

                {place.created_at && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Created</label>
                    <p className="text-gray-900">{new Date(place.created_at).toLocaleDateString()}</p>
                  </div>
                )}

                {place.updated_at && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Last Updated</label>
                    <p className="text-gray-900">{new Date(place.updated_at).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Additional Metadata */}
            {place.metadata && Object.keys(place.metadata).filter(k => k !== 'images' && k !== 'panorama_360').length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-8">
                <h2 className="text-xl font-bold text-gray-800 mb-6">Additional Information</h2>
                <div className="space-y-4">
                  {Object.entries(place.metadata)
                    .filter(([key]) => key !== 'images' && key !== 'panorama_360')
                    .map(([key, value]) => (
                      <div key={key} className="flex border-b border-gray-100 pb-3">
                        <span className="text-sm font-semibold text-gray-600 w-48 capitalize">
                          {key.replace(/_/g, ' ')}:
                        </span>
                        <span className="text-sm text-gray-900 flex-1">
                          {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

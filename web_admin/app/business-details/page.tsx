'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import axiosInstance from '@/lib/axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBuilding, faArrowLeft, faCheckCircle, faClock, faMapMarkerAlt, faTrash, faSpinner, faList } from '@fortawesome/free-solid-svg-icons';

interface Business {
  id: string;
  name: string;
  description: string;
  short_description?: string;
  open_hours?: { start: string; end: string };
  type_id: string;
  l_id: string;
  scheduled_at: string;
  approved: boolean;
  created_at?: string;
  updated_at?: string;
}

interface Service {
  id: string;
  name: string;
  price: number;
  short_description?: string;
}

export default function BusinessDetailsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  
  const [business, setBusiness] = useState<Business | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    if (id) {
      loadBusinessDetails();
    } else {
      alert('No business ID provided');
      router.push('/businesses');
    }
  }, [id]);

  const loadBusinessDetails = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const businessResp = await axiosInstance.get(`/api/v1/business/${id}`);
      setBusiness(businessResp.data);

      // Load services
      try {
        const servicesResp = await axiosInstance.get('/api/v1/services', {
          params: { bid: id, skip: 0, limit: 100 }
        });
        setServices(servicesResp.data || []);
      } catch (error) {
        console.error('Failed to load services:', error);
      }
    } catch (error) {
      console.error('Failed to load business:', error);
      alert('Failed to load business details');
      router.push('/businesses');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!business || !id) return;
    
    if (!confirm(`Approve "${business.name}"?`)) return;

    setApproving(true);
    try {
      await axiosInstance.put(`/api/v1/business/${id}/approve`);
      alert('Business approved successfully');
      loadBusinessDetails();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to approve business');
    } finally {
      setApproving(false);
    }
  };

  const handleDelete = async () => {
    if (!business || !id) return;
    
    if (!confirm(`Delete "${business.name}"? This action cannot be undone.`)) return;

    try {
      await axiosInstance.delete(`/api/v1/business/${id}`);
      alert('Business deleted successfully');
      router.push('/businesses');
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to delete business');
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <FontAwesomeIcon icon={faSpinner} spin size="3x" className="text-blue-600 mb-4" />
            <p className="text-gray-600">Loading business details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600 text-lg mb-4">Business not found</p>
            <button
              onClick={() => router.push('/businesses')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back to Businesses
            </button>
          </div>
        </div>
      </div>
    );
  }

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
                <h1 className="text-2xl font-bold text-gray-800">Business Details</h1>
                <p className="text-sm text-gray-500 mt-1">{business.name}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Status Card */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${business.approved ? 'bg-green-100' : 'bg-yellow-100'}`}>
                  <FontAwesomeIcon 
                    icon={business.approved ? faCheckCircle : faClock} 
                    className={business.approved ? 'text-green-600' : 'text-yellow-600'} 
                  />
                  <span className={`font-semibold text-sm ${business.approved ? 'text-green-700' : 'text-yellow-700'}`}>
                    {business.approved ? 'Approved' : 'Pending Approval'}
                  </span>
                </div>
                {!business.approved && (
                  <button
                    onClick={handleApprove}
                    disabled={approving}
                    className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                  >
                    {approving ? (
                      <FontAwesomeIcon icon={faSpinner} spin />
                    ) : (
                      <FontAwesomeIcon icon={faCheckCircle} />
                    )}
                    {approving ? 'Approving...' : 'Approve Business'}
                  </button>
                )}
              </div>
            </div>

            {/* Business Info Card */}
            <div className="bg-white rounded-lg shadow-sm p-8">
              <div className="flex items-center gap-3 mb-6">
                <FontAwesomeIcon icon={faBuilding} className="text-blue-600 text-xl" />
                <h2 className="text-xl font-bold text-gray-800">Business Information</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Name</label>
                  <p className="text-gray-900 font-medium">{business.name}</p>
                </div>

                {business.short_description && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Short Description</label>
                    <p className="text-gray-900">{business.short_description}</p>
                  </div>
                )}

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Description</label>
                  <p className="text-gray-900 leading-relaxed">{business.description}</p>
                </div>

                {business.open_hours && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                      <FontAwesomeIcon icon={faClock} className="mr-2 text-blue-500" />
                      Opening Hours
                    </label>
                    <p className="text-gray-900">
                      {business.open_hours.start} - {business.open_hours.end}
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                    <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-2 text-blue-500" />
                    Location ID
                  </label>
                  <p className="text-gray-900 font-mono text-sm">{business.l_id}</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Scheduled At</label>
                  <p className="text-gray-900">{new Date(business.scheduled_at).toLocaleString()}</p>
                </div>

                {business.created_at && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Created</label>
                    <p className="text-gray-900">{new Date(business.created_at).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Services Card */}
            <div className="bg-white rounded-lg shadow-sm p-8">
              <div className="flex items-center gap-3 mb-6">
                <FontAwesomeIcon icon={faList} className="text-blue-600 text-xl" />
                <h2 className="text-xl font-bold text-gray-800">Services ({services.length})</h2>
              </div>

              {services.length > 0 ? (
                <div className="space-y-4">
                  {services.map((service) => (
                    <div key={service.id} className="border-b border-gray-100 pb-4 last:border-0">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{service.name}</h3>
                        <span className="text-lg font-bold text-blue-600">₹{service.price}</span>
                      </div>
                      {service.short_description && (
                        <p className="text-gray-600 text-sm">{service.short_description}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8 italic">No services listed</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <button
                onClick={handleDelete}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 border border-red-200 transition-colors"
              >
                <FontAwesomeIcon icon={faTrash} />
                Delete Business
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

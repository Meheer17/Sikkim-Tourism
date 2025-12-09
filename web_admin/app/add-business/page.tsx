'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import axiosInstance from '@/lib/axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBuilding, faClock, faMapMarkerAlt, faSave, faArrowLeft, faImage } from '@fortawesome/free-solid-svg-icons';

interface Location {
  id: string;
  name: string;
}

export default function AddBusinessPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    short_description: '',
    open_hours_start: '09:00',
    open_hours_end: '18:00',
    type_id: '000000000000000000000000',
    l_id: '',
    scheduled_at: new Date().toISOString().slice(0, 16),
  });

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      const response = await axiosInstance.get('/api/v1/location', {
        params: { skip: 0, limit: 100 }
      });
      setLocations(response.data || []);
      if (response.data && response.data.length > 0) {
        setFormData(prev => ({ ...prev, l_id: response.data[0].id }));
      }
    } catch (error) {
      console.error('Failed to load locations:', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.description.trim() || !formData.short_description.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    if (!formData.l_id) {
      alert('Please select a location');
      return;
    }

    setLoading(true);
    try {
      // Step 1: Upload image if selected
      let imageIdentifier = '';
      if (selectedFile) {
        const fileFormData = new FormData();
        fileFormData.append('file', selectedFile);
        
        const uploadResponse = await axiosInstance.post('/api/v1/upload/image', fileFormData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        if (uploadResponse.data) {
          imageIdentifier = uploadResponse.data.fileName || uploadResponse.data.url || uploadResponse.data.id || '';
        }
      }

      // Step 2: Create business
      const businessPayload = {
        name: formData.name,
        description: formData.description,
        short_description: formData.short_description,
        open_hours: {
          start: formData.open_hours_start,
          end: formData.open_hours_end
        },
        type_id: formData.type_id,
        l_id: formData.l_id,
        scheduled_at: formData.scheduled_at
      };

      const response = await axiosInstance.post('/api/v1/business', businessPayload);

      // Step 3: Update location metadata with image if uploaded
      if (imageIdentifier && response.data) {
        const locationId = response.data.l_id || formData.l_id;
        try {
          await axiosInstance.put(`/api/v1/location/${locationId}`, {
            metadata: {
              images: [imageIdentifier]
            }
          });
        } catch (metaError) {
          console.error('Failed to update location metadata:', metaError);
        }
      }

      alert('Business added successfully!');
      router.push('/businesses');
    } catch (error: any) {
      console.error('Failed to create business:', error);
      alert(error.response?.data?.detail || 'Failed to create business');
    } finally {
      setLoading(false);
    }
  };

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
                <h1 className="text-2xl font-bold text-gray-800">Add New Business</h1>
                <p className="text-sm text-gray-500 mt-1">Create a new business listing</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="p-8">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm p-8 space-y-6">
              {/* Business Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <FontAwesomeIcon icon={faBuilding} className="mr-2 text-blue-500" />
                  Business Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                  placeholder="Enter business name"
                  required
                />
              </div>

              {/* Short Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Short Description *
                </label>
                <input
                  type="text"
                  value={formData.short_description}
                  onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                  placeholder="Brief description (max 255 chars)"
                  maxLength={255}
                  required
                />
              </div>

              {/* Full Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                  placeholder="Detailed description"
                  rows={4}
                  required
                />
              </div>

              {/* Opening Hours */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <FontAwesomeIcon icon={faClock} className="mr-2 text-blue-500" />
                  Opening Hours *
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Start Time</label>
                    <input
                      type="time"
                      value={formData.open_hours_start}
                      onChange={(e) => setFormData({ ...formData, open_hours_start: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">End Time</label>
                    <input
                      type="time"
                      value={formData.open_hours_end}
                      onChange={(e) => setFormData({ ...formData, open_hours_end: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-2 text-blue-500" />
                  Location *
                </label>
                <select
                  value={formData.l_id}
                  onChange={(e) => setFormData({ ...formData, l_id: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  required
                >
                  <option value="">Select a location</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Scheduled At */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Scheduled Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={formData.scheduled_at}
                  onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
              </div>

              {/* Business Photo */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <FontAwesomeIcon icon={faImage} className="mr-2 text-blue-500" />
                  Business Photo
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {selectedFile && (
                  <p className="mt-2 text-sm text-gray-600">
                    Selected: {selectedFile.name}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <FontAwesomeIcon icon={faSave} />
                  {loading ? 'Creating...' : 'Create Business'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import axiosInstance from '@/lib/axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMapMarkerAlt, faSave, faArrowLeft, faImage, faGlobe, faMapPin } from '@fortawesome/free-solid-svg-icons';

const LOCATION_TYPES = [
  { label: 'Emergency', value: 'emergency' },
  { label: 'Local Help', value: 'localhelp' },
  { label: 'Business', value: 'business' },
  { label: 'Event', value: 'event' },
  { label: 'Tourism', value: 'tourism' },
  { label: 'Other', value: 'other' },
];

export default function AddPlacePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploading360, setUploading360] = useState(false);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [panoramaFile, setPanoramaFile] = useState<File | null>(null);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploaded360, setUploaded360] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    short_description: '',
    latitude: '',
    longitude: '',
    type: 'tourism' as string,
  });

  const handleGalleryFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setGalleryFiles(Array.from(e.target.files));
    }
  };

  const handlePanoramaFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate JPG format
      if (!file.type.includes('jpeg') && !file.type.includes('jpg')) {
        alert('360° panorama must be in JPG format');
        return;
      }

      // Validate aspect ratio
      const img = new Image();
      img.onload = () => {
        const aspectRatio = img.width / img.height;
        if (Math.abs(aspectRatio - 2.0) > 0.1) {
          alert(`360° images must have a 2:1 aspect ratio.\nYour image: ${img.width}x${img.height} (${aspectRatio.toFixed(2)}:1)`);
          setPanoramaFile(null);
        } else {
          setPanoramaFile(file);
        }
      };
      img.src = URL.createObjectURL(file);
    }
  };

  const handleUploadGallery = async () => {
    if (galleryFiles.length === 0) return;

    setUploadingImages(true);
    try {
      const uploadedUrls: string[] = [];
      
      for (const file of galleryFiles) {
        const fileFormData = new FormData();
        fileFormData.append('file', file);
        
        const response = await axiosInstance.post('/api/v1/upload/image', fileFormData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        if (response.data) {
          const imageUrl = response.data.cdn_url || response.data.url || response.data.fileName || '';
          if (imageUrl) uploadedUrls.push(imageUrl);
        }
      }

      setUploadedImages([...uploadedImages, ...uploadedUrls]);
      setGalleryFiles([]);
      alert(`Successfully uploaded ${uploadedUrls.length} image(s)`);
    } catch (error) {
      console.error('Failed to upload gallery images:', error);
      alert('Failed to upload some images');
    } finally {
      setUploadingImages(false);
    }
  };

  const handleUploadPanorama = async () => {
    if (!panoramaFile) return;

    setUploading360(true);
    try {
      const fileFormData = new FormData();
      fileFormData.append('file', panoramaFile);
      
      const response = await axiosInstance.post('/api/v1/upload/image', fileFormData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data) {
        const imageUrl = response.data.cdn_url || response.data.url || response.data.fileName || '';
        if (imageUrl) {
          setUploaded360(imageUrl);
          setPanoramaFile(null);
          alert('360° panorama uploaded successfully');
        }
      }
    } catch (error) {
      console.error('Failed to upload 360° image:', error);
      alert('Failed to upload 360° panorama');
    } finally {
      setUploading360(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.description.trim() || !formData.short_description.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    const lat = parseFloat(formData.latitude);
    const lng = parseFloat(formData.longitude);
    if (isNaN(lat) || isNaN(lng)) {
      alert('Please enter valid coordinates');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        short_description: formData.short_description,
        position: { x: lng, y: lat }, // x=longitude, y=latitude
        type: formData.type,
        metadata: {
          ...(uploadedImages.length > 0 && { images: uploadedImages }),
          ...(uploaded360 && { panorama_360: uploaded360 }),
        },
      };

      await axiosInstance.post('/api/v1/location', payload);
      alert('Place added successfully!');
      router.push('/places');
    } catch (error: any) {
      console.error('Failed to create place:', error);
      alert(error.response?.data?.detail || 'Failed to create place');
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
                <h1 className="text-2xl font-bold text-gray-800">Add New Place</h1>
                <p className="text-sm text-gray-500 mt-1">Create a new tourism location</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="p-8">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm p-8 space-y-6">
              {/* Place Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-2 text-blue-500" />
                  Place Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                  placeholder="Enter place name"
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

              {/* Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Location Type *
                </label>
                <div className="flex flex-wrap gap-2">
                  {LOCATION_TYPES.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, type: type.value })}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        formData.type === type.value
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Coordinates */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <FontAwesomeIcon icon={faMapPin} className="mr-2 text-blue-500" />
                  Location Coordinates *
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.latitude}
                      onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                      placeholder="27.3314"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.longitude}
                      onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                      placeholder="88.6138"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Gallery Images */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <FontAwesomeIcon icon={faImage} className="mr-2 text-blue-500" />
                  Gallery Images
                </label>
                <p className="text-xs text-gray-500 mb-3">Upload multiple images to showcase this location</p>
                
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleGalleryFiles}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                
                {galleryFiles.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm text-gray-600 mb-2">
                      {galleryFiles.length} file(s) selected
                    </p>
                    <button
                      type="button"
                      onClick={handleUploadGallery}
                      disabled={uploadingImages}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                    >
                      {uploadingImages ? 'Uploading...' : 'Upload Gallery Images'}
                    </button>
                  </div>
                )}

                {uploadedImages.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-green-600">
                      ✓ {uploadedImages.length} image(s) uploaded successfully
                    </p>
                  </div>
                )}
              </div>

              {/* 360° Panorama */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <FontAwesomeIcon icon={faGlobe} className="mr-2 text-blue-500" />
                  360° Panorama
                </label>
                <p className="text-xs text-gray-500 mb-3">Upload a 360° equirectangular image (2:1 aspect ratio, JPG format)</p>
                
                <input
                  type="file"
                  accept="image/jpeg,image/jpg"
                  onChange={handlePanoramaFile}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                />
                
                {panoramaFile && (
                  <div className="mt-3">
                    <p className="text-sm text-gray-600 mb-2">
                      Selected: {panoramaFile.name}
                    </p>
                    <button
                      type="button"
                      onClick={handleUploadPanorama}
                      disabled={uploading360}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                    >
                      {uploading360 ? 'Uploading...' : 'Upload 360° Panorama'}
                    </button>
                  </div>
                )}

                {uploaded360 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-green-600">
                      ✓ 360° panorama uploaded successfully
                    </p>
                  </div>
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
                  {loading ? 'Creating...' : 'Create Place'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

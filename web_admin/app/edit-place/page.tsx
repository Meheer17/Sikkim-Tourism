'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import axiosInstance from '@/lib/axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMapMarkerAlt, faSave, faArrowLeft, faImage, faGlobe, faMapPin, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { buildImageUrl } from '@/utils/image-url';

const LOCATION_TYPES = [
  { label: 'Emergency', value: 'emergency' },
  { label: 'Local Help', value: 'localhelp' },
  { label: 'Business', value: 'business' },
  { label: 'Event', value: 'event' },
  { label: 'Tourism', value: 'tourism' },
  { label: 'Other', value: 'other' },
];

export default function EditPlacePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  
  const [loadingPlace, setLoadingPlace] = useState(true);
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

  useEffect(() => {
    if (id) {
      loadPlaceData();
    } else {
      alert('No place ID provided');
      router.push('/places');
    }
  }, [id]);

  const loadPlaceData = async () => {
    if (!id) return;
    
    setLoadingPlace(true);
    try {
      const response = await axiosInstance.get(`/api/v1/location/${id}`);
      const place = response.data;
      
      setFormData({
        name: place.name,
        description: place.description,
        short_description: place.short_description,
        latitude: String(place.position.y),
        longitude: String(place.position.x),
        type: place.type,
      });

      if (place.metadata?.images) {
        setUploadedImages(place.metadata.images);
      }
      if (place.metadata?.panorama_360) {
        setUploaded360(place.metadata.panorama_360);
      }
    } catch (error) {
      console.error('Failed to load place:', error);
      alert('Failed to load place data');
      router.push('/places');
    } finally {
      setLoadingPlace(false);
    }
  };

  const handleGalleryFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setGalleryFiles(Array.from(e.target.files));
    }
  };

  const handlePanoramaFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      if (!file.type.includes('jpeg') && !file.type.includes('jpg')) {
        alert('360° panorama must be in JPG format');
        return;
      }

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

  const handleRemoveImage = (index: number) => {
    if (confirm('Remove this image?')) {
      setUploadedImages(uploadedImages.filter((_, i) => i !== index));
    }
  };

  const handleRemove360 = () => {
    if (confirm('Remove 360° panorama?')) {
      setUploaded360('');
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

    if (!id) {
      alert('No place ID available');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        short_description: formData.short_description,
        position: { x: lng, y: lat },
        type: formData.type,
        metadata: {
          ...(uploadedImages.length > 0 && { images: uploadedImages }),
          ...(uploaded360 && { panorama_360: uploaded360 }),
        },
      };

      await axiosInstance.put(`/api/v1/location/${id}`, payload);
      alert('Place updated successfully!');
      router.push('/places');
    } catch (error: any) {
      console.error('Failed to update place:', error);
      alert(error.response?.data?.detail || 'Failed to update place');
    } finally {
      setLoading(false);
    }
  };

  if (loadingPlace) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <FontAwesomeIcon icon={faSpinner} spin size="3x" className="text-blue-600 mb-4" />
            <p className="text-gray-600">Loading place data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <FontAwesomeIcon icon={faArrowLeft} className="text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Edit Place</h1>
                <p className="text-sm text-gray-500 mt-1">Update location information</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm p-8 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-2 text-blue-500" />
                  Place Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Short Description *</label>
                <input
                  type="text"
                  value={formData.short_description}
                  onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  maxLength={255}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  rows={4}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Location Type *</label>
                <div className="flex flex-wrap gap-2">
                  {LOCATION_TYPES.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, type: type.value })}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        formData.type === type.value ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <FontAwesomeIcon icon={faMapPin} className="mr-2 text-blue-500" />
                  Coordinates *
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.latitude}
                      onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <FontAwesomeIcon icon={faImage} className="mr-2 text-blue-500" />
                  Gallery Images ({uploadedImages.length})
                </label>
                {uploadedImages.length > 0 && (
                  <div className="grid grid-cols-4 gap-3 mb-3">
                    {uploadedImages.map((img, idx) => (
                      <div key={idx} className="relative group">
                        <img src={buildImageUrl(img) || img} alt="" className="w-full h-24 object-cover rounded-lg" />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <input type="file" accept="image/*" multiple onChange={handleGalleryFiles} className="w-full px-4 py-3 border border-gray-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700" />
                {galleryFiles.length > 0 && (
                  <button type="button" onClick={handleUploadGallery} disabled={uploadingImages} className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400">
                    {uploadingImages ? 'Uploading...' : `Upload ${galleryFiles.length} Images`}
                  </button>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <FontAwesomeIcon icon={faGlobe} className="mr-2 text-green-500" />
                  360° Panorama
                </label>
                {uploaded360 && (
                  <div className="mb-3 relative group">
                    <img src={buildImageUrl(uploaded360) || uploaded360} alt="360 panorama" className="w-full h-32 object-cover rounded-lg" />
                    <button type="button" onClick={handleRemove360} className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                      Remove
                    </button>
                  </div>
                )}
                <input type="file" accept="image/jpeg,image/jpg" onChange={handlePanoramaFile} className="w-full px-4 py-3 border border-gray-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-green-50 file:text-green-700" />
                {panoramaFile && (
                  <button type="button" onClick={handleUploadPanorama} disabled={uploading360} className="mt-3 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400">
                    {uploading360 ? 'Uploading...' : 'Upload 360° Panorama'}
                  </button>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => router.back()} className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center justify-center gap-2">
                  <FontAwesomeIcon icon={faSave} />
                  {loading ? 'Updating...' : 'Update Place'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

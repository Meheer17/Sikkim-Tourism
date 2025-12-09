# 360° Panorama Stitching - Implementation Guide

## Overview
Implemented Google Photo Sphere-like image stitching that combines multiple photos into a seamless 360° equirectangular panorama using OpenCV and advanced computer vision algorithms.

## Features Implemented

### Backend (Python + OpenCV)
✅ **Advanced Image Stitching Service** (`be/app/services/panorama_service.py`)
- **Feature Detection**: SIFT (best quality) with ORB fallback (faster, free)
- **Matching Algorithms**: FLANN-based for SIFT, Brute Force for ORB
- **Projection Modes**:
  - `auto`: Automatic detection (recommended)
  - `cylindrical`: Horizontal panoramas
  - `spherical`: Full 360° photo spheres
- **Quality Features**:
  - Lowe's ratio test for match filtering (70% threshold)
  - RANSAC homography estimation for robustness
  - Multi-band blending for seamless transitions
  - Equirectangular projection for 360° viewing
  - Automatic 2:1 aspect ratio normalization

✅ **REST API Endpoint** (`POST /api/v1/upload/stitch-panorama`)
- Accepts 2-20 images in ordered sequence
- Validates image format and overlap
- Returns CDN URL of stitched panorama
- Processing time: 10-60 seconds depending on resolution
- Automatic upload to CDN after stitching

### Frontend (React Native + Expo)
✅ **Multi-Image Picker** ([edit-place.tsx](mobile_app/app/(government)/(stack)/edit-place.tsx))
- Two-mode selection:
  1. **Stitch Multiple Photos**: Pick 2-20 images to stitch
  2. **Upload Single 360° Photo**: Direct upload of pre-made panorama
- Built-in validation (2-20 images, overlap checks)
- User guidance with instructions overlay
- Progress indicator during stitching

✅ **File Service Integration** ([file.service.ts](mobile_app/services/file.service.ts))
- `stitchPanorama()` method for API calls
- Automatic FormData creation for multiple files
- Error handling with user-friendly messages

## How It Works

### Image Stitching Algorithm

```
┌─────────────────────────────────────────────────────┐
│ 1. FEATURE DETECTION (SIFT/ORB)                    │
│    - Detect keypoints in each image                │
│    - Compute descriptors for matching              │
└─────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ 2. FEATURE MATCHING                                 │
│    - Match descriptors between adjacent images     │
│    - Apply Lowe's ratio test (0.7 threshold)      │
│    - Filter out false matches                      │
└─────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ 3. HOMOGRAPHY ESTIMATION                            │
│    - RANSAC algorithm for robust estimation        │
│    - Calculate transformation matrix               │
│    - Remove outliers (5px threshold)               │
└─────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ 4. WARPING & BLENDING                               │
│    - Perspective transform to align images         │
│    - Multi-band blending for seam elimination      │
│    - Sequential stitching (left-to-right)          │
└─────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ 5. EQUIRECTANGULAR PROJECTION                       │
│    - Map planar to spherical coordinates           │
│    - Ensure 2:1 aspect ratio (360° viewing)        │
│    - Bilinear interpolation for smoothness         │
└─────────────────────────────────────────────────────┘
                    ↓
          [360° Panorama Ready!]
```

### User Workflow

```
Mobile App (Government)
       ↓
[Tap "Add 360°" button]
       ↓
Choose: "Stitch Multiple Photos" or "Upload Single 360° Photo"
       ↓
[Stitch Multiple Photos selected]
       ↓
Pick 2-20 images (Photos or Files)
       ↓
Validation: count, format, size
       ↓
User confirms stitching
       ↓
Upload all images to backend
       ↓
Backend: OpenCV stitching (10-60s)
       ↓
Save to CDN & return URL
       ↓
Display success with dimensions
       ↓
[User clicks Save to update location]
```

## API Usage

### Endpoint: `POST /api/v1/upload/stitch-panorama`

**Request:**
```bash
curl -X POST http://localhost:8000/api/v1/upload/stitch-panorama \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "files=@image_001.jpg" \
  -F "files=@image_002.jpg" \
  -F "files=@image_003.jpg" \
  -F "files=@image_004.jpg" \
  -F "files=@image_005.jpg" \
  -F "files=@image_006.jpg" \
  -F "mode=auto" \
  -F "location_id=675a1b2c3d4e5f6789abcdef"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "cdn_url": "https://cdn.example.com/panoramas/pano_12345.jpg",
    "url": "https://cdn.example.com/panoramas/pano_12345.jpg",
    "dimensions": {
      "width": 8192,
      "height": 4096
    },
    "images_stitched": 6,
    "aspect_ratio": "2.00:1",
    "is_360_panorama": true,
    "file_id": "675a9876543210fedcba9876",
    "created_at": "2025-12-08T10:30:00Z"
  },
  "message": "Panorama stitched successfully"
}
```

**Error Responses:**
```json
// Insufficient images
{
  "success": false,
  "message": "Need at least 2 images to stitch a panorama",
  "status_code": 400
}

// Stitching failed
{
  "success": false,
  "message": "Failed to stitch images. Ensure images overlap by 30-40% and are taken from the same location.",
  "status_code": 422
}

// Too many images
{
  "success": false,
  "message": "Maximum 20 images allowed per panorama",
  "status_code": 400
}
```

## Photography Best Practices

### How to Capture Images for Stitching

1. **Stand in One Spot**
   - Choose a central location
   - Don't move forward/backward between shots
   - Rotate only your body, not your position

2. **Horizontal Rotation**
   - Keep camera level (use horizon as reference)
   - Avoid tilting up or down
   - Complete a full 360° rotation for immersive panoramas

3. **Overlap Between Shots**
   - Ensure 30-40% overlap between adjacent images
   - Example: If your first image shows a building on the right edge, the next image should show that building on the left-center

4. **Camera Settings**
   - Lock exposure (manual mode or AE-L)
   - Lock focus (manual focus or AF-L)
   - Use consistent white balance
   - Avoid using flash

5. **Number of Images**
   - **6-8 images**: Basic 360° panorama (recommended)
   - **10-12 images**: High-quality immersive panorama
   - **15-20 images**: Ultra-detailed panorama for large scenes

6. **Image Quality**
   - Use highest resolution available
   - Avoid digital zoom
   - Clean lens before shooting
   - Shoot in good lighting conditions

### Example Shooting Pattern (8 images for 360°)

```
        N (0°)
         |
    8    |    1
  \      |      /
   \     |     /
    \    |    /
W-------- ⊙ --------E  (Start at 1, rotate clockwise)
    /    |    \
   /     |     \
  /      |      \
    3    |    2
         |
        S (180°)
```

Each image covers ~45° with ~15° overlap.

## Installation

### Backend Dependencies
```bash
cd be
pip install -r requirements.txt
```

Required packages added to `requirements.txt`:
- `opencv-python==4.10.0.84` - Core OpenCV library
- `opencv-contrib-python==4.10.0.84` - SIFT and advanced features
- `numpy==1.26.4` - Numerical operations

### Mobile App
No additional dependencies needed - uses existing Expo ImagePicker.

## Technical Details

### Supported Formats
- **Input**: JPG, PNG (any resolution)
- **Output**: JPG (2:1 aspect ratio, 95% quality)

### Processing Limits
- **Min images**: 2
- **Max images**: 20
- **Max file size per image**: 10MB (configurable)
- **Timeout**: 5 minutes (adjustable in API)

### Projection Modes

1. **Auto Mode** (Default)
   - Automatically detects best projection
   - Uses OpenCV's built-in stitcher first
   - Falls back to custom feature-based stitching
   - Recommended for most use cases

2. **Cylindrical Mode**
   - Best for horizontal panoramas
   - Reduces vertical distortion
   - Suitable for landscapes

3. **Spherical Mode**
   - Best for 360° photo spheres
   - Full spherical mapping
   - Ideal for immersive VR experiences

### Equirectangular Projection
Output panoramas use equirectangular projection with:
- **Aspect Ratio**: 2:1 (width:height)
- **Longitude**: 0° to 360° (horizontal)
- **Latitude**: 0° to 180° (vertical)
- **Coordinate System**: Spherical to Cartesian mapping
- **Interpolation**: Bilinear for smooth results

## Testing

### Test Panorama Stitching
```bash
# 1. Start backend
cd be
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 2. Get JWT token
curl -X POST http://localhost:8000/api/v1/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"government@example.com","password":"password"}'

# 3. Stitch images
curl -X POST http://localhost:8000/api/v1/upload/stitch-panorama \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "files=@test_images/img1.jpg" \
  -F "files=@test_images/img2.jpg" \
  -F "files=@test_images/img3.jpg" \
  -F "mode=auto"
```

### Mobile App Testing
1. Open government panel in mobile app
2. Navigate to any location's edit page
3. Scroll to "360° Panorama" section
4. Tap "Add 360°" button
5. Select "Stitch Multiple Photos"
6. Pick 6-8 overlapping images
7. Confirm stitching
8. Wait for processing (10-60s)
9. Verify success message with dimensions
10. Click "Save" to update location

## Performance Optimization

### Backend Optimizations
- **SIFT vs ORB**: Automatic fallback for speed
- **Match caching**: Descriptors cached during stitching
- **Parallel processing**: Multiple homography estimations
- **Lazy loading**: Images loaded on-demand
- **Memory management**: Temporary files auto-cleaned

### Mobile App Optimizations
- **Image compression**: Automatic before upload
- **Progress indicators**: Real-time feedback
- **Error recovery**: Retry on network failure
- **Batch validation**: Pre-upload checks

## Troubleshooting

### Common Issues

**1. "Stitching failed - images may not overlap sufficiently"**
- **Cause**: Images don't have 30-40% overlap
- **Solution**: Re-capture images with more overlap between shots

**2. "Too many/too few images"**
- **Cause**: Outside 2-20 image range
- **Solution**: Adjust number of selected images

**3. "Processing timeout"**
- **Cause**: High-resolution images or slow server
- **Solution**: Resize images before upload or increase server timeout

**4. "Invalid aspect ratio"**
- **Cause**: Output panorama not 2:1 ratio
- **Solution**: Algorithm auto-corrects, but may indicate stitching issue

**5. Seams visible in panorama**
- **Cause**: Inconsistent lighting or parallax
- **Solution**: Lock exposure, shoot from exact same spot, avoid moving objects

## Future Enhancements

### Planned Features
- [ ] **Real-time progress updates** via WebSockets
- [ ] **Preview mode** before final stitching
- [ ] **Manual seam adjustment** UI
- [ ] **GPU acceleration** for faster processing
- [ ] **Automatic exposure blending** for HDR panoramas
- [ ] **Mobile preview** of 360° viewer
- [ ] **Batch stitching** for multiple panoramas
- [ ] **AI-powered alignment** correction

### Advanced Features
- [ ] **Video panorama stitching** (GoPro 360 style)
- [ ] **Vertical panoramas** (tilt up/down)
- [ ] **Gigapixel stitching** for ultra-high resolution
- [ ] **3D depth mapping** from panoramas
- [ ] **AR overlay** for capture guidance

## References

- OpenCV Stitching Tutorial: https://docs.opencv.org/4.x/d8/d19/tutorial_stitcher.html
- SIFT Algorithm: https://docs.opencv.org/4.x/da/df5/tutorial_py_sift_intro.html
- Equirectangular Projection: https://en.wikipedia.org/wiki/Equirectangular_projection
- Image Stitching Theory: Brown & Lowe (2007) - Automatic Panoramic Image Stitching

## Support

For issues or questions:
1. Check API docs: `http://localhost:8000/docs` (after starting backend)
2. Review backend logs for stitching errors
3. Validate input images meet best practices
4. Test with sample images first

## File Locations

- **Backend Service**: `be/app/services/panorama_service.py`
- **API Endpoint**: `be/app/api/v1/endpoints/upload.py` (line 219+)
- **Mobile UI**: `mobile_app/app/(government)/(stack)/edit-place.tsx`
- **File Service**: `mobile_app/services/file.service.ts`
- **Dependencies**: `be/requirements.txt`

---

**Status**: ✅ Fully Implemented & Ready for Testing
**Last Updated**: December 8, 2025

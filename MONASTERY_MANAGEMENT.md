# Monastery Management System

Complete monastery registration, dashboard, and artifact management system for the Tourist application.

## Features

### 1. **Monastery Registration**
- Dedicated signup flow for monasteries
- Fields include:
  - Monastery name and email
  - Physical address
  - Detailed and short descriptions
  - GPS coordinates (latitude, longitude)
  - Operating hours
  - Password setup

**Route:** `/(auth)/monastery-register`

### 2. **Monastery Dashboard**
- Overview of monastery statistics
- Total artifacts count by category
- Storage usage display
- Verification and approval status
- Quick navigation to other screens

**Route:** `/(monastery)/`

### 3. **Artifact Management**
- Upload individual or bulk artifacts
- Categories: Manuscript, Artifact, Image, Document, Other
- Rich metadata support:
  - Age/Period
  - Material composition
  - Dimensions
  - Historical period
  - Custom tags
- View all artifacts in a list
- Delete artifacts
- Search and filter functionality

**Route:** `/(monastery)/artifacts`

### 4. **Gallery View**
- Grid-based gallery display
- Filter by category
- Search artifacts
- View detailed artifact information with metadata
- Image/document preview

**Route:** `/(monastery)/gallery`

### 5. **Profile & Settings**
- View monastery information
- Edit monastery details
- Logout functionality
- View artifact statistics
- Quick navigation menu

**Route:** `/(monastery)/profile`

## Technical Implementation

### Frontend Structure

```
mobile_app/
├── app/(auth)/
│   ├── monastery-register.tsx      # Monastery signup
│   ├── register.tsx                 # Updated with monastery link
│   └── login.tsx                    # Login (unchanged)
│
├── app/(monastery)/
│   ├── _layout.tsx                  # Tab navigation layout
│   ├── index.tsx                    # Dashboard
│   ├── artifacts.tsx                # Artifact management
│   ├── gallery.tsx                  # Gallery view
│   └── profile.tsx                  # Profile & settings
│
└── services/
    ├── monastery.service.ts         # Monastery API client
    └── file.service.ts              # File upload service
```

### Backend Structure

```
be/app/
├── models/
│   └── monastery_artifact.py        # Artifact models
│
├── services/
│   ├── monastery_service.py         # Monastery registration & details
│   └── monastery_artifact_service.py # Artifact CRUD operations
│
└── api/v1/endpoints/
    └── monastery.py                 # API routes
```

## API Endpoints

### Authentication
- `POST /auth/signup` - User registration
- `POST /auth/signin` - User login

### Monastery Registration
- `POST /monastery/register` - Register new monastery

### Monastery Details
- `GET /monastery/me` - Get monastery details
- `PUT /monastery/me` - Update monastery info

### Artifact Management
- `POST /monastery/artifacts/upload` - Upload single artifact
- `GET /monastery/artifacts` - Get all artifacts (with filtering)
- `GET /monastery/artifacts/{id}` - Get specific artifact
- `PUT /monastery/artifacts/{id}` - Update artifact metadata
- `DELETE /monastery/artifacts/{id}` - Delete artifact
- `POST /monastery/artifacts/bulk-upload` - Bulk upload artifacts
- `GET /monastery/artifacts/stats` - Get artifact statistics

## Usage Guide

### For Monastery Users

#### 1. Registration
1. Open the app and navigate to register
2. Click "Registering a Monastery? Sign Up Here"
3. Fill in all monastery details:
   - Name, email, password
   - Physical address
   - Description and short description
   - GPS coordinates (find on a map app)
   - Operating hours
4. Submit to register

#### 2. Dashboard
1. After login, you'll be taken to the monastery dashboard
2. View your statistics
3. See verification status
4. Navigate to other sections from the dashboard

#### 3. Managing Artifacts
1. Go to "Artifacts" tab
2. Click the + button to add new artifact
3. Select or upload a file
4. Fill in artifact details:
   - Name and description
   - Category
   - Optional metadata (age, material, etc.)
   - Tags
5. Submit to upload

#### 4. Gallery
1. Go to "Gallery" tab
2. View all artifacts in grid format
3. Filter by category or search by name
4. Click any artifact to view full details
5. Swipe down to close detail view

#### 5. Profile
1. Go to "Profile" tab
2. View monastery information
3. Click "Edit" to update details
4. View statistics
5. Use quick action buttons to navigate
6. Logout when needed

## Data Models

### Monastery User
```typescript
{
    id: string;
    name: string;
    email: string;
    role: "business";
    address: string;
    approved: boolean;
}
```

### Monastery Artifact
```typescript
{
    id: string;
    monastery_id: string;
    name: string;
    description: string;
    category: "manuscript" | "artifact" | "image" | "document" | "other";
    file_id: string;
    file_url: string;
    thumbnail_url?: string;
    metadata?: {
        age?: string;
        material?: string;
        dimensions?: string;
        historical_period?: string;
    };
    tags?: string[];
    created_at: string;
    updated_at: string;
}
```

## Storage & File Management

- Maximum file size: Configurable in upload config
- Supported formats:
  - Images: JPG, PNG, GIF, WebP
  - Documents: PDF, TXT, DOC, DOCX
  - Archives: ZIP
- Storage quota: 5GB per monastery (configurable)
- Files are stored with unique IDs in the file service

## Authentication & Authorization

- JWT-based authentication (7-day expiry)
- Monastery users have role: `business`
- User-business relationship stored in `user_business` collection
- Artifact access restricted to monastery owner only
- Admin can access all monasteries

## Installation & Setup

### Backend Requirements
```
- Python 3.8+
- FastAPI
- MongoDB
- Async drivers (motor)
```

### Frontend Requirements
```
- React Native / Expo
- TypeScript
- React Navigation
- React Native Toast Message
- Document Picker (for file uploads)
```

### Running the Backend
```bash
cd be
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

### Running the Mobile App
```bash
cd mobile_app
npm install
npx expo start
```

## Environment Variables

### Backend (.env)
```
MONGODB_URL=mongodb://...
JWT_SECRET=your_secret_key
MAX_FILE_SIZE=52428800  # 50MB
MONASTERY_TYPE_ID=69367fbfbde0a7ba5f19846f
```

### Frontend (.env)
```
API_URL=http://localhost:8000
```

## Future Enhancements

- [ ] Image optimization and compression
- [ ] Artifact categorization and tagging improvements
- [ ] Batch operations (delete multiple, download as zip)
- [ ] Share artifacts publicly
- [ ] Advanced search and filtering
- [ ] Artifact versioning/history
- [ ] Role-based access (collaborators, viewers)
- [ ] Analytics dashboard
- [ ] Integration with heritage preservation services
- [ ] 3D artifact preview
- [ ] AR visualization
- [ ] Backup and restore functionality

## Troubleshooting

### Common Issues

**Registration fails with "Email already registered"**
- The email is already in use
- Use a different email address

**Artifacts not loading**
- Check internet connection
- Verify token is still valid
- Refresh the app

**File upload fails**
- Check file size (shouldn't exceed limit)
- Verify file format is supported
- Check storage quota

**API 404 errors**
- Ensure monastery is registered
- Check API endpoint URLs
- Verify authentication token

## Support

For issues or feature requests, contact the development team or submit an issue in the repository.

---

**Version:** 1.0.0  
**Last Updated:** December 2025

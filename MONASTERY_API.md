# Monastery Management API Documentation

## Base URL
```
http://localhost:8000/v1
```

## Authentication
All endpoints except registration and login require JWT token in header:
```
Authorization: Bearer <token>
```

---

## 📋 Endpoints Overview

### Authentication (Already Existing)
- `POST /auth/signup` - Register regular user
- `POST /auth/signin` - Login user

### Monastery Management

#### Registration
```
POST /monastery/register
```

**Request Body**:
```json
{
    "name": "Ancient Temple Monastery",
    "email": "monastery@example.com",
    "password": "SecurePassword123",
    "address": "Himalayan Mountain Region",
    "description": "A sacred monastery with ancient artifacts and manuscripts",
    "short_description": "Historic mountain monastery",
    "position": {
        "x": 88.5060,
        "y": 27.1751
    },
    "open_hours_start": "06:00",
    "open_hours_end": "18:00",
    "scheduled_at": "2025-12-08T10:00:00Z",
    "metadata": {
        "monastery_type": "cultural_heritage",
        "verified": false
    }
}
```

**Response** (201 Created):
```json
{
    "success": true,
    "data": {
        "user": {
            "id": "507f1f77bcf86cd799439011",
            "name": "Ancient Temple Monastery",
            "email": "monastery@example.com",
            "address": "Himalayan Mountain Region",
            "role": "business",
            "approved": true,
            "created_at": "2025-12-08T10:00:00Z"
        },
        "location": {
            "id": "507f1f77bcf86cd799439012",
            "name": "Ancient Temple Monastery",
            "description": "A sacred monastery...",
            "position": {
                "x": 88.5060,
                "y": 27.1751
            },
            "type": "monastery"
        },
        "business": {
            "id": "507f1f77bcf86cd799439013",
            "name": "Ancient Temple Monastery",
            "type_id": "69367fbfbde0a7ba5f19846f",
            "open_hours": {
                "start": "06:00",
                "end": "18:00"
            },
            "approved": false,
            "created_at": "2025-12-08T10:00:00Z"
        },
        "message": "Monastery registered successfully"
    }
}
```

#### Get Monastery Details
```
GET /monastery/me
```

**Headers**:
```
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
    "success": true,
    "data": {
        "id": "507f1f77bcf86cd799439013",
        "user_id": "507f1f77bcf86cd799439011",
        "name": "Ancient Temple Monastery",
        "email": "monastery@example.com",
        "address": "Himalayan Mountain Region",
        "description": "A sacred monastery with ancient artifacts and manuscripts",
        "short_description": "Historic mountain monastery",
        "position": {
            "x": 88.5060,
            "y": 27.1751
        },
        "open_hours": {
            "start": "06:00",
            "end": "18:00"
        },
        "verified": true,
        "approved": false,
        "artifacts_count": 5,
        "created_at": "2025-12-08T10:00:00Z",
        "updated_at": "2025-12-08T10:00:00Z"
    }
}
```

#### Update Monastery
```
PUT /monastery/me
```

**Headers**:
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body** (any of these fields):
```json
{
    "name": "Updated Monastery Name",
    "description": "Updated description",
    "short_description": "Updated short desc",
    "address": "New address"
}
```

**Response** (200 OK): Returns updated monastery object (same as GET /monastery/me)

---

### Artifact Management

#### Upload Single Artifact
```
POST /monastery/artifacts/upload
```

**Headers**:
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data**:
```
file: <file_object>                      (required)
category: "manuscript"                   (required: manuscript|artifact|image|document|other)
name: "Ancient Buddhist Text"            (optional)
description: "Description here"          (optional)
age: "500 years old"                     (optional)
material: "Paper"                        (optional)
dimensions: "30cm x 20cm"                (optional)
historical_period: "Medieval Period"     (optional)
tags: "religious,ancient,rare"           (optional, comma-separated)
```

**Response** (201 Created):
```json
{
    "success": true,
    "data": {
        "id": "507f1f77bcf86cd799439014",
        "monastery_id": "507f1f77bcf86cd799439013",
        "name": "Ancient Buddhist Text",
        "description": "Description here",
        "category": "manuscript",
        "file_id": "507f1f77bcf86cd799439015",
        "file_url": "/artifacts/507f1f77bcf86cd799439015/file.pdf",
        "metadata": {
            "age": "500 years old",
            "material": "Paper",
            "dimensions": "30cm x 20cm",
            "historical_period": "Medieval Period"
        },
        "tags": ["religious", "ancient", "rare"],
        "created_at": "2025-12-08T10:15:00Z",
        "updated_at": "2025-12-08T10:15:00Z"
    }
}
```

#### Bulk Upload Artifacts
```
POST /monastery/artifacts/bulk-upload
```

**Headers**:
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data**:
```
files: <file1>, <file2>, <file3>        (multiple files)
categories[0]: "manuscript"
categories[1]: "image"
categories[2]: "document"
metadata[0]: {"age": "500 years"}
metadata[1]: {"material": "Stone"}
metadata[2]: {}
```

**Response** (201 Created): Array of artifact objects

#### Get All Artifacts
```
GET /monastery/artifacts
```

**Headers**:
```
Authorization: Bearer <token>
```

**Query Parameters**:
```
category=manuscript              (optional)
skip=0                          (optional, default 0)
limit=100                       (optional, default 100)
search=ancient                  (optional, searches name and description)
```

**Example**:
```
GET /monastery/artifacts?category=manuscript&skip=0&limit=10&search=buddhist
```

**Response** (200 OK):
```json
{
    "success": true,
    "data": {
        "artifacts": [
            {
                "id": "507f1f77bcf86cd799439014",
                "monastery_id": "507f1f77bcf86cd799439013",
                "name": "Ancient Buddhist Text",
                "description": "Description here",
                "category": "manuscript",
                "file_id": "507f1f77bcf86cd799439015",
                "file_url": "/artifacts/507f1f77bcf86cd799439015/file.pdf",
                "metadata": { ... },
                "tags": ["religious", "ancient", "rare"],
                "created_at": "2025-12-08T10:15:00Z",
                "updated_at": "2025-12-08T10:15:00Z"
            }
        ],
        "total": 1
    }
}
```

#### Get Single Artifact
```
GET /monastery/artifacts/{artifact_id}
```

**Headers**:
```
Authorization: Bearer <token>
```

**Path Parameters**:
```
artifact_id: "507f1f77bcf86cd799439014"
```

**Response** (200 OK): Single artifact object

**Error Responses**:
```json
{
    "success": false,
    "error": "Artifact not found"
}  // 404 Not Found
```

#### Update Artifact Metadata
```
PUT /monastery/artifacts/{artifact_id}
```

**Headers**:
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body** (any of these fields):
```json
{
    "name": "Updated Name",
    "description": "Updated description",
    "metadata": {
        "age": "600 years old",
        "material": "Papyrus",
        "dimensions": "35cm x 25cm"
    },
    "tags": ["religious", "manuscript", "important"]
}
```

**Response** (200 OK): Updated artifact object

#### Delete Artifact
```
DELETE /monastery/artifacts/{artifact_id}
```

**Headers**:
```
Authorization: Bearer <token>
```

**Response** (204 No Content): Empty response

**Error Responses**:
```json
{
    "success": false,
    "error": "Artifact not found"
}  // 404 Not Found
```

#### Get Artifact Statistics
```
GET /monastery/artifacts/stats
```

**Headers**:
```
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
    "success": true,
    "data": {
        "total": 42,
        "by_category": {
            "manuscript": 15,
            "artifact": 12,
            "image": 10,
            "document": 5,
            "other": 0
        },
        "storage_used": 1073741824,
        "storage_limit": 5368709120
    }
}
```

---

## 🔐 Error Handling

### Common Error Responses

#### 400 Bad Request
```json
{
    "success": false,
    "error": "Email already registered"
}
```

#### 401 Unauthorized
```json
{
    "success": false,
    "error": "Invalid or expired token"
}
```

#### 404 Not Found
```json
{
    "success": false,
    "error": "Artifact not found"
}
```

#### 413 Payload Too Large
```json
{
    "success": false,
    "error": "File size exceeds the maximum limit of 50MB"
}
```

#### 422 Unprocessable Entity
```json
{
    "success": false,
    "error": "Invalid request data",
    "details": {
        "field": "name",
        "message": "Field required"
    }
}
```

#### 500 Internal Server Error
```json
{
    "success": false,
    "error": "Error uploading artifact: <error details>"
}
```

---

## 📊 Data Validation Rules

### Monastery Registration
- **name**: 1-255 characters, required
- **email**: Valid email format, required
- **password**: Minimum 8 characters, required
- **address**: Non-empty string, required
- **description**: Non-empty string, required
- **short_description**: 1-255 characters, required
- **position.x** (longitude): -180 to 180, required
- **position.y** (latitude): -90 to 90, required
- **open_hours_start**: HH:MM format (24-hour), required
- **open_hours_end**: HH:MM format (24-hour), required

### Artifact Upload
- **file**: Max 50MB, required
- **category**: One of (manuscript, artifact, image, document, other), required
- **name**: Max 255 characters, optional
- **description**: Optional
- **metadata**: Object with optional fields:
  - age: string
  - material: string
  - dimensions: string
  - historical_period: string
- **tags**: Array of strings or comma-separated, optional

---

## 📍 Rate Limiting

Currently no rate limiting implemented. Should be added before production:
```
- 1000 requests per hour per IP
- 10 MB/s upload speed limit
- 10 concurrent uploads per user
```

---

## 🔄 Pagination

List endpoints support pagination via query parameters:
```
skip=0      // Number of items to skip
limit=100   // Number of items to return (max 1000)
```

**Recommended pagination** for large datasets:
- Limit: 20-50 items per page
- Total count provided in response

---

## 📦 Response Format

All responses follow standard format:

**Success**:
```json
{
    "success": true,
    "data": { ... }
}
```

**Error**:
```json
{
    "success": false,
    "error": "Error message here"
}
```

---

## 🔐 Security Notes

1. **JWT Token**: 7-day expiration, refresh via login
2. **File Validation**: Type and size checked server-side
3. **Ownership Verification**: All operations verified by user ID
4. **Database**: MongoDB with proper indexing
5. **CORS**: Configure for production URLs
6. **HTTPS**: Required in production

---

## 🚀 Usage Examples

### cURL Examples

**Register Monastery**:
```bash
curl -X POST http://localhost:8000/v1/monastery/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ancient Monastery",
    "email": "monastery@example.com",
    "password": "SecurePassword123",
    "address": "Mountain Region",
    "description": "Historic monastery",
    "short_description": "Historic monastery",
    "position": {"x": 88.5060, "y": 27.1751},
    "open_hours_start": "06:00",
    "open_hours_end": "18:00",
    "scheduled_at": "2025-12-08T10:00:00Z"
  }'
```

**Upload Artifact**:
```bash
curl -X POST http://localhost:8000/v1/monastery/artifacts/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@manuscript.pdf" \
  -F "category=manuscript" \
  -F "name=Ancient Text" \
  -F "description=Historic manuscript"
```

**Get Statistics**:
```bash
curl -X GET http://localhost:8000/v1/monastery/artifacts/stats \
  -H "Authorization: Bearer <token>"
```

---

## 📚 Additional Resources

- Authentication: See `/auth` documentation
- File Upload: See `/upload` documentation
- User Management: See `/users` documentation

---

**API Version**: 1.0.0
**Last Updated**: December 2025
**Status**: Production Ready ✅

# SIH25061 - Smart India Hackathon 2025

<div align="center">

# 🏔️ Digitize and Showcase Monasteries of Sikkim for Tourism and Cultural Preservation

![Sikkim Tourism](https://img.shields.io/badge/Smart%20India%20Hackathon-2025-orange?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Active-success?style=for-the-badge)
![Platform](https://img.shields.io/badge/Platform-Mobile-blue?style=for-the-badge)

**A comprehensive tourism platform for Sikkim featuring AI-powered trip planning, immersive 360° experiences, multi-lingual support, and real-time community features.**

[Features](#-key-features) • [Tech Stack](#-tech-stack) • [Setup](#-setup-instructions) • [API Documentation](#-api-documentation) • [Contributing](#-contributing)

</div>

---

## 🌟 About The Project

**Sikkim Tourism** is an innovative digital platform developed for Smart India Hackathon 2025, designed to revolutionize the tourism experience in Sikkim. Our solution combines cutting-edge technology with user-centric design to provide tourists with:

- 🤖 **AI-Powered Trip Planning** - Personalized itineraries using Google Gemini AI
- 🌍 **360° Immersive Experiences** - Virtual tours with spatial audio and TTS
- 🗣️ **Multi-Lingual Support** - 6 languages (English, Hindi, Tamil, Telugu, Assamese, Sikkimese)
- 🏪 **Business Integration** - Seamless booking and service discovery
- 👥 **Social Features** - Real-time location sharing, group planning, and community chat
- 📱 **Cross-Platform** - Native mobile experience with React Native & Expo
- 🎯 **Role-Based Access** - User, Business, and Admin portals

---

## 🎯 Key Features

### For Tourists
- **AI Travel Planner**: Conversational AI assistant for personalized trip recommendations
- **Interactive Maps**: Real-time location tracking and nearby attractions
- **360° Virtual Tours**: Immersive panoramic views of destinations
- **Service Bookings**: Hotels, transport, adventure activities, food, and shopping
- **Social Connectivity**: Find and share experiences with friends
- **Multi-Lingual Interface**: Accessible in 6 regional languages
- **Offline Support**: Save places and itineraries for offline access

### For Businesses
- **Business Dashboard**: Track bookings, revenue, and customer requests
- **Service Management**: Add and manage offerings (places, events, services)
- **Analytics**: Real-time insights on business performance
- **Booking System**: Integrated reservation management
- **Profile Management**: Showcase business with rich media

### For Administrators
- **User Management**: Approve and manage users, businesses, and content
- **Content Moderation**: Review and approve listings
- **Analytics Dashboard**: Platform-wide statistics and insights
- **Role Management**: Assign and manage user permissions
- **System Settings**: Configure platform parameters

---

## 🛠️ Tech Stack

### Frontend (Mobile App)
```
React Native (0.81.5)         - Core framework
Expo (54.0.25)                - Development platform
TypeScript                    - Type safety
React Navigation 7.x          - Navigation
Expo Router 6.x               - File-based routing
Axios                         - API client
React Hook Form + Zod         - Form validation
Expo Three + GL               - 3D rendering
React Native Maps             - Location services
Expo Speech                   - Text-to-speech
Expo Audio/AV                 - Media playback
React Native Reanimated       - Animations
```

### Backend (API)
```
Python 3.10+                  - Runtime
FastAPI 0.121.3               - Web framework
MongoDB 4.15+                 - Database
Motor 3.7.1                   - Async MongoDB driver
Pydantic 2.12                 - Data validation
JWT (python-jose)             - Authentication
Bcrypt                        - Password hashing
Google Generative AI          - AI integration
Pillow + MoviePy              - Media processing
Uvicorn                       - ASGI server
```

### AI & External Services
```
Google Gemini AI              - Trip planning & recommendations
MongoDB Atlas                 - Cloud database
CDN Integration               - Media delivery
```

---

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **Python** (v3.10 or higher) - [Download](https://python.org/)
- **MongoDB** (v4.15 or higher) - [Download](https://mongodb.com/try/download/community)
- **Expo CLI** - Install via npm: `npm install -g expo-cli`
- **Git** - [Download](https://git-scm.com/)
- **Android Studio** (for Android development) or **Xcode** (for iOS development)

---

## 🚀 Setup Instructions

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/Meheer17/Sikkim-Tourism.git
cd Sikkim-Tourism
```

### 2️⃣ Backend Setup

#### Install Python Dependencies

```bash
cd be
pip install -r requirements.txt
```

#### Configure Environment Variables

Create a `.env` file in the `be` directory:

```env
# Project
PROJECT_NAME="MONA 360"
VERSION="1.0.0"
DESCRIPTION="Travel planning API for Sikkim Tourism"

# MongoDB
MONGODB_URL=
MONGODB_DB_NAME=mona360

# JWT
SECRET_KEY=ThisIsASecretKeyForJWTTokenGeneration242343NEEAARAAA
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440


# CORS (comma-separated or JSON array)
ALLOWED_ORIGINS=["*"]
GEMINI_API_KEY=
```

#### Configure Environment Variables

Create a `.env` file in the `mobile_app` directory:

```env
NODE_ENV=development

# API Configuration
# Your machine's local IP for physical devices: 192.168.0.104
# Android Emulator auto-uses: 10.0.2.2
# iOS Simulator auto-uses: localhost
# Uncomment below to override auto-detection:
API_BASE_URL=http://192.168.0.104:8000/api/v1
API_TIMEOUT=30000

# Authentication
JWT_SECRET_KEY=your-jwt-secret-key
REFRESH_TOKEN_EXPIRY=7d
ACCESS_TOKEN_EXPIRY=15m

# File Upload
MAX_FILE_SIZE=10485760
ALLOWED_IMAGE_FORMATS=jpg,jpeg,png,gif,webp
ALLOWED_DOCUMENT_FORMATS=pdf,doc,docx,txt

# Features
ENABLE_BIOMETRIC_AUTH=true
ENABLE_PUSH_NOTIFICATIONS=true

# Debug
DEBUG_API_LOGS=true
```


#### Start the Backend Server

```bash
# Development mode with auto-reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Production mode
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

The API will be available at `http://localhost:8000`
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### 3️⃣ Frontend Setup

#### Install Node Dependencies

```bash
cd mobile_app
npm install
```

#### Configure API Endpoint

Edit `mobile_app/config/api.config.ts`:

```typescript
export const API_CONFIG = {
  BASE_URL: 'http://localhost:8000', // Your backend URL
  TIMEOUT: 30000,
  ENABLE_LOGGING: true,
};
```

#### Start the Mobile App

```bash
# Start Expo development server
npx expo start -c

# Run on specific platform
npx expo start --android   # Android
npx expo start --ios       # iOS
npx expo start --web       # Web
```

#### Development Options

After starting Expo:
- Scan QR code with Expo Go app (on physical device)
- Press `a` - Open in Android emulator
- Press `i` - Open in iOS simulator

---

## 📱 Mobile App Structure

```
mobile_app/
├── app/                         # Expo Router screens
│   ├── (admin)/                 # Admin portal screens
│   │   ├── dashboard.tsx        # Admin dashboard
│   │   ├── users.tsx            # User management
│   │   ├── businesses.tsx       # Business approvals
│   │   └── places.tsx           # Place management
│   ├── (auth)/                  # Authentication screens
│   │   ├── login.tsx            # Login with language selector
│   │   └── register.tsx         # User registration
│   ├── (business)/              # Business portal screens
│   │   ├── dashboard.tsx        # Business dashboard
│   │   ├── services.tsx         # Service management
│   │   ├── bookings.tsx         # Booking management
│   │   └── profile.tsx          # Business profile
│   └── (user)/                  # User portal screens
│       ├── home.tsx             # Explore destinations
│       ├── explore.tsx          # Search & discover
│       ├── services.tsx         # Browse services
│       ├── my-bookings.tsx      # User bookings
│       ├── profile.tsx          # User profile
│       ├── community-chat.tsx   # Community features
│       └── (stack)/             # Stack navigation screens
│           ├── ai-planner.tsx   # AI trip planning
│           ├── place-details.tsx# Place information
│           ├── friends.tsx      # Location sharing
│           └── language.tsx     # Language settings
├── components/                  # Reusable components
│   ├── auth/                    # Auth components
│   ├── bookings/                # Booking components
│   ├── common/                  # Shared components
│   ├── explore/                 # Exploration components
│   ├── immersive/               # 360° viewer components
│   ├── profile/                 # Profile components
│   └── ui/                      # UI primitives
├── contexts/                    # React contexts
│   ├── ThemeContext.tsx         # Dark/Light theme
│   └── LanguageContext.tsx      # Multi-lingual support
├── services/                    # API service layer
│   ├── api.client.ts            # Axios instance
│   ├── auth.service.ts          # Authentication
│   ├── business.service.ts      # Business operations
│   ├── location.service.ts      # Location services
│   ├── message.service.ts       # Messaging
│   └── user.service.ts          # User operations
├── constants/                   # App constants
│   ├── languages.ts             # Supported languages
│   ├── translations.ts          # Translation strings
│   └── theme.ts                 # Theme configuration
└── hooks/                       # Custom React hooks
    ├── useAuth.ts               # Authentication hook
    ├── useApi.ts                # API request hook
    └── useThemeColor.ts         # Theme color hook
```

---

## 🔧 Backend API Structure

```
be/
├── app/
│   ├── main.py                  # FastAPI application entry
│   ├── api/v1/                  # API routes
│   │   ├── auth.py              # Authentication endpoints
│   │   ├── users.py             # User management
│   │   ├── locations.py         # Location endpoints
│   │   ├── businesses.py        # Business endpoints
│   │   ├── services.py          # Service endpoints
│   │   ├── messages.py          # Messaging endpoints
│   │   ├── communities.py       # Community features
│   │   └── files.py             # File upload/CDN
│   ├── core/
│   │   ├── config.py            # App configuration
│   │   ├── database.py          # MongoDB connection
│   │   └── security.py          # JWT & password hashing
│   ├── models/                  # Pydantic models
│   │   ├── user.py              # User model
│   │   ├── business.py          # Business model
│   │   ├── location.py          # Location model
│   │   ├── service.py           # Service model
│   │   ├── message.py           # Message model
│   │   └── community.py         # Community model
│   ├── schemas/                 # Request/Response schemas
│   ├── services/                # Business logic
│   │   ├── auth_service.py      # Auth operations
│   │   ├── user_service.py      # User operations
│   │   ├── business_service.py  # Business operations
│   │   └── ai_service.py        # AI integration
│   ├── middleware/
│   │   ├── error_handlers.py    # Error handling
│   │   └── logging.py           # Request logging
│   └── utils/
│       └── logging.py           # Logging utilities
├── requirements.txt             # Python dependencies
├── api_doc.md                   # API documentation
└── README.md                    # Backend readme
```

---

## 📚 API Documentation

### Authentication Endpoints

#### Sign Up
```http
POST /api/v1/auth/signup
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123",
  "address": "Gangtok, Sikkim",
  "gender": "male"
}
```

#### Sign In
```http
POST /api/v1/auth/signin
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

### Protected Endpoints

All protected endpoints require JWT authentication:

```http
Authorization: Bearer <your-jwt-token>
```

### Key Endpoints

- **Locations**: `/api/v1/locations` - CRUD operations for tourist places
- **Businesses**: `/api/v1/businesses` - Business listings and management
- **Services**: `/api/v1/services` - Service offerings (hotels, transport, etc.)
- **Bookings**: `/api/v1/bookings` - Booking management
- **Communities**: `/api/v1/communities` - Community groups and chat
- **Messages**: `/api/v1/messages` - Real-time messaging
- **Files**: `/api/v1/upload/{type}` - File upload (images, videos, 3D models, audio)
- **AI Planner**: `/api/v1/ai/plan-trip` - AI-powered trip planning

For complete API documentation, visit `http://localhost:8000/docs` after starting the backend.

---

## 🌍 Multi-Lingual Support

The app supports **6 languages**:

| Language | Code | Native Name |
|----------|------|-------------|
| English | en | English |
| Hindi | hi | हिंदी |
| Tamil | ta | தமிழ் |
| Telugu | te | తెలుగు |
| Assamese | as | অসমীয়া |
| Sikkimese | si | Sikkim |

### How It Works

1. **Language Selection**: Users can select their preferred language from the login screen
2. **Context-Based**: Uses React Context (`LanguageContext`) for global state
3. **Translation Keys**: All UI strings use translation keys with fallback to English
4. **Persistent**: Language preference stored in SecureStore

### Adding New Languages

1. Add language to `mobile_app/constants/languages.ts`
2. Add translations to `mobile_app/constants/translations.ts`
3. Run translation check: `node mobile_app/scripts/check-translations.js`

---

## 🎨 Features Deep Dive

### 1. AI Travel Planner

Powered by Google Gemini AI, provides:
- Personalized itinerary generation
- Budget-aware recommendations
- Activity preferences matching
- Weather-based suggestions
- Real-time conversation interface

### 2. 360° Immersive Experience

- Panoramic views of destinations
- Spatial audio integration
- Text-to-speech narration in multiple languages
- Interactive hotspots
- VR-ready rendering with Three.js

### 3. Real-Time Location Sharing

- Live friend location tracking on map
- Create and join travel groups
- Share location with group code
- Privacy controls
- Nearby friend notifications

### 4. Booking System

- Multi-category bookings (hotels, transport, activities)
- Real-time availability
- Payment integration ready
- Booking history and management
- Cancellation and refund handling

### 5. Business Portal

- Comprehensive dashboard
- Service and place management
- Customer request handling
- Revenue analytics
- Review management

---

## 🔐 Security Features

- **JWT Authentication**: Secure token-based auth (7-day expiry)
- **Password Hashing**: Bcrypt with salt rounds
- **Role-Based Access Control**: User, Business, Admin roles
- **Input Validation**: Pydantic schemas for all inputs
- **Rate Limiting**: API rate limiting for abuse prevention
- **Secure Storage**: SecureStore for sensitive data on mobile
- **HTTPS Ready**: Production-ready SSL/TLS configuration

---

## 🧪 Testing

### Backend Tests

```bash
cd be
pytest tests/ -v
```

### Frontend Tests

```bash
cd mobile_app
npm test
```

---

## 📦 Deployment

### Backend Deployment (Production)

1. **Setup MongoDB Atlas**
   - Create cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Update `MONGODB_URL` in environment variables

2. **Deploy to Cloud**
   ```bash
   # Example: Deploy to Railway/Render/Heroku
   # Set environment variables
   # Start with: uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```

3. **Environment Variables**
   - Set all `.env` variables in production
   - Use secure `SECRET_KEY`
   - Disable `DEBUG` mode

### Mobile App Deployment

#### Build for Android
```bash
cd mobile_app
eas build --platform android
```

#### Build for iOS
```bash
cd mobile_app
eas build --platform ios
```

#### Update Over-The-Air (OTA)
```bash
eas update --branch production
```

## 👥 Team

**Team Name**: Promatrs
- **Team Lead**: Meheer J
- **Team Member 1**: Nandakishore P
- **Team Member 2**: Shrishesha Narmatesshvara
- **Team Member 3**: Rishitha B
- **Team Member 4**: Tanveer Muhammed S
- **Team Member 5**: Shaik Mahummad 

---

## 📧 Contact & Support

- **GitHub**: [github.com/Meheer17/Sikkim-Tourism](https://github.com/Meheer17/Sikkim-Tourism)
- **Issues**: [Report Bug/Request Feature](https://github.com/Meheer17/Sikkim-Tourism/issues)
<!-- - **Email**: [your-email@example.com] -->

---

## 🙏 Acknowledgments

- **Smart India Hackathon 2025** - For the opportunity
- **Google Gemini AI** - AI capabilities
- **Expo Team** - Amazing development platform
- **FastAPI** - Modern Python web framework
- **MongoDB** - Flexible database solution

---

## 🗺️ Roadmap

- [ ] Payment gateway integration
- [ ] Advanced analytics dashboard
- [ ] Push notifications
- [ ] Offline mode enhancement
- [ ] AR features for navigation
- [ ] Voice-based search
- [ ] Social media integration
- [ ] Review and rating system
- [ ] Emergency contact features
- [ ] Weather API integration

---

<div align="center">

**Promatrs | Smart India Hackathon 2025**

⭐ Star this repository if you find it helpful!

</div>

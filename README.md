
<div align="center">

# SIH25061 - Smart India Hackathon 2025
# 🏔️ Digitize and Showcase Monasteries of Sikkim for Tourism and Cultural Preservation

![Sikkim Tourism](https://img.shields.io/badge/Smart%20India%20Hackathon-2025-orange?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Active-success?style=for-the-badge)
![Platform](https://img.shields.io/badge/Platform-Mobile-blue?style=for-the-badge)

**A comprehensive tourism platform for Sikkim featuring AI-powered trip planning, immersive 360° experiences, multi-lingual support, and real-time community features.**

[Features](#-key-features) • [Tech Stack](#-tech-stack) • [Setup](#-setup-instructions) • [API Documentation](#-api-documentation) • [Contributing](#-contributing)

</div>

---

## **Completion Status: 66%**

## ✅ **Completed Features (14/21)**

- ✅ 360° panoramic views
- ✅ Multi-language narrated walkthroughs (6 languages with TTS)
- ✅ Geo-tagged monastery locations
- ✅ Document upload system (images, videos, audio)
- ✅ Events & festivals scheduling system
- ✅ AI trip planner
- ✅ Complete 6-language translation system
- ✅ Real-time location sharing & group planning
- ✅ Business portal for monasteries
- ✅ Admin panel for content moderation
- ✅ Media compression for optimized delivery
- ✅ Location-based audio guides (GPS)
- ✅ Tourism analytics dashboard
- ✅ Community chat & messaging
- ✅ Booking system for events
- ✅ Local transport integration
- ✅ Calendar View for Events

## 📝 **To-Do Features (8/21)**

- ⬜ Travel routes & nearby attractions on map
- ⬜ Document View for Scanned manuscripts, murals, and historical documents.
- ⬜ Offline mode for remote areas
- ⬜ Participatory archiving (user contributions)


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
# Android Emulator auto-uses: 172.17.124.111
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

## 🎨 Features

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

### 6. Security

- **JWT Authentication**: Secure token-based auth (7-day expiry)
- **Password Hashing**: Bcrypt with salt rounds
- **Role-Based Access Control**: User, Business, Admin roles
- **Input Validation**: Pydantic schemas for all inputs
- **Rate Limiting**: API rate limiting for abuse prevention
- **Secure Storage**: SecureStore for sensitive data on mobile
- **HTTPS Ready**: Production-ready SSL/TLS configuration

---

## 👥 Team

**Team Name**: Promatrs
- **Team Lead**: Meheer J
- **Team Member 1**: Nandakishore P
- **Team Member 2**: Shrishesha Narmatesshvara
- **Team Member 3**: Rishitha B
- **Team Member 4**: Tanveer Muhammed S
- **Team Member 5**: Shaik Mahummad 

<!-- ---

## 📧 Contact & Support

- **GitHub**: [github.com/Meheer17/Sikkim-Tourism](https://github.com/Meheer17/Sikkim-Tourism)
- **Issues**: [Report Bug/Request Feature](https://github.com/Meheer17/Sikkim-Tourism/issues) -->
<!-- - **Email**: [your-email@example.com] -->

<!-- ---

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
- [ ] Weather API integration -->

---

<div align="center">

**Promatrs | Smart India Hackathon 2025**

⭐ Star this repository if you find it helpful!

</div>

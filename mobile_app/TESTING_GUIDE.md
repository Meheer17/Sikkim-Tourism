# Tourist Mobile App - Testing Guide

## 🚀 Quick Start

This app has been set up with complete authentication infrastructure and **role-based routing** with sample pages for testing.

### Running the App

```bash
cd /Users/meheer/Github/octonauts/Tourist/mobile_app
npx expo start
```

Then press:
- `i` for iOS simulator
- `a` for Android emulator
- `w` for web browser

## 📱 App Architecture

### Role-Based Navigation
The app automatically routes users to their role-specific section after login:
- **Admin** → `(admin)` - Dashboard, Users, Settings
- **Business** → `(business)` - Business Home, Products, Analytics
- **Organizer** → `(organizer)` - Events, Attendees, Venues  
- **User** → `(user)` - Home, Explore, Profile

### Authentication System
- ✅ JWT Token Management (Access & Refresh tokens)
- ✅ Secure Storage (iOS Keychain / Android EncryptedSharedPreferences)
- ✅ Automatic Token Refresh on 401 errors
- ✅ Password Validation (8+ chars, uppercase, lowercase, number, special char)
- ✅ Protected Routes with Role-Based Access

## 📂 App Structure

```
app/
├── index.tsx              # Root - redirects based on auth & role
├── _layout.tsx            # Root layout with Toast
├── (auth)/
│   ├── _layout.tsx        # Auth stack layout
│   ├── login.tsx          # Login with Mock Login button
│   └── register.tsx       # Registration page
├── (admin)/
│   ├── _layout.tsx        # Admin tabs
│   ├── index.tsx          # Admin Dashboard
│   ├── users.tsx          # User Management
│   ├── settings.tsx       # System Settings
│   └── profile.tsx        # Admin Profile
├── (business)/
│   ├── _layout.tsx        # Business tabs
│   ├── index.tsx          # Business Home
│   ├── products.tsx       # Products & Services
│   ├── analytics.tsx      # Business Analytics
│   └── profile.tsx        # Business Profile
├── (organizer)/
│   ├── _layout.tsx        # Organizer tabs
│   ├── index.tsx          # Events Management
│   ├── attendees.tsx      # Attendee Management
│   ├── venues.tsx         # Venue Management
│   └── profile.tsx        # Organizer Profile
└── (user)/
    ├── _layout.tsx        # User tabs
    ├── index.tsx          # User Home
    ├── explore.tsx        # Explore Content
    └── profile.tsx        # User Profile
```

## 🔓 Mock Login Feature

Since you don't have a backend yet, use the **Mock Login** button on the login screen.

### How to Use Mock Login:

1. Start the app
2. You'll see the Login screen
3. Tap the **"🔓 Mock Login (Debug)"** button (orange button)
4. Choose a role:
   - **Admin** - Full system access with dashboard, user management, settings
   - **User** - Standard user with home, explore, profile
   - **Organizer** - Event management with attendees, venues
   - **Business** - Business tools with products, analytics
5. The app will create mock tokens and user data
6. You'll be automatically routed to your role-specific section

### Mock User Data Created:
```javascript
{
  id: 'mock-user-123',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  phone: '+1234567890',
  role: [selected role],
  isEmailVerified: true,
  isPhoneVerified: true
}
```

## 🔐 Authentication Flow

### Login Process:
1. User enters credentials (or uses Mock Login)
2. Password validated (strength check)
3. API call to `/auth/login`
4. Tokens saved to secure storage
5. User data saved
6. **Redirect to role-specific section**

### Role-Based Routing:
```typescript
if (user.role === 'admin') → /(admin)
if (user.role === 'business') → /(business)
if (user.role === 'organizer') → /(organizer)
if (user.role === 'user') → /(user)
```

### Token Refresh Flow:
1. API request returns 401 (Unauthorized)
2. System automatically calls `/auth/refresh` with refresh token
3. New tokens received and saved
4. Original request retried with new access token
5. If refresh fails: logout user

### Logout Process:
1. Call `/auth/logout` API
2. Clear user data from storage
3. Clear access & refresh tokens
4. Redirect to `/(auth)/login`

## 🎨 What Each Role Sees

### 👑 Admin
- **Dashboard Tab**: Admin overview with stats
- **Users Tab**: User management interface
- **Settings Tab**: System configuration
- **Profile Tab**: Admin profile details

### 💼 Business
- **Business Tab**: Business homepage
- **Products Tab**: Product/service catalog management
- **Analytics Tab**: Business performance insights
- **Profile Tab**: Business profile details

### 📅 Organizer
- **Events Tab**: Event management homepage
- **Attendees Tab**: Participant management
- **Venues Tab**: Location/venue management
- **Profile Tab**: Organizer profile details

### 👤 User
- **Home Tab**: User homepage with welcome
- **Explore Tab**: Browse content
- **Profile Tab**: User profile details

## 🛠️ Key Components

### Services
- `auth.service.ts` - Login, register, logout, profile operations
- `api.client.ts` - Axios client with token refresh interceptor
- `file.service.ts` - File upload operations

### Utilities
- `storage.ts` - TokenManager & SecureStorage classes
- `auth.ts` - AuthUtils with password validation
- `validation.ts` - Zod schemas for form validation

### Hooks
- `useAuth.ts` - Authentication state & operations
- `useApi.ts` - Generic API request hook

## 🧪 Testing Checklist

- [ ] App starts and shows login screen
- [ ] Mock Login button works for all 4 roles
- [ ] Admin role routes to Admin section (4 tabs)
- [ ] Business role routes to Business section (4 tabs)
- [ ] Organizer role routes to Organizer section (4 tabs)
- [ ] User role routes to User section (3 tabs)
- [ ] Can navigate to register page
- [ ] Profile displays correct user info in each role
- [ ] Logout works and returns to login from any role
- [ ] Re-login routes to correct role section

## 🔄 Next Steps (When Backend Ready)

1. Update `.env` file with production API URL
2. Remove or disable Mock Login button
3. Test real login/register flows
4. Verify role-based routing with backend
5. Test token refresh works with real backend
6. Add role-specific features and data loading
7. Implement actual user/business/organizer/admin logic

## ⚙️ Configuration

The app uses environment variables from `.env`:
```
API_BASE_URL=http://localhost:3000/v1
API_TIMEOUT=10000
DEBUG_API_LOGS=true
```

## 🐛 Troubleshooting

**App crashes on startup:**
- Check if all dependencies are installed: `npm install`
- Clear cache: `npx expo start -c`

**Mock Login not working:**
- Check console for errors
- Verify secure storage permissions on device

**Wrong section after login:**
- Check user role in profile tab
- Verify `app/index.tsx` routing logic

**TypeScript errors:**
- Run `npx tsc --noEmit` to check for type errors

---

**Happy Testing! 🎉**

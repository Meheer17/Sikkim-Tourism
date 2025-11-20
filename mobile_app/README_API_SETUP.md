# API and Authentication Infrastructure Setup

This document outlines the complete API infrastructure that has been set up for your production mobile app.

## 📁 Project Structure

```
mobile_app/
├── config/
│   └── api.config.ts         # API configuration
├── types/
│   └── api.types.ts          # TypeScript interfaces and types
├── utils/
│   ├── storage.ts            # Secure storage management
│   ├── auth.ts               # Authentication utilities
│   ├── file-picker.ts        # File selection utilities
│   └── validation.ts         # Form validation schemas
├── services/
│   ├── api.client.ts         # Axios client with interceptors
│   ├── base.service.ts       # Base service class
│   ├── auth.service.ts       # Authentication service
│   ├── file.service.ts       # File upload service
│   └── index.ts              # Service exports
├── hooks/
│   ├── useAuth.ts            # Authentication hook
│   └── useApi.ts             # General API hooks
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx     # Login component
│   │   └── RegisterForm.tsx  # Registration component
│   └── common/
│       └── FilePicker.tsx    # File picker component
├── .env                      # Production environment variables
├── .env.development          # Development environment variables
└── app.config.ts             # Expo configuration
```

## 🔧 Features Implemented

### 1. **Environment Configuration**
- Production and development environment files
- Configurable API endpoints, timeouts, and feature flags
- Expo configuration with environment variable support

### 2. **Secure Authentication System**
- JWT token management with automatic refresh
- Secure storage for tokens and user data
- Login/Register forms with validation
- Password strength validation
- Two-factor authentication support
- Email verification and password reset

### 3. **API Client with Interceptors**
- Automatic token attachment to requests
- Token refresh logic for expired tokens
- Request/response logging in development
- Error handling and user-friendly messages
- Retry logic for failed requests

### 4. **File Upload System**
- Multiple file selection (camera, gallery, documents)
- File validation (size, format)
- Progress tracking during uploads
- Image preview and file management
- Support for images and documents

### 5. **Type-Safe API Services**
- Base service class for CRUD operations
- Comprehensive TypeScript types
- Validation using Zod schemas
- Error handling with proper typing

### 6. **React Hooks for State Management**
- `useAuth` - Complete authentication state management
- `useApi` - Generic API operations with loading states
- `useApiList` - List operations with pagination

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd mobile_app
npm install
```

### 2. Configure Environment
Update `.env` and `.env.development` files with your actual API endpoints:
```env
API_BASE_URL=https://your-api-domain.com/v1
```

### 3. Update App Configuration
Edit `app.config.ts` to set your app's bundle identifiers and project details.

### 4. Run the App
```bash
# Development
npm run start

# iOS
npm run ios

# Android
npm run android
```

## 📝 Usage Examples

### Authentication
```tsx
import { useAuth } from '../hooks/useAuth';

function LoginScreen() {
  const { login, isLoading, user } = useAuth();

  const handleLogin = async (email: string, password: string) => {
    const success = await login({ email, password });
    if (success) {
      // Navigate to main app
    }
  };

  return (
    <LoginForm
      onSuccess={() => navigation.navigate('Home')}
      onNavigateToRegister={() => navigation.navigate('Register')}
    />
  );
}
```

### API Calls
```tsx
import { useApi } from '../hooks/useApi';

function UserProfile() {
  const { data: profile, loading, error, get, put } = useApi();

  useEffect(() => {
    get('/user/profile');
  }, []);

  const updateProfile = async (data) => {
    await put('/user/profile', data, {
      showSuccessToast: true,
      successMessage: 'Profile updated successfully'
    });
  };

  return (
    // Your component JSX
  );
}
```

### File Upload
```tsx
import { FilePicker } from '../components/common/FilePicker';

function DocumentUpload() {
  const handleFilesUploaded = (files) => {
    console.log('Uploaded files:', files);
  };

  return (
    <FilePicker
      maxFiles={5}
      allowedTypes="any"
      onFilesSelected={handleFilesUploaded}
      uploadImmediately={true}
    />
  );
}
```

## 🔒 Security Features

- **Secure Token Storage**: Uses Expo SecureStore for sensitive data
- **Automatic Token Refresh**: Handles expired tokens seamlessly
- **Request Validation**: Client-side validation with Zod schemas
- **Error Handling**: Proper error handling and user feedback
- **File Validation**: Size and format validation for uploads

## 🛠 Customization

### Adding New Services
1. Create a new service class extending `BaseService`:
```tsx
export class ProductService extends BaseService<Product> {
  constructor() {
    super('/products');
  }

  async searchProducts(query: string) {
    return this.customGet('search', { q: query });
  }
}
```

2. Export it from `services/index.ts`
3. Use it in your components with the `useApi` hook

### Adding New Validation Schemas
Add new schemas to `utils/validation.ts`:
```tsx
export const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  price: z.number().min(0, 'Price must be positive'),
  // ... more fields
});
```

## 📱 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `API_BASE_URL` | Base API URL | `https://api.yourdomain.com/v1` |
| `API_TIMEOUT` | Request timeout in ms | `10000` |
| `DEBUG_API_LOGS` | Enable API logging | `false` (prod), `true` (dev) |
| `MAX_FILE_SIZE` | Max file upload size | `10485760` (10MB) |
| `ALLOWED_IMAGE_FORMATS` | Allowed image formats | `jpg,jpeg,png,gif,webp` |
| `ALLOWED_DOCUMENT_FORMATS` | Allowed document formats | `pdf,doc,docx,txt` |

## 🎯 Next Steps

1. **Update API URLs**: Replace placeholder URLs with your actual backend endpoints
2. **Configure Bundle IDs**: Update iOS and Android bundle identifiers
3. **Add App Icons**: Replace placeholder icons with your app's icons
4. **Implement Navigation**: Set up navigation between login/register and main app
5. **Add Push Notifications**: Configure push notification services
6. **Testing**: Add unit and integration tests
7. **Analytics**: Integrate analytics and crash reporting

## 📚 Additional Resources

- [Expo Documentation](https://docs.expo.dev)
- [React Hook Form](https://react-hook-form.com)
- [Axios Documentation](https://axios-http.com)
- [Zod Validation](https://zod.dev)
- [React Native Paper](https://callstack.github.io/react-native-paper/) (for UI components)

This setup provides a solid foundation for a production-ready mobile app with authentication, file uploads, and API management. You can now focus on building your app's specific features on top of this infrastructure.
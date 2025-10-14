# Authentication Setup Documentation

This document explains the authentication flow implementation for the HireNest Admin Panel.

## Overview

The authentication system uses:
- **Redux Toolkit** for state management
- **localStorage** for persisting auth tokens and user data
- **Next.js API** integration with backend server

## Setup Steps

### 1. Environment Configuration

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

> **Note:** This URL should point to your backend API server.

### 2. Project Structure

```
lib/
├── api/
│   └── auth.ts                 # API service for authentication
├── store/
│   ├── index.ts                # Redux store configuration
│   ├── authSlice.ts            # Auth state management slice
│   └── hooks.ts                # Typed Redux hooks
└── hooks/
    └── use-auth.ts             # Custom auth hook

components/
├── providers/
│   └── redux-provider.tsx      # Redux Provider wrapper
└── admin/
    └── auth-guard.tsx          # Protected route component
```

## API Endpoints

### Login Endpoint

**URL:** `POST /admin/auth/login`

**Request Body:**
```json
{
  "email": "admin@hirenest.com",
  "password": "ddKkCkM5AEh3Kiym"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "68e917fb8b73a618c7f9a342",
    "email": "admin@hirenest.com",
    "firstName": "admin"
  }
}
```

## Redux State Management

### Auth State Structure

```typescript
interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}
```

### Available Actions

- `loginAsync`: Async thunk for login
- `logout`: Clear auth state and localStorage
- `restoreAuth`: Restore auth from localStorage
- `clearError`: Clear error messages

## Usage Examples

### 1. Login Page

```tsx
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { loginAsync } from "@/lib/store/authSlice";

function LoginPage() {
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const handleLogin = async (email: string, password: string) => {
    try {
      await dispatch(loginAsync({ email, password })).unwrap();
      // Redirect to dashboard
    } catch (error) {
      // Handle error
    }
  };

  return (
    // Your login form
  );
}
```

### 2. Using the Auth Hook

```tsx
import { useAuth } from "@/hooks/use-auth";

function UserProfile() {
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) {
    return <div>Please login</div>;
  }

  return (
    <div>
      <p>Welcome, {user?.firstName}!</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### 3. Protecting Routes

```tsx
import { AuthGuard } from "@/components/admin/auth-guard";

export default function DashboardPage() {
  return (
    <AuthGuard>
      <div>Protected Dashboard Content</div>
    </AuthGuard>
  );
}
```

### 4. Accessing Auth State

```tsx
import { useAppSelector } from "@/lib/store/hooks";

function Header() {
  const { user, token } = useAppSelector((state) => state.auth);

  return (
    <header>
      {user && <span>Logged in as: {user.email}</span>}
    </header>
  );
}
```

## Local Storage

The authentication system automatically stores:
- **token**: JWT authentication token
- **user**: User object (id, email, firstName)

These are persisted across page refreshes and restored on app initialization.

### Accessing Stored Data

```typescript
import { authApi } from "@/lib/api/auth";

const token = authApi.getStoredToken();
const user = authApi.getStoredUser();
```

## Redux DevTools

The Redux store is configured with Redux DevTools support for debugging:

1. Install [Redux DevTools Extension](https://chrome.google.com/webstore/detail/redux-devtools/)
2. Open browser DevTools
3. Navigate to the Redux tab to inspect state and actions

## Authentication Flow

1. **User Login:**
   - User enters credentials
   - `loginAsync` thunk is dispatched
   - API call is made to backend
   - On success: token and user stored in localStorage and Redux state
   - User redirected to dashboard

2. **Page Refresh:**
   - `ReduxProvider` component runs on mount
   - `restoreAuth` action is dispatched
   - Auth data restored from localStorage
   - User remains logged in

3. **Protected Routes:**
   - `AuthGuard` component checks Redux state
   - If not authenticated: redirect to login
   - If authenticated: render protected content

4. **Logout:**
   - `logout` action is dispatched
   - localStorage is cleared
   - Redux state is reset
   - User redirected to login page

## API Service

The API service (`lib/api/auth.ts`) provides:

- `login(credentials)`: Authenticate user
- `logout()`: Clear stored auth data
- `getStoredToken()`: Retrieve stored JWT
- `getStoredUser()`: Retrieve stored user data

## Error Handling

Errors are managed through Redux state:

```tsx
const { error } = useAppSelector((state) => state.auth);

useEffect(() => {
  if (error) {
    // Display error toast/notification
  }
}, [error]);
```

## Security Considerations

1. **Token Storage**: Tokens are stored in localStorage (consider httpOnly cookies for production)
2. **API URL**: Stored in environment variables
3. **Token Expiration**: Implement token refresh logic as needed
4. **HTTPS**: Always use HTTPS in production

## Testing

Test credentials for development:
- **Email:** admin@hirenest.com
- **Password:** ddKkCkM5AEh3Kiym

## Troubleshooting

### "Network Error" on Login
- Check if backend server is running on the correct port
- Verify `NEXT_PUBLIC_API_URL` in `.env.local`

### Auth State Not Persisting
- Check browser's localStorage in DevTools
- Ensure `ReduxProvider` is wrapping your app

### Redirect Loop
- Check `AuthGuard` logic
- Verify auth state in Redux DevTools

## Future Enhancements

- [ ] Token refresh mechanism
- [ ] Remember me functionality
- [ ] Multi-factor authentication
- [ ] Session timeout handling
- [ ] Role-based access control (RBAC)


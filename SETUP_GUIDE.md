# 🚀 Quick Setup Guide - Authentication System

## ✅ What Has Been Implemented

The complete authentication flow has been set up with the following features:

1. ✅ Environment configuration for API URL
2. ✅ API service for authentication
3. ✅ Redux store with auth slice
4. ✅ Redux Provider configured in the app
5. ✅ Login page integrated with API and Redux
6. ✅ Local storage for token and user persistence
7. ✅ Auth guard for protected routes
8. ✅ Custom hooks for easy auth access
9. ✅ API client for authenticated requests

## 📋 Quick Start

### Step 1: Create Environment File

Create a `.env.local` file in the root directory:

```bash
# Copy and paste this into .env.local
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### Step 2: Start Your Backend Server

Make sure your backend API is running on `http://localhost:5000`

### Step 3: Test the Login

Navigate to: `http://localhost:3000/admin/login`

**Test Credentials:**
- Email: `admin@hirenest.com`
- Password: `ddKkCkM5AEh3Kiym`

## 📁 File Structure

```
Created/Modified Files:
├── .env.local                          # ⚠️ You need to create this manually
├── lib/
│   ├── api/
│   │   ├── auth.ts                     # ✅ Authentication API service
│   │   └── client.ts                   # ✅ API client with auth support
│   └── store/
│       ├── index.ts                    # ✅ Redux store
│       ├── authSlice.ts                # ✅ Auth state management
│       └── hooks.ts                    # ✅ Typed Redux hooks
├── hooks/
│   └── use-auth.ts                     # ✅ Custom auth hook
├── components/
│   ├── providers/
│   │   └── redux-provider.tsx          # ✅ Redux Provider
│   └── admin/
│       └── auth-guard.tsx              # ✅ Updated to use Redux
├── app/
│   ├── layout.tsx                      # ✅ Updated with Redux Provider
│   └── admin/
│       └── login/
│           └── page.tsx                # ✅ Updated with API & Redux
└── docs/
    └── AUTH_SETUP.md                   # ✅ Detailed documentation
```

## 🔑 How It Works

### 1. Login Flow

```
User enters credentials
    ↓
Redux dispatch loginAsync()
    ↓
API call to backend
    ↓
Store token & user in localStorage
    ↓
Update Redux state
    ↓
Redirect to dashboard
```

### 2. Data Persistence

- **Token** and **User** data are stored in localStorage
- On page refresh, data is automatically restored from localStorage
- Redux state is rehydrated on app initialization

## 💻 Usage Examples

### Login (Already Implemented)

The login page at `/app/admin/login/page.tsx` is ready to use!

### Using Auth in Components

```tsx
import { useAuth } from "@/hooks/use-auth";

function MyComponent() {
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) {
    return <div>Please login</div>;
  }

  return (
    <div>
      <h1>Welcome, {user?.firstName}!</h1>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Making Authenticated API Calls

```tsx
import { api } from "@/lib/api/client";

// GET request with auth token
const companies = await api.get('/admin/companies');

// POST request with auth token
const newCompany = await api.post('/admin/companies', {
  name: 'Company Name',
  email: 'company@example.com'
});

// The token is automatically included in the headers
```

### Protecting Routes

```tsx
import { AuthGuard } from "@/components/admin/auth-guard";

export default function DashboardPage() {
  return (
    <AuthGuard>
      {/* This content is only visible to authenticated users */}
      <div>Protected Dashboard</div>
    </AuthGuard>
  );
}
```

### Accessing User from Redux

```tsx
import { useAppSelector } from "@/lib/store/hooks";

function Header() {
  const { user, token } = useAppSelector((state) => state.auth);

  return (
    <header>
      <p>Email: {user?.email}</p>
      <p>Token: {token}</p>
    </header>
  );
}
```

## 🔍 Debugging

### Redux DevTools

1. Install [Redux DevTools](https://chrome.google.com/webstore/detail/redux-devtools/)
2. Open browser DevTools → Redux tab
3. See all actions and state changes

### Check localStorage

1. Open browser DevTools → Application tab
2. Look under Storage → Local Storage
3. You should see `token` and `user` keys

## 🎯 What's Stored in localStorage

After successful login:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "68e917fb8b73a618c7f9a342",
    "email": "admin@hirenest.com",
    "firstName": "admin"
  }
}
```

## 🚨 Common Issues

### Issue: "Network Error" on Login
**Solution:** 
- Check if backend is running
- Verify `.env.local` has correct API URL
- Check browser console for CORS errors

### Issue: Auth state not persisting
**Solution:**
- Check localStorage in DevTools
- Ensure Redux Provider is in `layout.tsx`
- Clear browser cache and try again

### Issue: Redirect loop
**Solution:**
- Check Redux state in DevTools
- Verify token exists in localStorage
- Check AuthGuard component logic

## 📚 Additional Resources

For detailed documentation, see: `docs/AUTH_SETUP.md`

## ✅ Next Steps

1. **Create `.env.local`** with your API URL
2. **Start your backend** server
3. **Test login** at `/admin/login`
4. **Use `useAuth()` hook** in your components
5. **Use `api` client** for authenticated API calls

---

**That's it! Your authentication system is ready to use! 🎉**


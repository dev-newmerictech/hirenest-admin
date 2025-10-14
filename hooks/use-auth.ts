// Custom hook for authentication

import { useAppSelector, useAppDispatch } from '@/lib/store/hooks';
import { logout } from '@/lib/store/authSlice';
import { useRouter } from 'next/navigation';

export function useAuth() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user, token, isAuthenticated, isLoading, error } = useAppSelector(
    (state) => state.auth
  );

  const handleLogout = () => {
    dispatch(logout());
    router.push('/admin/login');
  };

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    logout: handleLogout,
  };
}


// Redux Provider wrapper for Next.js App Router

'use client';

import { Provider } from 'react-redux';
import { store } from '@/lib/store';
import { useEffect } from 'react';
import { restoreAuth } from '@/lib/store/authSlice';

export function ReduxProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Restore auth state from localStorage on mount
    store.dispatch(restoreAuth());
  }, []);

  return <Provider store={store}>{children}</Provider>;
}


import React, { useState, useEffect } from 'react';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { AuthContext } from './AuthContext';
import { auth } from '../../firebase/firebase';
import { getRedirectResult } from '../../firebase/signInWithGoogle';

// Provider component that wraps the app and makes auth object available to any child component that calls useAuth()
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  useEffect(() => {
    let done = false;
    const setLoadingDone = () => {
      if (!done) {
        done = true;
        setIsLoadingUser(false);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      setUser(authUser);
      setLoadingDone();
    });

    // Consume redirect so Firebase can update auth state; or timeout so we never hang if it doesn't resolve.
    getRedirectResult(auth).catch((error) => {
      console.error('Redirect sign-in error:', error.code, error.message);
    }).finally(setLoadingDone);
    const timeout = setTimeout(setLoadingDone, 4000);

    return () => {
      clearTimeout(timeout);
      unsubscribe();
    };
  }, []);

  const value = {
    user,
    setUser,
    isLoadingUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

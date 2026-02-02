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
    let unsubscribe: (() => void) | undefined;

    // Process redirect result first (when user returns from Google sign-in on mobile).
    // Then subscribe to auth state so we have the correct user.
    getRedirectResult(auth)
      .then((result) => {
        if (result) {
          // User signed in via redirect; onAuthStateChanged will fire with the user
        }
      })
      .catch((error) => {
        console.error('Redirect sign-in error:', error.code, error.message);
      })
      .finally(() => {
        unsubscribe = onAuthStateChanged(auth, (authUser) => {
          setUser(authUser);
          setIsLoadingUser(false);
        });
      });

    return () => {
      unsubscribe?.();
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

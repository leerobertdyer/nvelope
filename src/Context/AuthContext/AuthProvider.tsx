import React, { useState, useEffect } from "react";
import type { User } from "firebase/auth";
import {
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { AuthContext } from "./AuthContext";
import { auth } from "../../firebase/firebase";
import { getRedirectResult } from "../../firebase/signInWithGoogle";

let redirectPromise: Promise<unknown> | null = null;

function getOrCreateRedirectPromise(): Promise<unknown> {
  if (redirectPromise) return redirectPromise;
  redirectPromise = (async () => {
    await setPersistence(auth, browserLocalPersistence);
    return getRedirectResult(auth);
  })();
  return redirectPromise;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      console.log("AUTH CHANGD: ", authUser);
      setUser(authUser);
      getOrCreateRedirectPromise();
      setIsLoadingUser(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const value = {
    user,
    setUser,
    isLoadingUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

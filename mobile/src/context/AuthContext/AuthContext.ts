import { createContext } from 'react';
import type { FirebaseAuthTypes } from '@react-native-firebase/auth';

type User = FirebaseAuthTypes.User;

export type AuthContextType = {
  user: User | null;
  setUser: (user: User | null) => void;
  isLoadingUser: boolean;
};

export const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
  isLoadingUser: true
});
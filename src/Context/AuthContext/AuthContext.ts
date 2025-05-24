import { createContext } from 'react';
import type { User } from 'firebase/auth';

// Define the shape of our context
export type AuthContextType = {
  user: User | null;
  setUser: (user: User | null) => void;
};

// Create the context with a default value
export const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
});

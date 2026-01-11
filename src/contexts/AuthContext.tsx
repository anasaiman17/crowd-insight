import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User } from '@/types/crowd';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, role: 'admin' | 'user') => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string, role: 'admin' | 'user'): Promise<boolean> => {
    // Simulated authentication - in production, this would connect to a real backend
    if (email && password.length >= 4) {
      const mockUser: User = {
        id: crypto.randomUUID(),
        email,
        role,
        name: email.split('@')[0],
        createdAt: new Date(),
      };
      setUser(mockUser);
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

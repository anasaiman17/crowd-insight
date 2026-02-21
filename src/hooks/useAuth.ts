import { useState, useEffect } from 'react';

export interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'user';
  created_at: string;
}

const DEMO_USERS = [
  { email: 'demo@gmail.com', password: 'demo123456', fullName: 'Demo User', role: 'user' as const },
  { email: 'admin@gmail.com', password: 'admin123456', fullName: 'Admin User', role: 'admin' as const },
];

const AUTH_STORAGE_KEY = 'crowdvision_auth';

function getStoredAuth() {
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch { return null; }
}

export function useAuth() {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<'admin' | 'user'>('user');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = getStoredAuth();
    if (stored) {
      setUser({ id: stored.id, email: stored.email });
      setProfile(stored.profile);
      setRole(stored.role);
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    const found = DEMO_USERS.find(u => u.email === email && u.password === password);
    if (!found) {
      return { data: null, error: { message: 'Invalid email or password' } };
    }
    const id = found.email === 'admin@gmail.com' ? 'admin-001' : 'demo-001';
    const now = new Date().toISOString();
    const prof: UserProfile = {
      id: `profile-${id}`, user_id: id, email: found.email,
      full_name: found.fullName, avatar_url: null, created_at: now, updated_at: now,
    };
    const authData = { id, email: found.email, profile: prof, role: found.role };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
    setUser({ id, email: found.email });
    setProfile(prof);
    setRole(found.role);
    return { data: authData, error: null };
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    return { data: null, error: { message: 'Sign up is disabled in demo mode. Use the demo credentials.' } };
  };

  const signOut = async () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setUser(null);
    setProfile(null);
    setRole('user');
    return { error: null };
  };

  return {
    user,
    session: user ? { user } : null,
    profile,
    role,
    loading,
    isAuthenticated: !!user,
    isAdmin: role === 'admin',
    signUp,
    signIn,
    signOut,
  };
}

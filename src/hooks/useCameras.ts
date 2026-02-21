import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

export interface Camera {
  id: string;
  user_id: string;
  name: string;
  location: string | null;
  stream_url: string | null;
  is_active: boolean;
  grid_position: number;
  created_at: string;
  updated_at: string;
}

const INITIAL_CAMERAS: Camera[] = [
  { id: 'cam-1', user_id: 'demo-001', name: 'Main Entrance', location: 'Building A', stream_url: null, is_active: true, grid_position: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'cam-2', user_id: 'demo-001', name: 'Lobby', location: 'Building A', stream_url: null, is_active: true, grid_position: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

export function useCameras() {
  const { user } = useAuth();
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) setCameras(INITIAL_CAMERAS);
    setLoading(false);
  }, [user]);

  const addCamera = async (camera: Omit<Camera, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return { error: new Error('Not authenticated') };
    const now = new Date().toISOString();
    const newCam: Camera = { ...camera, id: `cam-${Date.now()}`, user_id: user.id, created_at: now, updated_at: now };
    setCameras(prev => [...prev, newCam]);
    return { data: newCam, error: null };
  };

  const updateCamera = async (id: string, updates: Partial<Camera>) => {
    setCameras(prev => prev.map(c => c.id === id ? { ...c, ...updates, updated_at: new Date().toISOString() } : c));
    return { data: cameras.find(c => c.id === id) || null, error: null };
  };

  const deleteCamera = async (id: string) => {
    setCameras(prev => prev.filter(c => c.id !== id));
    return { error: null };
  };

  return { cameras, loading, addCamera, updateCamera, deleteCamera, refetch: () => {} };
}

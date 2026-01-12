import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
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

export function useCameras() {
  const { user } = useAuth();
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCameras = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('cameras')
      .select('*')
      .order('grid_position', { ascending: true });
    
    if (!error && data) {
      setCameras(data as Camera[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      fetchCameras();
    }
  }, [user]);

  const addCamera = async (camera: Omit<Camera, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return { error: new Error('Not authenticated') };
    
    const { data, error } = await supabase
      .from('cameras')
      .insert({
        ...camera,
        user_id: user.id,
      })
      .select()
      .single();
    
    if (!error && data) {
      setCameras(prev => [...prev, data as Camera]);
    }
    return { data, error };
  };

  const updateCamera = async (id: string, updates: Partial<Camera>) => {
    const { data, error } = await supabase
      .from('cameras')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (!error && data) {
      setCameras(prev => prev.map(c => c.id === id ? data as Camera : c));
    }
    return { data, error };
  };

  const deleteCamera = async (id: string) => {
    const { error } = await supabase
      .from('cameras')
      .delete()
      .eq('id', id);
    
    if (!error) {
      setCameras(prev => prev.filter(c => c.id !== id));
    }
    return { error };
  };

  return {
    cameras,
    loading,
    addCamera,
    updateCamera,
    deleteCamera,
    refetch: fetchCameras,
  };
}

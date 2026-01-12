import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Alert {
  id: string;
  user_id: string;
  camera_id: string | null;
  analysis_id: string | null;
  threshold_id: string | null;
  people_count: number;
  density_level: 'low' | 'medium' | 'high';
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface AlertThreshold {
  id: string;
  user_id: string;
  camera_id: string | null;
  threshold_count: number;
  density_trigger: 'low' | 'medium' | 'high';
  is_enabled: boolean;
  notify_email: boolean;
  notify_in_app: boolean;
  created_at: string;
  updated_at: string;
}

export function useAlerts() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [thresholds, setThresholds] = useState<AlertThreshold[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (!error && data) {
      setAlerts(data as Alert[]);
      setUnreadCount((data as Alert[]).filter(a => !a.is_read).length);
    }
  };

  const fetchThresholds = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('alert_thresholds')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setThresholds(data as AlertThreshold[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      fetchAlerts();
      fetchThresholds();
    }
  }, [user]);

  const checkAndCreateAlert = async (
    peopleCount: number,
    densityLevel: 'low' | 'medium' | 'high',
    cameraId?: string,
    analysisId?: string
  ) => {
    if (!user) return;

    // Find matching thresholds
    const matchingThresholds = thresholds.filter(t => {
      if (!t.is_enabled) return false;
      if (t.camera_id && t.camera_id !== cameraId) return false;
      
      // Check if threshold is exceeded
      const countExceeded = peopleCount >= t.threshold_count;
      const densityExceeded = getDensityRank(densityLevel) >= getDensityRank(t.density_trigger);
      
      return countExceeded || densityExceeded;
    });

    // Create alerts for matching thresholds
    for (const threshold of matchingThresholds) {
      const message = `Crowd alert: ${peopleCount} people detected (${densityLevel} density). Threshold: ${threshold.threshold_count} people.`;
      
      const { data, error } = await supabase
        .from('alerts')
        .insert({
          user_id: user.id,
          camera_id: cameraId || null,
          analysis_id: analysisId || null,
          threshold_id: threshold.id,
          people_count: peopleCount,
          density_level: densityLevel,
          message,
          is_read: false,
        })
        .select()
        .single();
      
      if (!error && data) {
        setAlerts(prev => [data as Alert, ...prev]);
        setUnreadCount(prev => prev + 1);
      }
    }
  };

  const markAsRead = async (alertId: string) => {
    const { error } = await supabase
      .from('alerts')
      .update({ is_read: true })
      .eq('id', alertId);
    
    if (!error) {
      setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, is_read: true } : a));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    
    const { error } = await supabase
      .from('alerts')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
    
    if (!error) {
      setAlerts(prev => prev.map(a => ({ ...a, is_read: true })));
      setUnreadCount(0);
    }
  };

  const updateThreshold = async (id: string, updates: Partial<AlertThreshold>) => {
    const { data, error } = await supabase
      .from('alert_thresholds')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (!error && data) {
      setThresholds(prev => prev.map(t => t.id === id ? data as AlertThreshold : t));
    }
    return { data, error };
  };

  const addThreshold = async (threshold: Omit<AlertThreshold, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return { error: new Error('Not authenticated') };
    
    const { data, error } = await supabase
      .from('alert_thresholds')
      .insert({
        ...threshold,
        user_id: user.id,
      })
      .select()
      .single();
    
    if (!error && data) {
      setThresholds(prev => [data as AlertThreshold, ...prev]);
    }
    return { data, error };
  };

  return {
    alerts,
    thresholds,
    unreadCount,
    loading,
    checkAndCreateAlert,
    markAsRead,
    markAllAsRead,
    updateThreshold,
    addThreshold,
    refetchAlerts: fetchAlerts,
    refetchThresholds: fetchThresholds,
  };
}

function getDensityRank(level: 'low' | 'medium' | 'high'): number {
  switch (level) {
    case 'low': return 1;
    case 'medium': return 2;
    case 'high': return 3;
    default: return 0;
  }
}

import { useState, useEffect } from 'react';
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

function getDensityRank(level: 'low' | 'medium' | 'high'): number {
  return level === 'low' ? 1 : level === 'medium' ? 2 : 3;
}

export function useAlerts() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [thresholds, setThresholds] = useState<AlertThreshold[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const now = new Date().toISOString();
      setThresholds([{
        id: 'th-1', user_id: user.id, camera_id: null, threshold_count: 30,
        density_trigger: 'high', is_enabled: true, notify_email: false, notify_in_app: true,
        created_at: now, updated_at: now,
      }]);
    }
    setLoading(false);
  }, [user]);

  const checkAndCreateAlert = async (
    peopleCount: number, densityLevel: 'low' | 'medium' | 'high',
    cameraId?: string, analysisId?: string
  ) => {
    if (!user) return;
    const matching = thresholds.filter(t => {
      if (!t.is_enabled) return false;
      if (t.camera_id && t.camera_id !== cameraId) return false;
      return peopleCount >= t.threshold_count || getDensityRank(densityLevel) >= getDensityRank(t.density_trigger);
    });
    for (const threshold of matching) {
      const newAlert: Alert = {
        id: `alert-${Date.now()}`, user_id: user.id, camera_id: cameraId || null,
        analysis_id: analysisId || null, threshold_id: threshold.id, people_count: peopleCount,
        density_level: densityLevel, message: `Crowd alert: ${peopleCount} people detected (${densityLevel} density).`,
        is_read: false, created_at: new Date().toISOString(),
      };
      setAlerts(prev => [newAlert, ...prev]);
      setUnreadCount(prev => prev + 1);
    }
  };

  const markAsRead = async (alertId: string) => {
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, is_read: true } : a));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    setAlerts(prev => prev.map(a => ({ ...a, is_read: true })));
    setUnreadCount(0);
  };

  const updateThreshold = async (id: string, updates: Partial<AlertThreshold>) => {
    setThresholds(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    return { data: thresholds.find(t => t.id === id), error: null };
  };

  const addThreshold = async (threshold: Omit<AlertThreshold, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return { error: new Error('Not authenticated') };
    const now = new Date().toISOString();
    const newT: AlertThreshold = { ...threshold, id: `th-${Date.now()}`, user_id: user.id, created_at: now, updated_at: now };
    setThresholds(prev => [newT, ...prev]);
    return { data: newT, error: null };
  };

  return {
    alerts, thresholds, unreadCount, loading, checkAndCreateAlert,
    markAsRead, markAllAsRead, updateThreshold, addThreshold,
    refetchAlerts: () => {}, refetchThresholds: () => {},
  };
}

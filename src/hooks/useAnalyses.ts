import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface CrowdAnalysisRecord {
  id: string;
  user_id: string;
  camera_id: string | null;
  people_count: number;
  density_level: 'low' | 'medium' | 'high';
  detected_persons: any[];
  image_url: string | null;
  processed_image_url: string | null;
  confidence_avg: number | null;
  created_at: string;
}

export function useAnalyses() {
  const { user } = useAuth();
  const [analyses, setAnalyses] = useState<CrowdAnalysisRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCount: 0,
    todayCount: 0,
    avgPeopleCount: 0,
    peakCount: 0,
  });

  const fetchAnalyses = async (limit = 50) => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('crowd_analyses')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (!error && data) {
      setAnalyses(data as CrowdAnalysisRecord[]);
      calculateStats(data as CrowdAnalysisRecord[]);
    }
    setLoading(false);
  };

  const calculateStats = (data: CrowdAnalysisRecord[]) => {
    const today = new Date().toISOString().split('T')[0];
    const todayAnalyses = data.filter(a => a.created_at.startsWith(today));
    
    setStats({
      totalCount: data.length,
      todayCount: todayAnalyses.length,
      avgPeopleCount: data.length > 0 
        ? Math.round(data.reduce((acc, a) => acc + a.people_count, 0) / data.length)
        : 0,
      peakCount: data.length > 0 
        ? Math.max(...data.map(a => a.people_count))
        : 0,
    });
  };

  useEffect(() => {
    if (user) {
      fetchAnalyses();
    }
  }, [user]);

  const saveAnalysis = async (analysis: Omit<CrowdAnalysisRecord, 'id' | 'user_id' | 'created_at'>) => {
    if (!user) return { error: new Error('Not authenticated') };
    
    const { data, error } = await supabase
      .from('crowd_analyses')
      .insert({
        ...analysis,
        user_id: user.id,
      })
      .select()
      .single();
    
    if (!error && data) {
      setAnalyses(prev => [data as CrowdAnalysisRecord, ...prev]);
      calculateStats([data as CrowdAnalysisRecord, ...analyses]);
    }
    return { data, error };
  };

  const getHourlyData = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const today = new Date().toISOString().split('T')[0];
    
    return hours.map(hour => {
      const hourStr = hour.toString().padStart(2, '0');
      const hourAnalyses = analyses.filter(a => {
        const analysisHour = new Date(a.created_at).getHours();
        return a.created_at.startsWith(today) && analysisHour === hour;
      });
      
      const avgCount = hourAnalyses.length > 0
        ? Math.round(hourAnalyses.reduce((acc, a) => acc + a.people_count, 0) / hourAnalyses.length)
        : 0;
      
      return {
        hour: `${hourStr}:00`,
        count: avgCount,
        density: avgCount <= 10 ? 'low' as const : avgCount <= 30 ? 'medium' as const : 'high' as const,
      };
    });
  };

  return {
    analyses,
    loading,
    stats,
    saveAnalysis,
    refetch: fetchAnalyses,
    getHourlyData,
  };
}

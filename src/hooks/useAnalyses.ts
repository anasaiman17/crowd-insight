import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { generateMockDetections, getDensityLevel } from '@/lib/mockData';

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

function generateInitialAnalyses(): CrowdAnalysisRecord[] {
  const now = Date.now();
  return [
    { id: 'a1', user_id: 'demo-001', camera_id: null, people_count: 24, density_level: 'medium', detected_persons: generateMockDetections(24), image_url: null, processed_image_url: null, confidence_avg: 0.91, created_at: new Date(now - 300000).toISOString() },
    { id: 'a2', user_id: 'demo-001', camera_id: null, people_count: 8, density_level: 'low', detected_persons: generateMockDetections(8), image_url: null, processed_image_url: null, confidence_avg: 0.88, created_at: new Date(now - 1800000).toISOString() },
    { id: 'a3', user_id: 'demo-001', camera_id: null, people_count: 42, density_level: 'high', detected_persons: generateMockDetections(42), image_url: null, processed_image_url: null, confidence_avg: 0.93, created_at: new Date(now - 3600000).toISOString() },
  ];
}

export function useAnalyses() {
  const { user } = useAuth();
  const [analyses, setAnalyses] = useState<CrowdAnalysisRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalCount: 0, todayCount: 0, avgPeopleCount: 0, peakCount: 0 });

  const calculateStats = (data: CrowdAnalysisRecord[]) => {
    const today = new Date().toISOString().split('T')[0];
    const todayAnalyses = data.filter(a => a.created_at.startsWith(today));
    setStats({
      totalCount: data.length,
      todayCount: todayAnalyses.length,
      avgPeopleCount: data.length > 0 ? Math.round(data.reduce((acc, a) => acc + a.people_count, 0) / data.length) : 0,
      peakCount: data.length > 0 ? Math.max(...data.map(a => a.people_count)) : 0,
    });
  };

  useEffect(() => {
    if (user) {
      const data = generateInitialAnalyses();
      setAnalyses(data);
      calculateStats(data);
    }
    setLoading(false);
  }, [user]);

  const saveAnalysis = async (analysis: Omit<CrowdAnalysisRecord, 'id' | 'user_id' | 'created_at'>) => {
    if (!user) return { error: new Error('Not authenticated') };
    const newRecord: CrowdAnalysisRecord = {
      ...analysis,
      id: `a-${Date.now()}`,
      user_id: user.id,
      created_at: new Date().toISOString(),
    };
    const updated = [newRecord, ...analyses];
    setAnalyses(updated);
    calculateStats(updated);
    return { data: newRecord, error: null };
  };

  const getHourlyData = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const today = new Date().toISOString().split('T')[0];
    return hours.map(hour => {
      const hourStr = hour.toString().padStart(2, '0');
      const hourAnalyses = analyses.filter(a => a.created_at.startsWith(today) && new Date(a.created_at).getHours() === hour);
      const avgCount = hourAnalyses.length > 0 ? Math.round(hourAnalyses.reduce((acc, a) => acc + a.people_count, 0) / hourAnalyses.length) : 0;
      return { hour: `${hourStr}:00`, count: avgCount, density: getDensityLevel(avgCount) };
    });
  };

  return { analyses, loading, stats, saveAnalysis, refetch: () => {}, getHourlyData };
}

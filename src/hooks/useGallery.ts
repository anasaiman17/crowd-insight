import { useState } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export interface GalleryItem {
  id: string;
  user_id: string;
  file_url: string;
  file_type: 'image' | 'video';
  file_name: string;
  thumbnail_url: string | null;
  analysis_status: 'pending' | 'processing' | 'completed' | 'failed';
  people_count: number;
  density_level: 'low' | 'medium' | 'high';
  detected_persons: any[];
  confidence_avg: number;
  created_at: string;
  updated_at: string;
}

export function useGallery() {
  const { user } = useAuth();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [isLoading] = useState(false);

  const upload = async (file: File): Promise<GalleryItem> => {
    if (!user) throw new Error('Not authenticated');
    const url = URL.createObjectURL(file);
    const fileType = file.type.startsWith('video/') ? 'video' : 'image';
    const now = new Date().toISOString();
    const newItem: GalleryItem = {
      id: `g-${Date.now()}`, user_id: user.id, file_url: url, file_type: fileType as 'image' | 'video',
      file_name: file.name, thumbnail_url: null, analysis_status: 'pending',
      people_count: 0, density_level: 'low', detected_persons: [], confidence_avg: 0,
      created_at: now, updated_at: now,
    };
    setItems(prev => [newItem, ...prev]);
    return newItem;
  };

  const analyze = async (item: GalleryItem): Promise<GalleryItem> => {
    if (!user) throw new Error('Not authenticated');
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, analysis_status: 'processing' as const } : i));

    if (item.file_type === 'image') {
      const response = await fetch(item.file_url);
      const blob = await response.blob();
      const base64 = await blobToBase64(blob);
      const { data, error } = await supabase.functions.invoke('analyze-crowd', { body: { image: base64 } });
      if (error) throw error;

      const densityLevel = data.peopleCount <= 10 ? 'low' : data.peopleCount <= 30 ? 'medium' : 'high';
      const confidenceAvg = data.detectedPersons.length > 0
        ? data.detectedPersons.reduce((acc: number, p: any) => acc + p.confidence, 0) / data.detectedPersons.length : 0;

      const updated: GalleryItem = {
        ...item, analysis_status: 'completed', people_count: data.peopleCount,
        density_level: densityLevel as 'low' | 'medium' | 'high',
        detected_persons: data.detectedPersons, confidence_avg: Math.round(confidenceAvg * 100) / 100,
      };
      setItems(prev => prev.map(i => i.id === item.id ? updated : i));
      return updated;
    }

    const updated: GalleryItem = { ...item, analysis_status: 'completed' };
    setItems(prev => prev.map(i => i.id === item.id ? updated : i));
    return updated;
  };

  const deleteItem = async (item: GalleryItem) => {
    setItems(prev => prev.filter(i => i.id !== item.id));
  };

  return {
    items, isLoading, upload, isUploading: false,
    analyze, isAnalyzing: false, deleteItem, isDeleting: false,
  };
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

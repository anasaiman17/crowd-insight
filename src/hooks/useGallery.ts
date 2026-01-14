import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

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
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['gallery', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('gallery_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as GalleryItem[];
    },
    enabled: !!user,
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!user) throw new Error('Not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const fileType = file.type.startsWith('video/') ? 'video' : 'image';

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('gallery')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('gallery')
        .getPublicUrl(fileName);

      // Create gallery item
      const { data, error } = await supabase
        .from('gallery_items')
        .insert({
          user_id: user.id,
          file_url: urlData.publicUrl,
          file_type: fileType,
          file_name: file.name,
          analysis_status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return data as GalleryItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gallery'] });
    },
  });

  const analyzeMutation = useMutation({
    mutationFn: async (item: GalleryItem) => {
      if (!user) throw new Error('Not authenticated');

      // Update status to processing
      await supabase
        .from('gallery_items')
        .update({ analysis_status: 'processing' })
        .eq('id', item.id);

      // For images, analyze directly
      if (item.file_type === 'image') {
        // Fetch image and convert to base64
        const response = await fetch(item.file_url);
        const blob = await response.blob();
        const base64 = await blobToBase64(blob);

        // Call analyze function
        const { data, error } = await supabase.functions.invoke('analyze-crowd', {
          body: { image: base64 },
        });

        if (error) throw error;

        // Calculate density
        const densityLevel = data.peopleCount <= 10 
          ? 'low' 
          : data.peopleCount <= 30 
            ? 'medium' 
            : 'high';

        // Calculate avg confidence
        const confidenceAvg = data.detectedPersons.length > 0
          ? data.detectedPersons.reduce((acc: number, p: any) => acc + p.confidence, 0) / data.detectedPersons.length
          : 0;

        // Update gallery item
        const { data: updated, error: updateError } = await supabase
          .from('gallery_items')
          .update({
            analysis_status: 'completed',
            people_count: data.peopleCount,
            density_level: densityLevel,
            detected_persons: data.detectedPersons,
            confidence_avg: Math.round(confidenceAvg * 100) / 100,
          })
          .eq('id', item.id)
          .select()
          .single();

        if (updateError) throw updateError;
        return updated as GalleryItem;
      } else {
        // For videos, we'd need frame extraction - mark as completed with 0 for now
        const { data: updated, error: updateError } = await supabase
          .from('gallery_items')
          .update({
            analysis_status: 'completed',
            people_count: 0,
            density_level: 'low',
          })
          .eq('id', item.id)
          .select()
          .single();

        if (updateError) throw updateError;
        return updated as GalleryItem;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gallery'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (item: GalleryItem) => {
      if (!user) throw new Error('Not authenticated');

      // Delete from storage
      const fileName = item.file_url.split('/').pop();
      if (fileName) {
        await supabase.storage
          .from('gallery')
          .remove([`${user.id}/${fileName}`]);
      }

      // Delete from database
      const { error } = await supabase
        .from('gallery_items')
        .delete()
        .eq('id', item.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gallery'] });
    },
  });

  return {
    items,
    isLoading,
    upload: uploadMutation.mutateAsync,
    isUploading: uploadMutation.isPending,
    analyze: analyzeMutation.mutateAsync,
    isAnalyzing: analyzeMutation.isPending,
    deleteItem: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

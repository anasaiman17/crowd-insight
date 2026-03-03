import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DetectionResult {
  peopleCount: number;
  densityLevel: 'low' | 'medium' | 'high';
  detectedPersons: Array<{
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    confidence: number;
  }>;
  processingTime: number;
  confidenceAvg: number;
}

// Resize image to reduce payload size for faster processing
function resizeImage(dataUrl: string, maxWidth = 1024, maxHeight = 1024, quality = 0.7): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(dataUrl); // fallback to original
    img.src = dataUrl;
  });
}

export function useAIDetection() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeImage = async (imageBase64: string): Promise<DetectionResult | null> => {
    setIsProcessing(true);
    setError(null);

    try {
      const startTime = Date.now();

      // Compress image for faster upload and processing
      const compressedImage = await resizeImage(imageBase64);
      
      const { data, error: fnError } = await supabase.functions.invoke('analyze-crowd', {
        body: { image: compressedImage },
      });

      if (fnError) {
        throw new Error(fnError.message || 'Edge function failed');
      }

      if (!data || typeof data.peopleCount === 'undefined') {
        throw new Error('Invalid response from analysis');
      }

      const processingTime = Date.now() - startTime;
      const persons = Array.isArray(data.detectedPersons) ? data.detectedPersons : [];

      const densityLevel = data.peopleCount <= 10 
        ? 'low' 
        : data.peopleCount <= 30 
          ? 'medium' 
          : 'high';

      const confidenceAvg = persons.length > 0
        ? persons.reduce((acc: number, p: any) => acc + (p.confidence || 0), 0) / persons.length
        : 0;

      return {
        peopleCount: data.peopleCount,
        densityLevel,
        detectedPersons: persons,
        processingTime,
        confidenceAvg,
      };
    } catch (err: any) {
      console.error('AI Detection error:', err);
      setError(err.message || 'Failed to analyze image');
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    analyzeImage,
    isProcessing,
    error,
  };
}

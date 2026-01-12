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

export function useAIDetection() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeImage = async (imageBase64: string): Promise<DetectionResult | null> => {
    setIsProcessing(true);
    setError(null);

    try {
      const startTime = Date.now();
      
      // Call the AI detection edge function
      const { data, error: fnError } = await supabase.functions.invoke('analyze-crowd', {
        body: { image: imageBase64 },
      });

      if (fnError) throw fnError;

      const processingTime = Date.now() - startTime;

      // Calculate density level based on count
      const densityLevel = data.peopleCount <= 10 
        ? 'low' 
        : data.peopleCount <= 30 
          ? 'medium' 
          : 'high';

      // Calculate average confidence
      const confidenceAvg = data.detectedPersons.length > 0
        ? data.detectedPersons.reduce((acc: number, p: any) => acc + p.confidence, 0) / data.detectedPersons.length
        : 0;

      return {
        peopleCount: data.peopleCount,
        densityLevel,
        detectedPersons: data.detectedPersons,
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

export type DensityLevel = 'low' | 'medium' | 'high';

export interface DetectedPerson {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
}

export interface CrowdAnalysis {
  id: string;
  timestamp: Date;
  peopleCount: number;
  densityLevel: DensityLevel;
  detectedPersons: DetectedPerson[];
  imageUrl?: string;
  processedImageUrl?: string;
}

export interface AnalyticsData {
  hour: string;
  count: number;
  density: DensityLevel;
}

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
  name: string;
  createdAt: Date;
}

export interface DashboardStats {
  currentCount: number;
  averageCount: number;
  peakCount: number;
  currentDensity: DensityLevel;
  totalAnalyses: number;
  lastUpdated: Date;
}

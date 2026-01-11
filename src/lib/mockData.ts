import { CrowdAnalysis, AnalyticsData, DashboardStats, DensityLevel, DetectedPerson } from '@/types/crowd';

export const getDensityLevel = (count: number): DensityLevel => {
  if (count <= 10) return 'low';
  if (count <= 30) return 'medium';
  return 'high';
};

export const generateMockDetections = (count: number): DetectedPerson[] => {
  const detections: DetectedPerson[] = [];
  for (let i = 0; i < count; i++) {
    detections.push({
      id: `person-${i}`,
      x: Math.random() * 80 + 10,
      y: Math.random() * 70 + 15,
      width: 8 + Math.random() * 4,
      height: 15 + Math.random() * 5,
      confidence: 0.85 + Math.random() * 0.14,
    });
  }
  return detections;
};

export const generateHourlyData = (): AnalyticsData[] => {
  const data: AnalyticsData[] = [];
  const hours = ['6AM', '8AM', '10AM', '12PM', '2PM', '4PM', '6PM', '8PM', '10PM'];
  
  hours.forEach((hour) => {
    const count = Math.floor(Math.random() * 50) + 5;
    data.push({
      hour,
      count,
      density: getDensityLevel(count),
    });
  });
  
  return data;
};

export const generateDailyData = (): AnalyticsData[] => {
  const data: AnalyticsData[] = [];
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  days.forEach((hour) => {
    const count = Math.floor(Math.random() * 60) + 10;
    data.push({
      hour,
      count,
      density: getDensityLevel(count),
    });
  });
  
  return data;
};

export const mockDashboardStats: DashboardStats = {
  currentCount: 24,
  averageCount: 18,
  peakCount: 47,
  currentDensity: 'medium',
  totalAnalyses: 156,
  lastUpdated: new Date(),
};

export const mockRecentAnalyses: CrowdAnalysis[] = [
  {
    id: '1',
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    peopleCount: 24,
    densityLevel: 'medium',
    detectedPersons: generateMockDetections(24),
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    peopleCount: 8,
    densityLevel: 'low',
    detectedPersons: generateMockDetections(8),
  },
  {
    id: '3',
    timestamp: new Date(Date.now() - 1000 * 60 * 60),
    peopleCount: 42,
    densityLevel: 'high',
    detectedPersons: generateMockDetections(42),
  },
];

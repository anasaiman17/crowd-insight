import React, { useState } from 'react';
import { Scan, Download, RefreshCw } from 'lucide-react';
import UploadZone from '@/components/UploadZone';
import DetectionCanvas from '@/components/DetectionCanvas';
import StatCard from '@/components/StatCard';
import DensityBadge from '@/components/DensityBadge';
import { Button } from '@/components/ui/button';
import { CrowdAnalysis } from '@/types/crowd';
import { generateMockDetections, getDensityLevel } from '@/lib/mockData';
import { useToast } from '@/hooks/use-toast';
import { Users, Activity, AlertTriangle } from 'lucide-react';

const Analyze: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<CrowdAnalysis | null>(null);
  const { toast } = useToast();

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Video Processing',
        description: 'Video analysis coming soon. Please upload an image for now.',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    setAnalysis(null);

    // Read the file and create a preview
    const reader = new FileReader();
    reader.onload = async (e) => {
      const imageUrl = e.target?.result as string;
      setUploadedImage(imageUrl);

      // Simulate AI processing delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Generate mock detection results
      const peopleCount = Math.floor(Math.random() * 40) + 5;
      const detections = generateMockDetections(peopleCount);

      const result: CrowdAnalysis = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        peopleCount,
        densityLevel: getDensityLevel(peopleCount),
        detectedPersons: detections,
        imageUrl,
      };

      setAnalysis(result);
      setIsProcessing(false);

      toast({
        title: 'Analysis Complete',
        description: `Detected ${peopleCount} people in the image.`,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleReset = () => {
    setUploadedImage(null);
    setAnalysis(null);
  };

  const handleDownloadReport = () => {
    if (!analysis) return;

    const report = {
      analysisId: analysis.id,
      timestamp: analysis.timestamp.toISOString(),
      peopleCount: analysis.peopleCount,
      densityLevel: analysis.densityLevel,
      detectedPersons: analysis.detectedPersons.length,
      averageConfidence:
        analysis.detectedPersons.reduce((acc, p) => acc + p.confidence, 0) /
        analysis.detectedPersons.length,
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crowd-analysis-${analysis.id}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Report Downloaded',
      description: 'Analysis report has been saved to your device.',
    });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Upload & Analyze</h1>
          <p className="text-muted-foreground mt-1">
            Upload images or videos for AI-powered crowd analysis
          </p>
        </div>
        {analysis && (
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleReset}>
              <RefreshCw className="h-4 w-4 mr-2" />
              New Analysis
            </Button>
            <Button onClick={handleDownloadReport}>
              <Download className="h-4 w-4 mr-2" />
              Download Report
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Upload Section */}
        <div className="space-y-6">
          <UploadZone onFileSelect={handleFileSelect} isProcessing={isProcessing} />

          {isProcessing && (
            <div className="glass-card p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Scan className="h-6 w-6 text-primary animate-pulse" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Processing Image</h3>
                  <p className="text-sm text-muted-foreground">
                    Running AI detection model...
                  </p>
                </div>
              </div>
              <div className="mt-4 h-2 rounded-full bg-secondary overflow-hidden">
                <div className="h-full bg-primary animate-pulse w-2/3 rounded-full" />
              </div>
            </div>
          )}

          {/* Analysis Results */}
          {analysis && (
            <div className="space-y-4">
              <div className="grid gap-4 grid-cols-3">
                <StatCard
                  title="People Count"
                  value={analysis.peopleCount}
                  icon={Users}
                  variant={
                    analysis.densityLevel === 'low'
                      ? 'success'
                      : analysis.densityLevel === 'medium'
                      ? 'warning'
                      : 'danger'
                  }
                />
                <StatCard
                  title="Avg Confidence"
                  value={`${Math.round(
                    (analysis.detectedPersons.reduce((a, p) => a + p.confidence, 0) /
                      analysis.detectedPersons.length) *
                      100
                  )}%`}
                  icon={Activity}
                />
                <StatCard
                  title="Detections"
                  value={analysis.detectedPersons.length}
                  icon={AlertTriangle}
                />
              </div>

              <div className="glass-card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Density Classification</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Based on detected people count
                    </p>
                  </div>
                  <DensityBadge level={analysis.densityLevel} className="text-lg px-6 py-2" />
                </div>

                <div className="mt-4 p-4 rounded-lg bg-secondary/30">
                  <div className="grid grid-cols-3 gap-4 text-center text-sm">
                    <div>
                      <p className="text-success font-medium">Low</p>
                      <p className="text-muted-foreground">0-10 people</p>
                    </div>
                    <div>
                      <p className="text-warning font-medium">Medium</p>
                      <p className="text-muted-foreground">11-30 people</p>
                    </div>
                    <div>
                      <p className="text-destructive font-medium">High</p>
                      <p className="text-muted-foreground">30+ people</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Detection Preview */}
        <div>
          {uploadedImage && analysis ? (
            <DetectionCanvas
              imageUrl={uploadedImage}
              detections={analysis.detectedPersons}
              className="h-[500px]"
            />
          ) : (
            <div className="glass-card h-[500px] flex items-center justify-center">
              <div className="text-center">
                <div className="h-20 w-20 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-4">
                  <Scan className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Detection Preview</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Upload an image to see AI-powered human detection with bounding boxes
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analyze;

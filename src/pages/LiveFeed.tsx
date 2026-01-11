import React, { useState, useEffect } from 'react';
import { Camera, Wifi, WifiOff, RefreshCw, Users, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StatCard from '@/components/StatCard';
import DensityBadge from '@/components/DensityBadge';
import { generateMockDetections, getDensityLevel } from '@/lib/mockData';
import { DetectedPerson, DensityLevel } from '@/types/crowd';

interface FeedData {
  isConnected: boolean;
  peopleCount: number;
  density: DensityLevel;
  detections: DetectedPerson[];
  fps: number;
  latency: number;
}

const LiveFeed: React.FC = () => {
  const [feedData, setFeedData] = useState<FeedData>({
    isConnected: false,
    peopleCount: 0,
    density: 'low',
    detections: [],
    fps: 0,
    latency: 0,
  });

  const [isConnecting, setIsConnecting] = useState(false);

  const connectFeed = async () => {
    setIsConnecting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    setFeedData((prev) => ({
      ...prev,
      isConnected: true,
      fps: 24,
      latency: 45,
    }));
    setIsConnecting(false);
  };

  const disconnectFeed = () => {
    setFeedData({
      isConnected: false,
      peopleCount: 0,
      density: 'low',
      detections: [],
      fps: 0,
      latency: 0,
    });
  };

  // Simulate live updates when connected
  useEffect(() => {
    if (!feedData.isConnected) return;

    const interval = setInterval(() => {
      const newCount = Math.floor(Math.random() * 35) + 5;
      const newDetections = generateMockDetections(newCount);
      
      setFeedData((prev) => ({
        ...prev,
        peopleCount: newCount,
        density: getDensityLevel(newCount),
        detections: newDetections,
        fps: 22 + Math.floor(Math.random() * 6),
        latency: 30 + Math.floor(Math.random() * 40),
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, [feedData.isConnected]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Live Feed</h1>
          <p className="text-muted-foreground mt-1">
            Real-time camera feed with AI detection
          </p>
        </div>
        <div className="flex items-center gap-3">
          {feedData.isConnected ? (
            <>
              <div className="flex items-center gap-2">
                <Wifi className="h-5 w-5 text-success" />
                <span className="text-sm text-success font-medium">Connected</span>
              </div>
              <Button variant="destructive" onClick={disconnectFeed}>
                Disconnect
              </Button>
            </>
          ) : (
            <Button onClick={connectFeed} disabled={isConnecting}>
              {isConnecting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Camera className="h-4 w-4 mr-2" />
                  Connect Camera
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Stats when connected */}
      {feedData.isConnected && (
        <div className="grid gap-6 md:grid-cols-4">
          <StatCard
            title="Live Count"
            value={feedData.peopleCount}
            icon={Users}
            variant={
              feedData.density === 'low'
                ? 'success'
                : feedData.density === 'medium'
                ? 'warning'
                : 'danger'
            }
          />
          <div className="glass-card p-6">
            <p className="text-sm font-medium text-muted-foreground">Density</p>
            <div className="mt-3">
              <DensityBadge level={feedData.density} />
            </div>
          </div>
          <div className="glass-card p-6">
            <p className="text-sm font-medium text-muted-foreground">Frame Rate</p>
            <p className="mt-2 text-3xl font-bold">{feedData.fps} FPS</p>
          </div>
          <div className="glass-card p-6">
            <p className="text-sm font-medium text-muted-foreground">Latency</p>
            <p className="mt-2 text-3xl font-bold">{feedData.latency}ms</p>
          </div>
        </div>
      )}

      {/* Live Feed Display */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="glass-card overflow-hidden">
            <div className="relative aspect-video bg-gradient-card">
              {feedData.isConnected ? (
                <>
                  {/* Simulated feed background */}
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-secondary/50 to-background" />
                  
                  {/* Grid overlay */}
                  <div
                    className="absolute inset-0 opacity-20"
                    style={{
                      backgroundImage:
                        'linear-gradient(hsl(var(--primary) / 0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary) / 0.3) 1px, transparent 1px)',
                      backgroundSize: '50px 50px',
                    }}
                  />

                  {/* Detection boxes */}
                  <svg
                    className="absolute inset-0 w-full h-full"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                  >
                    {feedData.detections.map((person) => (
                      <g key={person.id}>
                        <rect
                          x={person.x}
                          y={person.y}
                          width={person.width}
                          height={person.height}
                          fill="none"
                          stroke="hsl(142, 76%, 36%)"
                          strokeWidth="0.3"
                          className="animate-pulse"
                        />
                        <rect
                          x={person.x}
                          y={person.y - 2.5}
                          width={person.width}
                          height="2.5"
                          fill="hsl(142, 76%, 36%)"
                          opacity="0.9"
                        />
                        <text
                          x={person.x + person.width / 2}
                          y={person.y - 0.6}
                          fontSize="1.5"
                          fill="white"
                          textAnchor="middle"
                          fontWeight="600"
                        >
                          {Math.round(person.confidence * 100)}%
                        </text>
                      </g>
                    ))}
                  </svg>

                  {/* Live indicator */}
                  <div className="absolute top-4 left-4 flex items-center gap-2 glass-card px-3 py-1.5">
                    <div className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
                    <span className="text-xs font-medium">LIVE</span>
                  </div>

                  {/* Detection count */}
                  <div className="absolute top-4 right-4 glass-card px-3 py-1.5">
                    <span className="text-sm font-medium text-success">
                      {feedData.peopleCount} detected
                    </span>
                  </div>

                  {/* Scanning effect */}
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute inset-x-0 h-0.5 bg-gradient-to-b from-primary/60 to-transparent animate-scan" />
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="h-20 w-20 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-4">
                      <WifiOff className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No Feed Connected</h3>
                    <p className="text-sm text-muted-foreground max-w-xs">
                      Click "Connect Camera" to start the live detection feed
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Side Panel */}
        <div className="space-y-6">
          <div className="glass-card p-6">
            <h3 className="font-semibold mb-4">Camera Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Source</span>
                <span className="text-sm font-medium">Camera 1 - Main Entrance</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Resolution</span>
                <span className="text-sm font-medium">1920 x 1080</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Model</span>
                <span className="text-sm font-medium">YOLOv8</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Confidence</span>
                <span className="text-sm font-medium">85%</span>
              </div>
            </div>
          </div>

          {feedData.isConnected && (
            <div className="glass-card p-6">
              <h3 className="font-semibold mb-4">Alert Status</h3>
              <div
                className={`p-4 rounded-lg ${
                  feedData.density === 'high'
                    ? 'bg-destructive/20 border border-destructive/30'
                    : feedData.density === 'medium'
                    ? 'bg-warning/20 border border-warning/30'
                    : 'bg-success/20 border border-success/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <AlertCircle
                    className={`h-5 w-5 ${
                      feedData.density === 'high'
                        ? 'text-destructive'
                        : feedData.density === 'medium'
                        ? 'text-warning'
                        : 'text-success'
                    }`}
                  />
                  <div>
                    <p className="font-medium">
                      {feedData.density === 'high'
                        ? 'High Density Alert'
                        : feedData.density === 'medium'
                        ? 'Moderate Crowd'
                        : 'Normal Levels'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {feedData.density === 'high'
                        ? 'Crowd control recommended'
                        : feedData.density === 'medium'
                        ? 'Monitor closely'
                        : 'No action needed'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="glass-card p-6">
            <h3 className="font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start" disabled={!feedData.isConnected}>
                <Camera className="h-4 w-4 mr-2" />
                Capture Snapshot
              </Button>
              <Button variant="outline" className="w-full justify-start" disabled={!feedData.isConnected}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset Detection
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveFeed;

import React, { useState, useEffect, useMemo } from 'react';
import { Camera, Plus, Wifi, WifiOff, Users, Settings, Trash2, Edit2, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import DensityBadge from './DensityBadge';
import { useCameras, Camera as CameraType } from '@/hooks/useCameras';
import { generateMockDetections, getDensityLevel } from '@/lib/mockData';
import { useToast } from '@/hooks/use-toast';

interface SimulatedDetection {
  id: string;
  confidence: number;
}

interface CameraFeed {
  cameraId: string;
  isConnected: boolean;
  peopleCount: number;
  density: 'low' | 'medium' | 'high';
  fps: number;
  detections: SimulatedDetection[];
}

const CameraGrid: React.FC = () => {
  const { cameras, loading, addCamera, updateCamera, deleteCamera } = useCameras();
  const [feeds, setFeeds] = useState<Record<string, CameraFeed>>({});
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newCamera, setNewCamera] = useState({ name: '', location: '', stream_url: '' });
  const [editingCamera, setEditingCamera] = useState<CameraType | null>(null);
  const [globalConfidenceThreshold, setGlobalConfidenceThreshold] = useState(0);
  const { toast } = useToast();

  // Generate random detections with varying confidence
  const generateSimulatedDetections = (count: number): SimulatedDetection[] => {
    return Array.from({ length: count }, (_, i) => ({
      id: `det-${i}`,
      confidence: 0.4 + Math.random() * 0.6, // 40% to 100%
    }));
  };

  // Simulate live feeds for connected cameras
  useEffect(() => {
    const interval = setInterval(() => {
      setFeeds(prev => {
        const updated = { ...prev };
        cameras.forEach(camera => {
          if (camera.is_active && updated[camera.id]?.isConnected) {
            const count = Math.floor(Math.random() * 35) + 5;
            const detections = generateSimulatedDetections(count);
            updated[camera.id] = {
              ...updated[camera.id],
              peopleCount: count,
              density: getDensityLevel(count),
              fps: 22 + Math.floor(Math.random() * 6),
              detections,
            };
          }
        });
        return updated;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [cameras]);

  const toggleConnection = (cameraId: string) => {
    setFeeds(prev => {
      const current = prev[cameraId];
      if (current?.isConnected) {
        return {
          ...prev,
          [cameraId]: { ...current, isConnected: false, peopleCount: 0, density: 'low', fps: 0, detections: [] },
        };
      } else {
        const count = Math.floor(Math.random() * 35) + 5;
        const detections = generateSimulatedDetections(count);
        return {
          ...prev,
          [cameraId]: {
            cameraId,
            isConnected: true,
            peopleCount: count,
            density: getDensityLevel(count),
            fps: 24,
            detections,
          },
        };
      }
    });
  };

  const handleAddCamera = async () => {
    if (!newCamera.name) {
      toast({ title: 'Error', description: 'Camera name is required', variant: 'destructive' });
      return;
    }

    const { error } = await addCamera({
      name: newCamera.name,
      location: newCamera.location || null,
      stream_url: newCamera.stream_url || null,
      is_active: true,
      grid_position: cameras.length,
    });

    if (error) {
      toast({ title: 'Error', description: 'Failed to add camera', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Camera added successfully' });
      setNewCamera({ name: '', location: '', stream_url: '' });
      setIsAddDialogOpen(false);
    }
  };

  const handleDeleteCamera = async (id: string) => {
    const { error } = await deleteCamera(id);
    if (error) {
      toast({ title: 'Error', description: 'Failed to delete camera', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Camera deleted' });
    }
  };

  const getGridCols = () => {
    const count = cameras.length;
    if (count <= 1) return 'grid-cols-1';
    if (count <= 2) return 'grid-cols-1 lg:grid-cols-2';
    if (count <= 4) return 'grid-cols-1 md:grid-cols-2';
    return 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-semibold">Camera Grid</h2>
          <p className="text-sm text-muted-foreground">
            {cameras.length} camera{cameras.length !== 1 ? 's' : ''} configured
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Confidence Filter Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filter: {Math.round(globalConfidenceThreshold * 100)}%
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72" align="end">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Confidence Threshold</span>
                  <span className="text-sm font-semibold text-primary">
                    {Math.round(globalConfidenceThreshold * 100)}%
                  </span>
                </div>
                <Slider
                  value={[globalConfidenceThreshold * 100]}
                  onValueChange={([val]) => setGlobalConfidenceThreshold(val / 100)}
                  min={0}
                  max={100}
                  step={5}
                />
                <p className="text-xs text-muted-foreground">
                  Hide detections below this confidence level across all camera feeds
                </p>
              </div>
            </PopoverContent>
          </Popover>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Camera
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Camera</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <label className="text-sm font-medium">Camera Name *</label>
                  <Input
                    placeholder="e.g., Main Entrance"
                    value={newCamera.name}
                    onChange={(e) => setNewCamera(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Location</label>
                  <Input
                    placeholder="e.g., Building A, Floor 1"
                    value={newCamera.location}
                    onChange={(e) => setNewCamera(prev => ({ ...prev, location: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Stream URL (optional)</label>
                  <Input
                    placeholder="rtsp://..."
                    value={newCamera.stream_url}
                    onChange={(e) => setNewCamera(prev => ({ ...prev, stream_url: e.target.value }))}
                  />
                </div>
                <Button onClick={handleAddCamera} className="w-full">
                  Add Camera
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Camera Grid */}
      {cameras.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Camera className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Cameras Configured</h3>
          <p className="text-muted-foreground mb-6">Add your first camera to start monitoring</p>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Camera
          </Button>
        </div>
      ) : (
        <div className={`grid gap-6 ${getGridCols()}`}>
          {cameras.map((camera) => {
            const feed = feeds[camera.id];
            const isConnected = feed?.isConnected || false;
            
            // Calculate filtered count based on confidence threshold
            const filteredDetections = feed?.detections?.filter(d => d.confidence >= globalConfidenceThreshold) || [];
            const filteredCount = filteredDetections.length;
            const totalCount = feed?.detections?.length || 0;

            return (
              <div key={camera.id} className="glass-card overflow-hidden">
                {/* Camera Header */}
                <div className="flex items-center justify-between p-4 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                      isConnected ? 'bg-success/20' : 'bg-secondary'
                    }`}>
                      <Camera className={`h-5 w-5 ${isConnected ? 'text-success' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <h3 className="font-medium">{camera.name}</h3>
                      <p className="text-xs text-muted-foreground">{camera.location || 'No location'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteCamera(camera.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                    <Button
                      variant={isConnected ? 'destructive' : 'default'}
                      size="sm"
                      onClick={() => toggleConnection(camera.id)}
                    >
                      {isConnected ? (
                        <>
                          <WifiOff className="h-4 w-4 mr-1" />
                          Disconnect
                        </>
                      ) : (
                        <>
                          <Wifi className="h-4 w-4 mr-1" />
                          Connect
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Camera Feed */}
                <div className="relative aspect-video bg-gradient-card">
                  {isConnected ? (
                    <>
                      {/* Simulated feed */}
                      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-secondary/50 to-background" />
                      
                      {/* Grid overlay */}
                      <div
                        className="absolute inset-0 opacity-10"
                        style={{
                          backgroundImage:
                            'linear-gradient(hsl(var(--primary) / 0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary) / 0.3) 1px, transparent 1px)',
                          backgroundSize: '30px 30px',
                        }}
                      />

                      {/* Scanning effect */}
                      <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute inset-x-0 h-0.5 bg-gradient-to-b from-primary/60 to-transparent animate-scan" />
                      </div>

                      {/* Live indicator */}
                      <div className="absolute top-3 left-3 flex items-center gap-2 glass-card px-2 py-1">
                        <div className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
                        <span className="text-xs font-medium">LIVE</span>
                      </div>

                      {/* Stats overlay with filtered count */}
                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                        <div className="flex items-center gap-2 glass-card px-3 py-1.5">
                          <Users className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium">
                            {filteredCount}
                            {globalConfidenceThreshold > 0 && totalCount !== filteredCount && (
                              <span className="text-muted-foreground text-xs ml-1">/{totalCount}</span>
                            )}
                          </span>
                        </div>
                        <DensityBadge level={getDensityLevel(filteredCount)} />
                      </div>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <WifiOff className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Disconnected</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Camera Stats */}
                {isConnected && (
                  <div className="grid grid-cols-4 divide-x divide-border border-t border-border">
                    <div className="p-3 text-center">
                      <p className="text-xs text-muted-foreground">Filtered</p>
                      <p className="text-lg font-semibold text-primary">{filteredCount}</p>
                    </div>
                    <div className="p-3 text-center">
                      <p className="text-xs text-muted-foreground">Total</p>
                      <p className="text-lg font-semibold">{totalCount}</p>
                    </div>
                    <div className="p-3 text-center">
                      <p className="text-xs text-muted-foreground">Density</p>
                      <p className="text-lg font-semibold capitalize">{getDensityLevel(filteredCount)}</p>
                    </div>
                    <div className="p-3 text-center">
                      <p className="text-xs text-muted-foreground">FPS</p>
                      <p className="text-lg font-semibold">{feed?.fps || 0}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CameraGrid;

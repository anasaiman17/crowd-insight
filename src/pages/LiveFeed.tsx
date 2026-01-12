import React from 'react';
import CameraGrid from '@/components/CameraGrid';

const LiveFeed: React.FC = () => {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Live Cameras</h1>
        <p className="text-muted-foreground mt-1">
          Monitor multiple camera feeds with real-time AI detection
        </p>
      </div>

      {/* Camera Grid */}
      <CameraGrid />
    </div>
  );
};

export default LiveFeed;

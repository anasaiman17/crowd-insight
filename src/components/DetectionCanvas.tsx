import React, { useState, useMemo, useRef, useEffect } from 'react';
import { DetectedPerson } from '@/types/crowd';
import { Layers, Grid3X3, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import ConfidenceFilter from './ConfidenceFilter';
import HeatmapOverlay from './HeatmapOverlay';

interface DetectionCanvasProps {
  imageUrl: string;
  detections: DetectedPerson[];
  className?: string;
  showFilter?: boolean;
}

const DetectionCanvas: React.FC<DetectionCanvasProps> = ({
  imageUrl,
  detections,
  className,
  showFilter = true,
}) => {
  const [confidenceThreshold, setConfidenceThreshold] = useState(0);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showBoxes, setShowBoxes] = useState(true);
  const [heatmapOpacity, setHeatmapOpacity] = useState(0.6);
  const [heatmapRadius, setHeatmapRadius] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 500, height: 400 });

  const filteredDetections = useMemo(() => {
    return detections.filter(person => person.confidence >= confidenceThreshold);
  }, [detections, confidenceThreshold]);

  // Update dimensions when container size changes
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Color based on confidence level
  const getBoxColor = (confidence: number) => {
    if (confidence >= 0.8) return 'hsl(142, 76%, 36%)'; // Green - high confidence
    if (confidence >= 0.6) return 'hsl(48, 96%, 53%)';  // Yellow - medium confidence
    return 'hsl(0, 84%, 60%)'; // Red - low confidence
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Controls Row */}
      <div className="flex items-center gap-2 flex-wrap">
        {showFilter && (
          <div className="flex-1 min-w-[200px]">
            <ConfidenceFilter
              value={confidenceThreshold}
              onChange={setConfidenceThreshold}
              totalCount={detections.length}
              filteredCount={filteredDetections.length}
            />
          </div>
        )}
        
        {/* View Controls */}
        <div className="glass-card p-3 flex items-center gap-2">
          <Button
            variant={showBoxes ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowBoxes(!showBoxes)}
            className="gap-1.5"
          >
            <Grid3X3 className="h-4 w-4" />
            Boxes
          </Button>
          
          <Button
            variant={showHeatmap ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowHeatmap(!showHeatmap)}
            className="gap-1.5"
          >
            <Layers className="h-4 w-4" />
            Heatmap
          </Button>

          {showHeatmap && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Eye className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64" align="end">
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Opacity</span>
                      <span className="text-sm text-muted-foreground">{Math.round(heatmapOpacity * 100)}%</span>
                    </div>
                    <Slider
                      value={[heatmapOpacity * 100]}
                      onValueChange={([val]) => setHeatmapOpacity(val / 100)}
                      min={10}
                      max={100}
                      step={5}
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Spread</span>
                      <span className="text-sm text-muted-foreground">{heatmapRadius}px</span>
                    </div>
                    <Slider
                      value={[heatmapRadius]}
                      onValueChange={([val]) => setHeatmapRadius(val)}
                      min={20}
                      max={100}
                      step={5}
                    />
                  </div>
                  
                  {/* Heatmap Legend */}
                  <div className="pt-2 border-t border-border">
                    <p className="text-xs font-medium mb-2">Density Legend</p>
                    <div className="h-4 rounded-full overflow-hidden" style={{
                      background: 'linear-gradient(to right, #0000ff, #00ffff, #00ff00, #ffff00, #ff0000)'
                    }} />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Low</span>
                      <span>Medium</span>
                      <span>High</span>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>

      <div ref={containerRef} className="relative overflow-hidden rounded-xl">
        <img
          src={imageUrl}
          alt="Crowd analysis"
          className="w-full h-full object-cover"
          onLoad={() => {
            if (containerRef.current) {
              const rect = containerRef.current.getBoundingClientRect();
              setDimensions({ width: rect.width, height: rect.height });
            }
          }}
        />

        {/* Heatmap overlay */}
        {showHeatmap && (
          <HeatmapOverlay
            detections={filteredDetections}
            width={dimensions.width}
            height={dimensions.height}
            opacity={heatmapOpacity}
            radius={heatmapRadius}
          />
        )}
        
        {/* Bounding boxes overlay */}
        {showBoxes && filteredDetections.length > 0 && (
          <div className="absolute inset-0 pointer-events-none">
            {filteredDetections.map((person) => {
              const boxColor = getBoxColor(person.confidence);
              return (
                <div
                  key={person.id}
                  className="absolute animate-pulse"
                  style={{
                    left: `${person.x}%`,
                    top: `${person.y}%`,
                    width: `${person.width}%`,
                    height: `${person.height}%`,
                    border: `3px solid ${boxColor}`,
                    borderRadius: '4px',
                    boxShadow: `0 0 10px ${boxColor}, inset 0 0 10px ${boxColor}40`,
                  }}
                >
                  {/* Confidence label */}
                  <div
                    className="absolute -top-6 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded text-xs font-bold text-white whitespace-nowrap"
                    style={{ backgroundColor: boxColor }}
                  >
                    {Math.round(person.confidence * 100)}%
                  </div>
                  {/* Corner markers */}
                  <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2" style={{ borderColor: boxColor }} />
                  <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2" style={{ borderColor: boxColor }} />
                  <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2" style={{ borderColor: boxColor }} />
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2" style={{ borderColor: boxColor }} />
                </div>
              );
            })}
          </div>
        )}

        {/* Scanning effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-x-0 h-1 bg-gradient-to-b from-primary/40 to-transparent animate-scan" />
        </div>

        {/* Detection count overlay */}
        <div className="absolute top-4 left-4 glass-card px-4 py-2">
          <span className="text-sm font-medium text-success">
            {filteredDetections.length} persons detected
            {confidenceThreshold > 0 && (
              <span className="text-muted-foreground"> (≥{Math.round(confidenceThreshold * 100)}%)</span>
            )}
          </span>
        </div>

        {/* Heatmap indicator */}
        {showHeatmap && (
          <div className="absolute top-4 right-4 glass-card px-3 py-1.5 flex items-center gap-2">
            <div className="w-12 h-2 rounded-full" style={{
              background: 'linear-gradient(to right, #0000ff, #00ffff, #00ff00, #ffff00, #ff0000)'
            }} />
            <span className="text-xs text-muted-foreground">Density</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default DetectionCanvas;

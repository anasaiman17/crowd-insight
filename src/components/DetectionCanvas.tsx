import React, { useState, useMemo } from 'react';
import { DetectedPerson } from '@/types/crowd';
import ConfidenceFilter from './ConfidenceFilter';

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

  const filteredDetections = useMemo(() => {
    return detections.filter(person => person.confidence >= confidenceThreshold);
  }, [detections, confidenceThreshold]);

  // Color based on confidence level
  const getBoxColor = (confidence: number) => {
    if (confidence >= 0.8) return 'hsl(142, 76%, 36%)'; // Green - high confidence
    if (confidence >= 0.6) return 'hsl(48, 96%, 53%)';  // Yellow - medium confidence
    return 'hsl(0, 84%, 60%)'; // Red - low confidence
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {showFilter && (
        <ConfidenceFilter
          value={confidenceThreshold}
          onChange={setConfidenceThreshold}
          totalCount={detections.length}
          filteredCount={filteredDetections.length}
        />
      )}

      <div className="relative overflow-hidden rounded-xl">
        <img
          src={imageUrl}
          alt="Crowd analysis"
          className="w-full h-full object-cover"
        />
        
        {/* Bounding boxes overlay */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {filteredDetections.map((person) => {
            const boxColor = getBoxColor(person.confidence);
            return (
              <g key={person.id}>
                {/* Bounding box */}
                <rect
                  x={person.x}
                  y={person.y}
                  width={person.width}
                  height={person.height}
                  fill="none"
                  stroke={boxColor}
                  strokeWidth="0.3"
                  className="animate-pulse"
                />
                {/* Confidence label background */}
                <rect
                  x={person.x}
                  y={person.y - 3}
                  width={person.width}
                  height="3"
                  fill={boxColor}
                  opacity="0.9"
                />
                {/* Confidence text */}
                <text
                  x={person.x + person.width / 2}
                  y={person.y - 0.8}
                  fontSize="2"
                  fill="white"
                  textAnchor="middle"
                  fontWeight="600"
                >
                  {Math.round(person.confidence * 100)}%
                </text>
              </g>
            );
          })}
        </svg>

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
      </div>
    </div>
  );
};

export default DetectionCanvas;

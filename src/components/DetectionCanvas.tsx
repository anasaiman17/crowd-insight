import React from 'react';
import { DetectedPerson } from '@/types/crowd';

interface DetectionCanvasProps {
  imageUrl: string;
  detections: DetectedPerson[];
  className?: string;
}

const DetectionCanvas: React.FC<DetectionCanvasProps> = ({
  imageUrl,
  detections,
  className,
}) => {
  return (
    <div className={`relative overflow-hidden rounded-xl ${className}`}>
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
        {detections.map((person) => (
          <g key={person.id}>
            {/* Bounding box */}
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
            {/* Confidence label background */}
            <rect
              x={person.x}
              y={person.y - 3}
              width={person.width}
              height="3"
              fill="hsl(142, 76%, 36%)"
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
        ))}
      </svg>

      {/* Scanning effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-x-0 h-1 bg-gradient-to-b from-primary/40 to-transparent animate-scan" />
      </div>

      {/* Detection count overlay */}
      <div className="absolute top-4 left-4 glass-card px-4 py-2">
        <span className="text-sm font-medium text-success">
          {detections.length} persons detected
        </span>
      </div>
    </div>
  );
};

export default DetectionCanvas;

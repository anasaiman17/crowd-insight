import React, { useRef, useEffect } from 'react';
import { DetectedPerson } from '@/types/crowd';

interface HeatmapOverlayProps {
  detections: DetectedPerson[];
  width: number;
  height: number;
  opacity?: number;
  radius?: number;
}

const HeatmapOverlay = ({
  detections,
  width,
  height,
  opacity = 0.6,
  radius = 40,
}: HeatmapOverlayProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Generate heatmap colors
  const getHeatmapColor = (value: number): [number, number, number, number] => {
    const alpha = Math.min(value * 1.5, 1) * 255 * opacity;
    
    if (value < 0.25) {
      const t = value / 0.25;
      return [0, Math.round(t * 255), 255, alpha];
    } else if (value < 0.5) {
      const t = (value - 0.25) / 0.25;
      return [0, 255, Math.round(255 * (1 - t)), alpha];
    } else if (value < 0.75) {
      const t = (value - 0.5) / 0.25;
      return [Math.round(t * 255), 255, 0, alpha];
    } else {
      const t = (value - 0.75) / 0.25;
      return [255, Math.round(255 * (1 - t)), 0, alpha];
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || detections.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = width;
    canvas.height = height;

    const gridSize = 4;
    const gridWidth = Math.ceil(width / gridSize);
    const gridHeight = Math.ceil(height / gridSize);
    const densityGrid = new Float32Array(gridWidth * gridHeight);

    detections.forEach(person => {
      const centerX = (person.x + person.width / 2) * width / 100;
      const centerY = (person.y + person.height / 2) * height / 100;
      const weight = person.confidence;
      const radiusInCells = Math.ceil(radius / gridSize);
      
      for (let dy = -radiusInCells; dy <= radiusInCells; dy++) {
        for (let dx = -radiusInCells; dx <= radiusInCells; dx++) {
          const gx = Math.floor(centerX / gridSize) + dx;
          const gy = Math.floor(centerY / gridSize) + dy;
          
          if (gx >= 0 && gx < gridWidth && gy >= 0 && gy < gridHeight) {
            const distance = Math.sqrt(dx * dx + dy * dy) * gridSize;
            if (distance <= radius) {
              const falloff = Math.exp(-(distance * distance) / (2 * (radius / 2) * (radius / 2)));
              densityGrid[gy * gridWidth + gx] += weight * falloff;
            }
          }
        }
      }
    });

    let maxDensity = 0;
    for (let i = 0; i < densityGrid.length; i++) {
      if (densityGrid[i] > maxDensity) maxDensity = densityGrid[i];
    }

    const imageData = ctx.createImageData(width, height);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const gx = Math.floor(x / gridSize);
        const gy = Math.floor(y / gridSize);
        const density = densityGrid[gy * gridWidth + gx];
        const normalizedDensity = maxDensity > 0 ? density / maxDensity : 0;
        
        if (normalizedDensity > 0.01) {
          const [r, g, b, a] = getHeatmapColor(normalizedDensity);
          const idx = (y * width + x) * 4;
          imageData.data[idx] = r;
          imageData.data[idx + 1] = g;
          imageData.data[idx + 2] = b;
          imageData.data[idx + 3] = a;
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
    ctx.globalAlpha = 0.7;
    ctx.filter = 'blur(8px)';
    ctx.drawImage(canvas, 0, 0);
    ctx.filter = 'none';
    ctx.globalAlpha = 1;

  }, [detections, width, height, opacity, radius]);

  if (detections.length === 0) return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ mixBlendMode: 'screen' }}
    />
  );
};

export default HeatmapOverlay;

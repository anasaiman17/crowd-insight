import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Eye, EyeOff } from 'lucide-react';

interface ConfidenceFilterProps {
  value: number;
  onChange: (value: number) => void;
  totalCount: number;
  filteredCount: number;
  className?: string;
}

const ConfidenceFilter: React.FC<ConfidenceFilterProps> = ({
  value,
  onChange,
  totalCount,
  filteredCount,
  className = '',
}) => {
  const hiddenCount = totalCount - filteredCount;

  return (
    <div className={`glass-card p-4 space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Confidence Filter</span>
        </div>
        <span className="text-sm font-semibold text-primary">{Math.round(value * 100)}%</span>
      </div>
      
      <Slider
        value={[value * 100]}
        onValueChange={([val]) => onChange(val / 100)}
        min={0}
        max={100}
        step={5}
        className="w-full"
      />
      
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Show all</span>
        <span>High confidence only</span>
      </div>
      
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <div className="flex items-center gap-1.5">
          <Eye className="h-3.5 w-3.5 text-success" />
          <span className="text-sm">
            <span className="font-medium text-foreground">{filteredCount}</span>
            <span className="text-muted-foreground"> shown</span>
          </span>
        </div>
        {hiddenCount > 0 && (
          <div className="flex items-center gap-1.5">
            <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm">
              <span className="font-medium text-muted-foreground">{hiddenCount}</span>
              <span className="text-muted-foreground"> hidden</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConfidenceFilter;

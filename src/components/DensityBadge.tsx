import React from 'react';
import { DensityLevel } from '@/types/crowd';
import { cn } from '@/lib/utils';

interface DensityBadgeProps {
  level: DensityLevel;
  className?: string;
}

const DensityBadge: React.FC<DensityBadgeProps> = ({ level, className }) => {
  const badgeClass = {
    low: 'density-badge-low',
    medium: 'density-badge-medium',
    high: 'density-badge-high',
  }[level];

  const label = {
    low: 'Low Density',
    medium: 'Medium Density',
    high: 'High Density',
  }[level];

  return (
    <span className={cn(badgeClass, className)}>
      {label}
    </span>
  );
};

export default DensityBadge;

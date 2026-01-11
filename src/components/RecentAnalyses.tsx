import React from 'react';
import { Clock, Users } from 'lucide-react';
import { CrowdAnalysis } from '@/types/crowd';
import DensityBadge from './DensityBadge';
import { formatDistanceToNow } from 'date-fns';

interface RecentAnalysesProps {
  analyses: CrowdAnalysis[];
  className?: string;
}

const RecentAnalyses: React.FC<RecentAnalysesProps> = ({ analyses, className }) => {
  return (
    <div className={`glass-card p-6 ${className}`}>
      <h3 className="text-lg font-semibold mb-4">Recent Analyses</h3>
      <div className="space-y-4">
        {analyses.map((analysis) => (
          <div
            key={analysis.id}
            className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-medium">{analysis.peopleCount} people detected</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(analysis.timestamp, { addSuffix: true })}
                </div>
              </div>
            </div>
            <DensityBadge level={analysis.densityLevel} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentAnalyses;

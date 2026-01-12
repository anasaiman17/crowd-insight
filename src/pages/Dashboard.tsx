import React, { useState } from 'react';
import { Users, Activity, TrendingUp, Clock, AlertTriangle } from 'lucide-react';
import StatCard from '@/components/StatCard';
import CrowdChart from '@/components/CrowdChart';
import DensityBadge from '@/components/DensityBadge';
import RecentAnalyses from '@/components/RecentAnalyses';
import { useAuth } from '@/hooks/useAuth';
import { useAnalyses } from '@/hooks/useAnalyses';
import { format } from 'date-fns';
import { CrowdAnalysis, DensityLevel } from '@/types/crowd';

const Dashboard: React.FC = () => {
  const { profile } = useAuth();
  const { analyses, stats, getHourlyData, loading } = useAnalyses();
  const hourlyData = getHourlyData();

  // Get current stats
  const latestAnalysis = analyses[0];
  const currentCount = latestAnalysis?.people_count || 0;
  const currentDensity: DensityLevel = (latestAnalysis?.density_level as DensityLevel) || 'low';

  const getVariant = () => {
    switch (currentDensity) {
      case 'low':
        return 'success';
      case 'medium':
        return 'warning';
      case 'high':
        return 'danger';
      default:
        return 'default';
    }
  };

  // Convert analyses to the format expected by RecentAnalyses
  const recentAnalyses: CrowdAnalysis[] = analyses.slice(0, 5).map(a => ({
    id: a.id,
    timestamp: new Date(a.created_at),
    peopleCount: a.people_count,
    densityLevel: a.density_level as DensityLevel,
    detectedPersons: a.detected_persons || [],
    imageUrl: a.image_url || undefined,
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {profile?.full_name || profile?.email?.split('@')[0] || 'User'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            Last updated: {format(new Date(), 'HH:mm:ss')}
          </div>
          <div className="h-3 w-3 rounded-full bg-success animate-pulse" />
          <span className="text-sm font-medium text-success">Live</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Current Count"
          value={currentCount}
          subtitle="People detected now"
          icon={Users}
          variant={getVariant()}
        />
        <StatCard
          title="Average Count"
          value={stats.avgPeopleCount}
          subtitle="Session average"
          icon={Activity}
          variant="default"
        />
        <StatCard
          title="Peak Count"
          value={stats.peakCount}
          subtitle="Highest recorded"
          icon={TrendingUp}
          variant="warning"
        />
        <StatCard
          title="Total Analyses"
          value={stats.totalCount}
          subtitle="All time"
          icon={AlertTriangle}
          variant="default"
        />
      </div>

      {/* Current Status */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold mb-2">Current Crowd Status</h2>
            <p className="text-muted-foreground">
              Real-time monitoring of crowd density levels
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-4xl font-bold">{currentCount}</p>
              <p className="text-sm text-muted-foreground">people</p>
            </div>
            <DensityBadge level={currentDensity} className="text-lg px-6 py-2" />
          </div>
        </div>

        {/* Density Indicator Bar */}
        <div className="mt-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-success">Low (0-10)</span>
            <span className="text-warning">Medium (11-30)</span>
            <span className="text-destructive">High (30+)</span>
          </div>
          <div className="h-3 rounded-full bg-secondary overflow-hidden flex">
            <div className="w-1/3 bg-gradient-to-r from-success to-success/50" />
            <div className="w-1/3 bg-gradient-to-r from-warning/50 to-warning" />
            <div className="w-1/3 bg-gradient-to-r from-destructive/50 to-destructive" />
          </div>
          <div
            className="relative -mt-3"
            style={{
              marginLeft: `${Math.min((currentCount / 50) * 100, 100)}%`,
              transform: 'translateX(-50%)',
            }}
          >
            <div className="w-4 h-4 rounded-full bg-foreground border-2 border-background shadow-lg" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-4">Hourly Trend</h3>
          <CrowdChart data={hourlyData} type="area" />
        </div>
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-4">Detection History</h3>
          <CrowdChart 
            data={analyses.slice(0, 12).reverse().map(a => ({
              hour: format(new Date(a.created_at), 'HH:mm'),
              count: a.people_count,
              density: a.density_level as DensityLevel,
            }))} 
            type="bar" 
          />
        </div>
      </div>

      {/* Recent Analyses */}
      <RecentAnalyses analyses={recentAnalyses} />
    </div>
  );
};

export default Dashboard;

import React, { useState, useEffect } from 'react';
import { Users, Activity, TrendingUp, Clock, AlertTriangle } from 'lucide-react';
import StatCard from '@/components/StatCard';
import CrowdChart from '@/components/CrowdChart';
import DensityBadge from '@/components/DensityBadge';
import RecentAnalyses from '@/components/RecentAnalyses';
import { useAuth } from '@/contexts/AuthContext';
import {
  mockDashboardStats,
  mockRecentAnalyses,
  generateHourlyData,
  generateDailyData,
} from '@/lib/mockData';
import { format } from 'date-fns';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [hourlyData] = useState(generateHourlyData());
  const [dailyData] = useState(generateDailyData());
  const stats = mockDashboardStats;

  const getVariant = () => {
    switch (stats.currentDensity) {
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

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {user?.name}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            Last updated: {format(stats.lastUpdated, 'HH:mm:ss')}
          </div>
          <div className="h-3 w-3 rounded-full bg-success animate-pulse" />
          <span className="text-sm font-medium text-success">Live</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Current Count"
          value={stats.currentCount}
          subtitle="People detected now"
          icon={Users}
          variant={getVariant()}
        />
        <StatCard
          title="Average Count"
          value={stats.averageCount}
          subtitle="Today's average"
          icon={Activity}
          variant="default"
        />
        <StatCard
          title="Peak Count"
          value={stats.peakCount}
          subtitle="Highest today"
          icon={TrendingUp}
          variant="warning"
        />
        <StatCard
          title="Total Analyses"
          value={stats.totalAnalyses}
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
              <p className="text-4xl font-bold">{stats.currentCount}</p>
              <p className="text-sm text-muted-foreground">people</p>
            </div>
            <DensityBadge level={stats.currentDensity} className="text-lg px-6 py-2" />
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
              marginLeft: `${Math.min((stats.currentCount / 50) * 100, 100)}%`,
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
          <h3 className="text-lg font-semibold mb-4">Weekly Overview</h3>
          <CrowdChart data={dailyData} type="bar" />
        </div>
      </div>

      {/* Recent Analyses */}
      <RecentAnalyses analyses={mockRecentAnalyses} />
    </div>
  );
};

export default Dashboard;

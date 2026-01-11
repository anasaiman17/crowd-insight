import React, { useState } from 'react';
import { Download, Calendar, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CrowdChart from '@/components/CrowdChart';
import { generateHourlyData, generateDailyData } from '@/lib/mockData';
import { useToast } from '@/hooks/use-toast';

const Analytics: React.FC = () => {
  const [timeframe, setTimeframe] = useState<'hour' | 'day' | 'week'>('day');
  const [hourlyData] = useState(generateHourlyData());
  const [dailyData] = useState(generateDailyData());
  const { toast } = useToast();

  const data = timeframe === 'hour' ? hourlyData : dailyData;

  const totalCount = data.reduce((acc, d) => acc + d.count, 0);
  const averageCount = Math.round(totalCount / data.length);
  const maxCount = Math.max(...data.map((d) => d.count));
  const minCount = Math.min(...data.map((d) => d.count));

  const peakHour = data.find((d) => d.count === maxCount)?.hour || 'N/A';

  const handleExportCSV = () => {
    const headers = ['Time', 'Count', 'Density'];
    const rows = data.map((d) => [d.hour, d.count, d.density]);
    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crowd-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Export Complete',
      description: 'Analytics data exported as CSV.',
    });
  };

  const handleExportPDF = () => {
    toast({
      title: 'PDF Export',
      description: 'PDF export feature coming soon.',
    });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Detailed crowd monitoring analytics and trends
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={handleExportPDF}>
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Timeframe Selection */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          Timeframe:
        </div>
        <div className="flex rounded-lg border border-border p-1">
          {(['hour', 'day', 'week'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                timeframe === tf
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tf === 'hour' ? 'Hourly' : tf === 'day' ? 'Daily' : 'Weekly'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid gap-6 md:grid-cols-4">
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-muted-foreground">Total Count</span>
            <TrendingUp className="h-5 w-5 text-success" />
          </div>
          <p className="text-3xl font-bold">{totalCount.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground mt-1">All readings combined</p>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-muted-foreground">Average</span>
            <Minus className="h-5 w-5 text-primary" />
          </div>
          <p className="text-3xl font-bold">{averageCount}</p>
          <p className="text-sm text-muted-foreground mt-1">People per period</p>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-muted-foreground">Peak</span>
            <TrendingUp className="h-5 w-5 text-warning" />
          </div>
          <p className="text-3xl font-bold">{maxCount}</p>
          <p className="text-sm text-muted-foreground mt-1">At {peakHour}</p>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-muted-foreground">Minimum</span>
            <TrendingDown className="h-5 w-5 text-success" />
          </div>
          <p className="text-3xl font-bold">{minCount}</p>
          <p className="text-sm text-muted-foreground mt-1">Lowest reading</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-4">Trend Analysis</h3>
          <CrowdChart data={data} type="area" />
        </div>
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-4">Distribution</h3>
          <CrowdChart data={data} type="bar" />
        </div>
      </div>

      {/* Density Distribution */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold mb-6">Density Distribution</h3>
        <div className="grid gap-6 md:grid-cols-3">
          {(['low', 'medium', 'high'] as const).map((level) => {
            const count = data.filter((d) => d.density === level).length;
            const percentage = Math.round((count / data.length) * 100);
            const colors = {
              low: 'bg-success',
              medium: 'bg-warning',
              high: 'bg-destructive',
            };

            return (
              <div key={level} className="p-4 rounded-lg bg-secondary/30">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium capitalize">{level} Density</span>
                  <span className="text-2xl font-bold">{percentage}%</span>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <div
                    className={`h-full rounded-full ${colors[level]}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {count} of {data.length} readings
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Data Table */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold mb-4">Raw Data</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Time
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  People Count
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Density Level
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => (
                <tr
                  key={index}
                  className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
                >
                  <td className="py-3 px-4">{row.hour}</td>
                  <td className="py-3 px-4 font-medium">{row.count}</td>
                  <td className="py-3 px-4 capitalize">{row.density}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
                        row.density === 'low'
                          ? 'bg-success/20 text-success'
                          : row.density === 'medium'
                          ? 'bg-warning/20 text-warning'
                          : 'bg-destructive/20 text-destructive'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          row.density === 'low'
                            ? 'bg-success'
                            : row.density === 'medium'
                            ? 'bg-warning'
                            : 'bg-destructive'
                        }`}
                      />
                      {row.density === 'low'
                        ? 'Normal'
                        : row.density === 'medium'
                        ? 'Moderate'
                        : 'Crowded'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Analytics;

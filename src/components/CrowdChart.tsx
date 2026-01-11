import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { AnalyticsData } from '@/types/crowd';

interface CrowdChartProps {
  data: AnalyticsData[];
  type?: 'area' | 'bar';
  className?: string;
}

const CrowdChart: React.FC<CrowdChartProps> = ({
  data,
  type = 'area',
  className,
}) => {
  const getBarColor = (density: string) => {
    switch (density) {
      case 'low':
        return 'hsl(142, 76%, 36%)';
      case 'medium':
        return 'hsl(38, 92%, 50%)';
      case 'high':
        return 'hsl(0, 84%, 60%)';
      default:
        return 'hsl(217, 91%, 60%)';
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card px-4 py-3 border border-border/50">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-lg font-bold text-primary">
            {payload[0].value} people
          </p>
        </div>
      );
    }
    return null;
  };

  if (type === 'bar') {
    return (
      <div className={className}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(217, 33%, 17%)"
              vertical={false}
            />
            <XAxis
              dataKey="hour"
              stroke="hsl(215, 20%, 65%)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="hsl(215, 20%, 65%)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="count"
              radius={[6, 6, 0, 0]}
              fill="hsl(217, 91%, 60%)"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(217, 33%, 17%)"
            vertical={false}
          />
          <XAxis
            dataKey="hour"
            stroke="hsl(215, 20%, 65%)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="hsl(215, 20%, 65%)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="count"
            stroke="hsl(217, 91%, 60%)"
            strokeWidth={2}
            fill="url(#colorCount)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CrowdChart;

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine
} from 'recharts';

interface UserUsage {
  userId: string;
  name: string;
  totalTokensUsed: number;
  maxTokens: number;
  percentageUsed: number;
}

export default function UsageChart({ data }: { data: UserUsage[] }) {
  const chartData = data
    .map(u => ({
      name: u.name || 'Unknown',
      tokens: u.totalTokensUsed,
      limit: u.maxTokens,
      percentage: u.percentageUsed
    }))
    .sort((a, b) => b.tokens - a.tokens)
    .slice(0, 10);

  // Get the common limit (should be the same for all users)
  const commonLimit = chartData.length > 0 ? chartData[0].limit : 90000;

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          barSize={40}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
          <XAxis 
            dataKey="name" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#6B7280', fontSize: 12 }}
            dy={10}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#6B7280', fontSize: 12 }}
            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip
            cursor={{ fill: '#F3F4F6' }}
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
            formatter={(value: number) => [`${value.toLocaleString()} tokens`, 'Tokens Used']}
          />
          <ReferenceLine 
            y={commonLimit} 
            stroke="#EF4444" 
            strokeDasharray="5 5" 
            label={{ value: `Limit: ${commonLimit.toLocaleString()}`, fill: '#EF4444', fontSize: 11, position: 'insideTopRight' }}
          />
          <Bar dataKey="tokens" radius={[6, 6, 0, 0]}>
            {chartData.map((entry, index) => {
              const color = entry.percentage >= 100 ? '#EF4444' : entry.percentage >= 80 ? '#F59E0B' : '#10B981';
              return <Cell key={`cell-${index}`} fill={color} />;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

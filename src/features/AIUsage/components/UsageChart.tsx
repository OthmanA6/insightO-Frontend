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
import { motion } from 'framer-motion';

interface UserUsage {
  userId: string;
  name: string;
  totalTokensUsed: number;
  maxTokens: number;
  percentageUsed: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md p-4 rounded-xl shadow-xl border border-gray-100 dark:border-gray-800">
        <p className="font-bold text-gray-900 dark:text-content mb-2">{label}</p>
        <div className="space-y-1">
          <p className="text-sm text-indigo-600 dark:text-indigo-400 font-semibold">
            Used: {data.tokens.toLocaleString()} tokens
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Limit: {data.limit.toLocaleString()} tokens
          </p>
          <p className="text-sm font-medium mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
            <span className={data.percentage >= 100 ? 'text-red-500' : data.percentage >= 80 ? 'text-amber-500' : 'text-emerald-500'}>
              {data.percentage.toFixed(1)}% Utilized
            </span>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

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

  const commonLimit = chartData.length > 0 ? chartData[0].limit : 50000;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="w-full h-[350px]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          barSize={48}
        >
          <defs>
            <linearGradient id="colorHealthy" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity={1}/>
              <stop offset="100%" stopColor="#059669" stopOpacity={0.8}/>
            </linearGradient>
            <linearGradient id="colorWarning" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity={1}/>
              <stop offset="100%" stopColor="#D97706" stopOpacity={0.8}/>
            </linearGradient>
            <linearGradient id="colorDanger" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#EF4444" stopOpacity={1}/>
              <stop offset="100%" stopColor="#DC2626" stopOpacity={0.8}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-gray-200 dark:text-gray-800" opacity={0.5} />
          <XAxis 
            dataKey="name" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#9CA3AF', fontSize: 12, fontWeight: 500 }}
            dy={15}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
            dx={-10}
          />
          <Tooltip cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }} content={<CustomTooltip />} />
          <ReferenceLine 
            y={commonLimit} 
            stroke="#EF4444" 
            strokeDasharray="4 4" 
            opacity={0.7}
          />
          <Bar dataKey="tokens" radius={[8, 8, 0, 0]} animationDuration={1500} animationEasing="ease-out">
            {chartData.map((entry, index) => {
              const gradient = entry.percentage >= 100 ? 'url(#colorDanger)' : entry.percentage >= 80 ? 'url(#colorWarning)' : 'url(#colorHealthy)';
              return <Cell key={`cell-${index}`} fill={gradient} />;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

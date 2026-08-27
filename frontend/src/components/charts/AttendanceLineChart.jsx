import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Area, AreaChart } from 'recharts';
import { useTheme } from '../../context/ThemeContext';

export default function AttendanceLineChart({ data, loading }) {
  const { isDark } = useTheme();

  if (loading) return <div className="h-full w-full flex items-center justify-center">Loading...</div>;
  if (!data || data.length === 0) return <div className="h-full flex items-center justify-center text-surface-400">No data</div>;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={isDark ? '#6366f1' : '#6366f1'} stopOpacity={0.3}/>
            <stop offset="95%" stopColor={isDark ? '#6366f1' : '#6366f1'} stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#27272a' : '#e4e4e7'} />
        <XAxis 
          dataKey="date" 
          axisLine={false} 
          tickLine={false} 
          tick={{ fill: isDark ? '#a1a1aa' : '#71717a', fontSize: 12 }} 
          dy={10}
        />
        <YAxis 
          axisLine={false} 
          tickLine={false} 
          tick={{ fill: isDark ? '#a1a1aa' : '#71717a', fontSize: 12 }}
        />
        <Tooltip
          contentStyle={{ 
            backgroundColor: isDark ? 'rgba(39, 39, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)', 
            backdropFilter: 'blur(8px)',
            borderRadius: '12px',
            border: isDark ? '1px solid rgba(63, 63, 70, 0.5)' : '1px solid rgba(228, 228, 231, 0.8)',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
          }}
          itemStyle={{ color: isDark ? '#e4e4e7' : '#27272a', fontWeight: '500' }}
        />
        <Area 
          type="monotone" 
          dataKey="percentage" 
          stroke="#6366f1" 
          strokeWidth={3}
          fillOpacity={1} 
          fill="url(#colorValue)" 
          activeDot={{ r: 6, strokeWidth: 0, fill: '#6366f1' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import { useTheme } from '../../context/ThemeContext';

export default function AttendanceBarChart({ data, loading, color = '#6366f1', horizontal = false }) {
  const { isDark } = useTheme();

  if (loading) return <div className="h-full w-full flex items-center justify-center">Loading...</div>;
  if (!data || data.length === 0) return <div className="h-full flex items-center justify-center text-surface-400">No data</div>;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart 
        data={data} 
        layout={horizontal ? 'vertical' : 'horizontal'}
        margin={{ top: 10, right: 10, left: horizontal ? 20 : -20, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={!horizontal} vertical={horizontal} stroke={isDark ? '#27272a' : '#e4e4e7'} />
        <XAxis 
          type={horizontal ? "number" : "category"} 
          dataKey={horizontal ? undefined : "name"} 
          axisLine={false} 
          tickLine={false} 
          tick={{ fill: isDark ? '#a1a1aa' : '#71717a', fontSize: 12 }} 
          dy={horizontal ? 0 : 10}
        />
        <YAxis 
          type={horizontal ? "category" : "number"} 
          dataKey={horizontal ? "name" : undefined}
          axisLine={false} 
          tickLine={false} 
          tick={{ fill: isDark ? '#a1a1aa' : '#71717a', fontSize: 12 }}
        />
        <Tooltip
          cursor={{ fill: isDark ? '#3f3f46' : '#f4f4f5', opacity: 0.4 }}
          contentStyle={{ 
            backgroundColor: isDark ? 'rgba(39, 39, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)', 
            backdropFilter: 'blur(8px)',
            borderRadius: '12px',
            border: isDark ? '1px solid rgba(63, 63, 70, 0.5)' : '1px solid rgba(228, 228, 231, 0.8)',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
          }}
        />
        <Bar dataKey="value" radius={horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color || color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

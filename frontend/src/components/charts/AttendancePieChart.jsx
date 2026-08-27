import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { useTheme } from '../../context/ThemeContext';

export default function AttendancePieChart({ data, loading }) {
  const { isDark } = useTheme();
  
  if (loading) return <div className="h-full w-full flex items-center justify-center">Loading...</div>;
  if (!data || data.length === 0) return <div className="h-full flex items-center justify-center text-surface-400">No data</div>;

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          paddingAngle={5}
          dataKey="value"
          stroke="none"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ 
            backgroundColor: isDark ? 'rgba(39, 39, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)', 
            backdropFilter: 'blur(8px)',
            borderRadius: '12px',
            border: isDark ? '1px solid rgba(63, 63, 70, 0.5)' : '1px solid rgba(228, 228, 231, 0.8)',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
          }}
          itemStyle={{ color: isDark ? '#e4e4e7' : '#27272a' }}
        />
        <Legend 
          verticalAlign="bottom" 
          height={36} 
          iconType="circle"
          wrapperStyle={{ fontSize: '12px', color: isDark ? '#a1a1aa' : '#71717a' }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

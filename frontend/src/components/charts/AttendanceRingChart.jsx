import React from 'react';
import { motion } from 'framer-motion';

export default function AttendanceRingChart({ percentage = 0, size = 160, label = "Overall" }) {
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  let color = '#10b981'; // emerald
  if (percentage < 60) color = '#ef4444'; // red
  else if (percentage < 75) color = '#f59e0b'; // amber

  return (
    <div className="relative flex flex-col items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-surface-200 dark:text-surface-700"
        />
        {/* Progress ring */}
        <motion.circle
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          style={{ strokeDasharray: circumference }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-surface-900 dark:text-white">
          {Math.round(percentage)}%
        </span>
        <span className="text-xs text-surface-500 font-medium uppercase tracking-wider mt-1">{label}</span>
      </div>
    </div>
  );
}

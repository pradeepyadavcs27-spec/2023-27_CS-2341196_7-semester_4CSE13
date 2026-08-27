import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function StatCard({ title, value, icon: Icon, color = 'primary', trend, trendValue, delay = 0 }) {
  const [count, setCount] = useState(0);
  const numericValue = parseFloat(value) || 0;
  const isPercentage = String(value).includes('%');

  useEffect(() => {
    let start = 0;
    const end = numericValue;
    if (start === end) {
      setCount(end);
      return;
    }
    
    const duration = 1500;
    const frameRate = 16; // ~60fps
    const totalFrames = Math.round(duration / frameRate);
    const increment = end / totalFrames;
    const hasDecimals = end % 1 !== 0;
    
    let timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(hasDecimals ? parseFloat(start.toFixed(1)) : Math.round(start));
      }
    }, frameRate);
    
    return () => clearInterval(timer);
  }, [numericValue]);

  const displayValue = isPercentage ? `${count}%` : count;

  const colorClasses = {
    primary: 'from-primary-500 to-primary-600 text-primary-500 shadow-primary-500/20',
    success: 'from-emerald-500 to-emerald-600 text-emerald-500 shadow-emerald-500/20',
    warning: 'from-amber-500 to-amber-600 text-amber-500 shadow-amber-500/20',
    danger: 'from-rose-500 to-rose-600 text-rose-500 shadow-rose-500/20',
    info: 'from-blue-500 to-blue-600 text-blue-500 shadow-blue-500/20',
  };

  const selectedColor = colorClasses[color] || colorClasses.primary;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="stat-card flex flex-col justify-between group"
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-surface-500 dark:text-surface-400 mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-surface-900 dark:text-surface-50 tracking-tight">
            {typeof value === 'string' && !isPercentage ? value : displayValue}
          </h3>
        </div>
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center shadow-md transition-transform duration-300 group-hover:scale-110",
          `bg-gradient-to-tr ${selectedColor.split(' ')[0]} ${selectedColor.split(' ')[1]} ${selectedColor.split(' ')[3]}`
        )}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      
      {trend && trendValue && (
        <div className="mt-4 flex items-center gap-1.5 text-sm">
          {trend === 'up' ? (
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          ) : (
            <TrendingDown className="w-4 h-4 text-rose-500" />
          )}
          <span className={cn("font-medium", trend === 'up' ? "text-emerald-500" : "text-rose-500")}>
            {trendValue}
          </span>
          <span className="text-surface-400 text-xs ml-1">vs last month</span>
        </div>
      )}
    </motion.div>
  );
}

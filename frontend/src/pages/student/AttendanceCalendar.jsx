import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle2, XCircle, Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { addMonths, subMonths, format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay } from 'date-fns';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';

export default function AttendanceCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = new Date(monthStart);
  startDate.setDate(startDate.getDate() - startDate.getDay()); // Start from Sunday
  
  const endDate = new Date(monthEnd);
  if (endDate.getDay() !== 6) {
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay())); // End on Saturday
  }

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  useEffect(() => {
    const fetchCalendarData = async () => {
      setLoading(true);
      try {
        const month = currentDate.getMonth() + 1;
        const year = currentDate.getFullYear();
        const { data } = await api.get('/student/calendar', {
          params: { month, year }
        });
        setAttendanceRecords(data.data || []);
      } catch (error) {
        console.error('Failed to fetch calendar data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCalendarData();
  }, [currentDate]);

  // Group records by date string 'yyyy-MM-dd'
  const calendarData = useMemo(() => {
    const grouped = {};
    attendanceRecords.forEach(record => {
      const dateStr = record.date;
      if (!grouped[dateStr]) grouped[dateStr] = [];
      grouped[dateStr].push(record);
    });
    return grouped;
  }, [attendanceRecords]);

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const getDayStatus = (records) => {
    if (!records || records.length === 0) return 'none';
    const hasAbsent = records.some(r => r.status === 'Absent');
    const hasPresent = records.some(r => r.status === 'Present');
    if (hasAbsent && hasPresent) return 'mixed';
    if (hasAbsent) return 'absent';
    return 'present';
  };

  const selectedDateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null;
  const selectedRecords = (selectedDateStr && calendarData[selectedDateStr]) ? calendarData[selectedDateStr] : [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-surface-900 dark:text-white flex items-center gap-2">
        <CalendarIcon className="w-6 h-6 text-primary-500" />
        Attendance Calendar
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold text-surface-900 dark:text-white">
                {format(currentDate, "MMMM yyyy")}
              </h2>
              {loading && <Loader2 className="w-4 h-4 animate-spin text-primary-500" />}
            </div>
            <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Days of week */}
          <div className="grid grid-cols-7 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="text-center font-semibold text-sm text-surface-500 py-2">{d}</div>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-7 gap-2">
            {days.map((day, i) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const records = calendarData[dateStr];
              const status = getDayStatus(records);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isCurrMonth = isSameMonth(day, monthStart);
              const isTodayDay = isToday(day);

              let bgClass = "hover:bg-surface-100 dark:hover:bg-surface-800";
              let textClass = "";

              if (status === 'present') {
                bgClass = "bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50";
              } else if (status === 'absent') {
                bgClass = "bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/50";
              } else if (status === 'mixed') {
                bgClass = "bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50";
              }

              if (isSelected) {
                bgClass += " ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-surface-900";
              }

              return (
                <motion.div 
                  key={day.toString()}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.01 }}
                  onClick={() => isCurrMonth && setSelectedDate(day)}
                  className={cn(
                    "aspect-square flex flex-col items-center justify-center rounded-xl cursor-pointer transition-all duration-200 font-medium",
                    !isCurrMonth && "opacity-30 pointer-events-none",
                    isCurrMonth && status === 'none' && !isSelected && "hover:bg-surface-100 dark:hover:bg-surface-800",
                    isTodayDay && status === 'none' && !isSelected && "bg-surface-200 dark:bg-surface-700 font-bold",
                    bgClass
                  )}
                >
                  <span className={cn("text-base z-10", textClass)}>{format(day, 'd')}</span>
                  {records && records.length > 0 && (
                    <span className="text-[10px] mt-1 opacity-70">
                      {records.length} class{records.length > 1 ? 'es' : ''}
                    </span>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-8 pt-6 border-t border-surface-200 dark:border-surface-700">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-emerald-100 dark:bg-emerald-900/50 border border-emerald-300 dark:border-emerald-700"></div>
              <span className="text-sm text-surface-600 dark:text-surface-300">All Present</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-100 dark:bg-red-900/50 border border-red-300 dark:border-red-700"></div>
              <span className="text-sm text-surface-600 dark:text-surface-300">All Absent</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-amber-100 dark:bg-amber-900/50 border border-amber-300 dark:border-amber-700"></div>
              <span className="text-sm text-surface-600 dark:text-surface-300">Mixed</span>
            </div>
          </div>
        </div>

        {/* Details Pane */}
        <div className="glass-card p-6 h-fit sticky top-6">
          <h3 className="text-lg font-bold text-surface-900 dark:text-white mb-4">
            {selectedDate ? format(selectedDate, "EEEE, MMMM d") : "Select a Date"}
          </h3>
          
          <AnimatePresence mode="wait">
            {!selectedDate ? (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-center py-12 text-surface-500"
              >
                Click on any highlighted day in the calendar to see your class attendance details.
              </motion.div>
            ) : selectedRecords.length === 0 ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="text-center py-12 text-surface-500 bg-surface-50 dark:bg-surface-800/50 rounded-xl"
              >
                No classes scheduled for this day.
              </motion.div>
            ) : (
              <motion.div 
                key="list"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="space-y-3"
              >
                {selectedRecords.map((record, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700">
                    <div className="font-medium text-surface-900 dark:text-white">
                      {record.subject}
                    </div>
                    <div className={cn(
                      "flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold",
                      record.status === 'Present' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    )}>
                      {record.status === 'Present' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      {record.status}
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

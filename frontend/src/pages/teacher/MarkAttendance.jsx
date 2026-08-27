import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { Loader2, Check, X, MapPin, QrCode, StopCircle, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { getStudents, markAttendance, generateQrSession, getQrSessionStatus, closeQrSession, getSummary } from '../../services/teacherService';
import { QRCodeSVG } from 'qrcode.react';

export default function MarkAttendance() {
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: { date: format(new Date(), 'yyyy-MM-dd') }
  });
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Live Session State
  const [activeSession, setActiveSession] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [qrCodeData, setQrCodeData] = useState(null);
  const [presentCount, setPresentCount] = useState(0);

  // Dynamic Options
  const [teacherSubjects, setTeacherSubjects] = useState([]);
  const [teacherClasses, setTeacherClasses] = useState([]);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const res = await getSummary();
        if (res.success && res.summary) {
          setTeacherSubjects(res.summary.subjects || []);
          setTeacherClasses(res.summary.classes || []);
        }
      } catch (error) {
        console.error("Failed to fetch teacher summary for options");
      }
    };
    fetchOptions();
  }, []);

  const watchSubject = watch('subject');
  const watchClass = watch('class');
  const watchSection = watch('section');
  const watchDate = watch('date');

  useEffect(() => {
    let interval;
    if (activeSession && qrCodeData) {
      interval = setInterval(async () => {
        try {
          const res = await getQrSessionStatus(qrCodeData);
          if (res.success) {
            setPresentCount(res.presentCount);
            if (!res.isActive) {
               setActiveSession(null);
               toast('Session has expired', { icon: '⏰' });
            }
          }
        } catch (error) {
          console.error("Failed to fetch session status");
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [activeSession, qrCodeData]);

  const handleStartLiveSession = async (data) => {
    if (!data.subject || !data.class || !data.section || !data.date) {
      toast.error('Please select subject, class, section, and date');
      return;
    }
    setSessionLoading(true);

    try {
      const payload = {
        subject: data.subject,
        class: data.class,
        section: data.section,
        date: data.date,
        expiresInMinutes: 10
      };
      const res = await generateQrSession(payload);
      setActiveSession(res.session);
      setQrCodeData(res.session.code);
      setPresentCount(0);
      toast.success('Live QR Session Started!');
      setStudents([]); // Hide manual marking if open
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to start live session');
    } finally {
      setSessionLoading(false);
    }
  };

  const handleStopLiveSession = async () => {
    if (!qrCodeData) return;
    try {
      await closeQrSession(qrCodeData);
      setActiveSession(null);
      setQrCodeData(null);
      toast.success('Live Session Ended');
    } catch (error) {
      toast.error('Failed to end session');
    }
  };

  const loadStudents = async (data) => {
    if (!data.subject || !data.class || !data.section) {
      toast.error('Please select subject, class and section');
      return;
    }
    try {
      setLoading(true);
      const res = await getStudents({ class: data.class, section: data.section });
      if (res.students && res.students.length > 0) {
        setStudents(res.students);
        const initial = {};
        res.students.forEach(s => initial[s._id] = null);
        setAttendance(initial);
        toast.success('Students loaded successfully');
      } else {
        toast.error('No students found for this class and section.');
        setStudents([]);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const markAll = (status) => {
    const newAtt = {};
    students.forEach(s => newAtt[s._id] = status);
    setAttendance(newAtt);
  };

  const toggleStatus = (id, status) => {
    setAttendance(prev => ({ ...prev, [id]: prev[id] === status ? null : status }));
  };

  const saveAttendance = async () => {
    const unrecorded = Object.values(attendance).filter(v => v === null).length;
    if (unrecorded > 0) {
      toast.error(`Please mark attendance for all students (${unrecorded} left)`);
      return;
    }

    setSaving(true);
    
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      setSaving(false);
      return;
    }

    toast('Requesting location permissions...', { icon: '📍' });

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const records = students.map(s => ({
            studentId: s._id,
            status: attendance[s._id]
          }));

          const payload = {
            subject: watchSubject,
            class: watchClass,
            section: watchSection,
            date: watchDate,
            records,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };

          await markAttendance(payload);
          toast.success('Attendance saved successfully with location verified!');
          setStudents([]); // Reset
        } catch (error) {
          toast.error(error.response?.data?.message || 'Failed to save attendance');
        } finally {
          setSaving(false);
        }
      },
      (error) => {
        setSaving(false);
        toast.error('Location permission denied. Cannot mark attendance.');
      },
      { timeout: 10000 }
    );
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-surface-900 dark:text-white flex items-center gap-2">
        <MapPin className="w-6 h-6 text-primary-500" />
        {activeSession ? 'Live Session Active' : 'Mark Attendance'}
      </h1>

      {!activeSession && (
        <div className="glass-card p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end mb-6">
            <div>
              <label className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-1 block">Subject</label>
              <select {...register('subject')} className="input-field py-2.5">
                <option value="">Select...</option>
                {teacherSubjects.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
                {teacherSubjects.length === 0 && (
                  <>
                    <option value="Data Structures">Data Structures</option>
                    <option value="Algorithms">Algorithms</option>
                  </>
                )}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-1 block">Class/Year</label>
              <select {...register('class')} className="input-field py-2.5">
                <option value="">Select...</option>
                {teacherClasses.map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
                {teacherClasses.length === 0 && (
                  <>
                    <option value="CS-3A">CS-3A</option>
                    <option value="CS-3B">CS-3B</option>
                    <option value="CS-5A">CS-5A</option>
                    <option value="EC-3A">EC-3A</option>
                    <option value="EC-5B">EC-5B</option>
                  </>
                )}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-1 block">Section</label>
              <select {...register('section')} className="input-field py-2.5">
                <option value="">Select...</option>
                <option value="A">A</option><option value="B">B</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-1 block">Date</label>
              <input type="date" {...register('date')} className="input-field py-2.5" />
            </div>
          </div>

          <div className="flex gap-4">
            <button 
              onClick={handleSubmit(loadStudents)} 
              disabled={loading || sessionLoading} 
              className="btn-secondary flex-1 h-[46px] flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Users className="w-5 h-5"/> Manual Entry</>}
            </button>
            <button 
              onClick={handleSubmit(handleStartLiveSession)} 
              disabled={loading || sessionLoading} 
              className="btn-primary flex-1 h-[46px] flex items-center justify-center gap-2"
            >
              {sessionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><QrCode className="w-5 h-5"/> Start Live QR Session</>}
            </button>
          </div>
        </div>
      )}

      {/* LIVE SESSION UI */}
      {activeSession && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-8 flex flex-col items-center justify-center text-center space-y-6"
        >
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-surface-900 dark:text-white">Scan to Check-in</h2>
            <p className="text-surface-500 dark:text-surface-400">
              {activeSession.subject} ({activeSession.class}-{activeSession.section})
            </p>
          </div>

          <div className="p-4 bg-white rounded-2xl shadow-xl shadow-primary-500/10">
            <QRCodeSVG 
              value={`${window.location.origin}/student/qr-scan?code=${qrCodeData}`} 
              size={300} 
              level="H"
              includeMargin={true}
            />
          </div>

          <div className="flex flex-col items-center gap-2">
            <p className="text-xl font-bold text-emerald-500 dark:text-emerald-400">
              {presentCount} Students Marked Present
            </p>
            <p className="text-sm text-surface-500 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
              Listening for scans...
            </p>
          </div>

          <button onClick={handleStopLiveSession} className="btn-secondary border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-500/30 dark:hover:bg-red-500/10 dark:text-red-400 gap-2 px-8">
            <StopCircle className="w-5 h-5" /> End Session
          </button>
        </motion.div>
      )}

      {/* MANUAL ENTRY UI */}
      <AnimatePresence>
        {!activeSession && students.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="flex flex-col sm:flex-row items-center justify-between p-4 glass-card bg-primary-50 dark:bg-primary-500/10 border-primary-200 dark:border-primary-500/20">
              <p className="font-medium text-primary-900 dark:text-primary-100 mb-4 sm:mb-0">
                Marking for <span className="font-bold">{watchSubject}</span> ({watchClass}-{watchSection}) on {watchDate}
              </p>
              <div className="flex gap-2">
                <button onClick={() => markAll('Present')} className="px-4 py-2 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:hover:bg-emerald-500/30 font-medium text-sm transition-colors">
                  All Present
                </button>
                <button onClick={() => markAll('Absent')} className="px-4 py-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-500/20 dark:text-red-400 dark:hover:bg-red-500/30 font-medium text-sm transition-colors">
                  All Absent
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {students.map((student, i) => (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  key={student._id} 
                  className={cn(
                    "glass-card p-4 flex items-center justify-between border-2 transition-colors",
                    attendance[student._id] === 'Present' ? "border-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-900/10" :
                    attendance[student._id] === 'Absent' ? "border-red-500/50 bg-red-50/50 dark:bg-red-900/10" : "border-transparent"
                  )}
                >
                  <div>
                    <p className="text-xs text-surface-500 font-mono">{student.rollNumber}</p>
                    <p className="font-semibold text-surface-900 dark:text-white">{student.fullName}</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => toggleStatus(student._id, 'Present')}
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                        attendance[student._id] === 'Present' 
                          ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/30" 
                          : "bg-surface-100 text-surface-400 hover:bg-emerald-100 hover:text-emerald-500 dark:bg-surface-800"
                      )}
                    >
                      <Check className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => toggleStatus(student._id, 'Absent')}
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                        attendance[student._id] === 'Absent' 
                          ? "bg-red-500 text-white shadow-md shadow-red-500/30" 
                          : "bg-surface-100 text-surface-400 hover:bg-red-100 hover:text-red-500 dark:bg-surface-800"
                      )}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="flex justify-end pt-4 border-t border-surface-200 dark:border-surface-700">
              <button 
                onClick={saveAttendance} 
                disabled={saving}
                className="btn-primary w-full sm:w-auto px-8 gap-2"
              >
                {saving ? (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                ) : (
                  <>
                    <MapPin className="w-4 h-4" />
                    Save & Verify Location
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

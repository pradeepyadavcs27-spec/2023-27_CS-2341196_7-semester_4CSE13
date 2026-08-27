import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Scanner } from '@yudiel/react-qr-scanner';
import { QrCode, Loader2, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { markQrAttendance } from '../../services/studentService';

export default function QRScanner() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const codeFromUrl = searchParams.get('code');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    // If user arrived directly from URL scan, process immediately
    if (codeFromUrl) {
      handleScan(codeFromUrl);
    }
  }, [codeFromUrl]);

  const handleScan = async (code) => {
    if (loading || success) return;
    
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await markQrAttendance(code);
      if (res.success) {
        setSuccess(true);
        toast.success(res.message || 'Successfully marked present!');
        // Return to dashboard after 3 seconds
        setTimeout(() => navigate('/student'), 3000);
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to mark attendance. Invalid or expired QR.';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-surface-900 dark:text-white flex items-center gap-2">
        <QrCode className="w-6 h-6 text-primary-500" />
        Scan QR Code
      </h1>

      <div className="glass-card p-6 flex flex-col items-center">
        {success ? (
          <div className="text-center py-8 space-y-4">
            <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto" />
            <h2 className="text-xl font-bold text-surface-900 dark:text-white">Attendance Marked!</h2>
            <p className="text-surface-500">You are present for this class.</p>
            <p className="text-sm text-surface-400">Redirecting to dashboard...</p>
          </div>
        ) : (
          <>
            <p className="text-surface-600 dark:text-surface-300 text-center mb-6">
              Point your camera at the QR code displayed by your teacher to instantly mark yourself present.
            </p>

            <div className="w-full max-w-sm aspect-square overflow-hidden rounded-2xl border-4 border-primary-500/30 relative">
              {loading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface-50/80 dark:bg-surface-900/80 z-10">
                  <Loader2 className="w-10 h-10 animate-spin text-primary-500 mb-2" />
                  <p className="font-medium">Verifying code...</p>
                </div>
              ) : (
                <Scanner 
                  onScan={(result) => {
                    if (result && result.length > 0) {
                      // Result is an array of objects in latest versions, grab first
                      const value = result[0].rawValue || result[0].value || result;
                      
                      // Value could be full URL or just code
                      try {
                        const url = new URL(value);
                        const code = url.searchParams.get('code');
                        if (code) handleScan(code);
                      } catch (e) {
                        // If not a URL, maybe it's just the code string
                        if (typeof value === 'string' && value.length > 10) {
                           handleScan(value);
                        }
                      }
                    }
                  }}
                  onError={(error) => console.log(error?.message)}
                  components={{
                    audio: false,
                    onOff: true,
                    finder: true
                  }}
                  styles={{
                    container: { width: '100%', height: '100%' },
                    video: { objectFit: 'cover' }
                  }}
                />
              )}
            </div>

            {errorMsg && (
              <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg flex items-start gap-3 w-full">
                <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p className="text-sm">{errorMsg}</p>
              </div>
            )}
            
            <button onClick={() => navigate('/student')} className="mt-6 text-surface-500 hover:text-surface-900 dark:hover:text-white transition-colors">
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
}

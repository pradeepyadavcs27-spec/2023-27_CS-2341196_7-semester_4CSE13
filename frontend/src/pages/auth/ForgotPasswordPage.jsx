import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { forgotPassword } from '../../services/authService';

export default function ForgotPasswordPage() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resetLink, setResetLink] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setErrorMsg('');
      const response = await forgotPassword(data.email);
      setSuccess(true);
      if (response.resetUrl) {
        setResetLink(response.resetUrl);
      }
    } catch (error) {
      setErrorMsg(error.response?.data?.message || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-surface-950">
      <div className="absolute inset-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/40 via-surface-950 to-surface-950"></div>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md p-8 glass-card bg-surface-900/80 border-surface-700 z-10 mx-4"
      >
        <Link to="/login" className="inline-flex items-center text-sm text-surface-400 hover:text-white transition-colors mb-6 group">
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Login
        </Link>

        {success ? (
          <div className="text-center py-6">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-16 h-16 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <CheckCircle2 className="w-8 h-8" />
            </motion.div>
            <h2 className="text-xl font-bold text-white mb-2">Check your email</h2>
            <p className="text-surface-400 text-sm mb-6">We've sent password reset instructions to your email address.</p>
            
            {resetLink && (
              <div className="p-4 bg-surface-800 rounded-lg border border-surface-700">
                <p className="text-xs text-amber-400 mb-2 font-medium">Local Dev Mode: Email skipped.</p>
                <a href={resetLink} className="btn-primary w-full block text-center py-2.5">
                  Click here to Reset Password
                </a>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-white tracking-tight mb-2">Forgot Password</h1>
              <p className="text-surface-400 text-sm">Enter your email to receive a reset link</p>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-surface-500" />
                  </div>
                  <input
                    type="email"
                    {...register('email', { required: 'Email is required' })}
                    placeholder="Email address"
                    className="input-field pl-10 bg-surface-800/50 border-surface-700 text-white"
                  />
                </div>
                {errors.email && <p className="text-red-400 text-xs mt-1 ml-1">{errors.email.message}</p>}
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full btn-primary py-3"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Reset Link'}
              </button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
}

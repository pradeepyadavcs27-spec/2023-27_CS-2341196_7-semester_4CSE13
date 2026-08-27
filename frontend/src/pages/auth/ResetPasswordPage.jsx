import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useParams, useNavigate } from 'react-router-dom';
import { Lock, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { resetPassword } from '../../services/authService';

export default function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);

  const password = watch('password');

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      await resetPassword(token, { password: data.password });
      toast.success('Password reset successful. Please login.');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
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
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-white tracking-tight mb-2">Reset Password</h1>
          <p className="text-surface-400 text-sm">Create a new secure password</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-surface-500" />
              </div>
              <input
                type="password"
                {...register('password', { 
                  required: 'Password is required',
                  minLength: { value: 6, message: 'Minimum 6 characters' }
                })}
                placeholder="New Password"
                className="input-field pl-10 bg-surface-800/50 border-surface-700 text-white"
              />
            </div>
            {errors.password && <p className="text-red-400 text-xs mt-1 ml-1">{errors.password.message}</p>}
          </div>

          <div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-surface-500" />
              </div>
              <input
                type="password"
                {...register('confirmPassword', { 
                  required: 'Please confirm password',
                  validate: val => val === password || 'Passwords do not match'
                })}
                placeholder="Confirm New Password"
                className="input-field pl-10 bg-surface-800/50 border-surface-700 text-white"
              />
            </div>
            {errors.confirmPassword && <p className="text-red-400 text-xs mt-1 ml-1">{errors.confirmPassword.message}</p>}
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full btn-primary py-3"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Reset Password'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

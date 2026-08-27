import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, Eye, EyeOff, Loader2, User, Users, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { cn } from '../../lib/utils';

export default function LoginPage() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState('student');
  const navigate = useNavigate();
  const { login } = useAuth();

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const user = await login(data.email, data.password, role);
      toast.success('Authentication successful.');
      navigate(`/${user.role}/dashboard`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { id: 'admin', label: 'Admin' },
    { id: 'teacher', label: 'Teacher' },
    { id: 'student', label: 'Student' }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#F8F9FE] text-surface-900 font-sans">
      {/* Decorative Dots Top Right & Bottom Left */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#5932EA 2px, transparent 2px)', backgroundSize: '30px 30px', maskImage: 'radial-gradient(ellipse at top right, black, transparent 70%)', WebkitMaskImage: 'radial-gradient(ellipse at top right, black, transparent 70%)' }}></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#5932EA 2px, transparent 2px)', backgroundSize: '30px 30px', maskImage: 'radial-gradient(ellipse at bottom left, black, transparent 70%)', WebkitMaskImage: 'radial-gradient(ellipse at bottom left, black, transparent 70%)' }}></div>
      
      {/* Background shape behind illustration */}
      <div className="absolute top-1/2 left-[20%] -translate-y-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#5932EA]/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between p-6 z-10 gap-12 pt-24 md:pt-6">
        
        {/* Left Side: Branding & Illustration */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex-1 w-full max-w-lg mt-16 md:mt-0"
        >
          <h1 className="text-5xl lg:text-7xl font-extrabold text-[#0B1A40] leading-[1.1] mb-12 tracking-tight">
            Online <br/>
            Attendance <br/>
            <span className="text-[#5932EA]">System</span>
          </h1>
          
          <div className="relative w-full max-w-md mx-auto aspect-square">
            <img src="/login-illustration.jpg" alt="Attendance System" className="w-full h-full object-contain mix-blend-multiply drop-shadow-xl" />
          </div>
        </motion.div>

        {/* Right Side: Login Card */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
          className="w-full max-w-md"
        >
          <div className="bg-white rounded-2xl p-10 lg:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-surface-200 relative">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-surface-900 mb-2">Secure Access</h2>
              <p className="text-surface-500 text-sm font-medium">Enter your credentials to continue</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-surface-900 mb-2">Username</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-surface-400" />
                  </div>
                  <input
                    type="email"
                    {...register('email', { required: 'Email is required' })}
                    placeholder="Enter your username"
                    className="w-full pl-11 pr-4 py-3 bg-surface-50 border border-surface-200 text-surface-900 rounded-lg focus:bg-white focus:ring-2 focus:ring-[#5932EA]/20 focus:border-[#5932EA] transition-all placeholder:text-surface-400 font-medium"
                  />
                </div>
                {errors.email && <p className="text-red-500 text-xs mt-1 ml-1 font-medium">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-surface-900 mb-2">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-surface-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    {...register('password', { required: 'Password is required' })}
                    placeholder="Enter your password"
                    className="w-full pl-11 pr-11 py-3 bg-surface-50 border border-surface-200 text-surface-900 rounded-lg focus:bg-white focus:ring-2 focus:ring-[#5932EA]/20 focus:border-[#5932EA] transition-all placeholder:text-surface-400 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-surface-400 hover:text-surface-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1 ml-1 font-medium">{errors.password.message}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-bold text-surface-900 mb-2">Login As</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Users className="h-5 w-5 text-surface-400" />
                  </div>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full pl-11 py-3 pr-8 bg-surface-50 border border-surface-200 text-surface-900 rounded-lg focus:bg-white focus:ring-2 focus:ring-[#5932EA]/20 focus:border-[#5932EA] transition-all font-medium cursor-pointer"
                  >
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>{r.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between mt-6 mb-6">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" className="w-5 h-5 rounded-[4px] border-surface-300 text-[#5932EA] focus:ring-[#5932EA] focus:ring-offset-0" />
                  <span className="text-sm font-medium text-surface-500 group-hover:text-surface-700 transition-colors">Remember me</span>
                </label>
                
                <Link to="/forgot-password" className="text-sm font-semibold text-[#5932EA] hover:text-[#4323b8] transition-colors">
                  Forgot Password?
                </Link>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-[#5932EA] hover:bg-[#4323b8] text-white font-semibold text-base py-3.5 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 group"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    Sign In
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

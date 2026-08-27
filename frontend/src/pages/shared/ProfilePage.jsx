import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useForm } from 'react-hook-form';
import { Loader2, KeyRound, Mail, Hash, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import { getInitials, cn } from '../../lib/utils';
import { changePassword, uploadAvatar } from '../../services/authService';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = React.useRef(null);

  const newPassword = watch('newPassword');

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      await changePassword({ currentPassword: data.currentPassword, newPassword: data.newPassword });
      toast.success('Password updated successfully');
      reset();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      setUploading(true);
      const res = await uploadAvatar(formData);
      if (res.success) {
        updateUser({ avatar: res.user.avatar });
        toast.success('Profile picture updated!');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-surface-900 dark:text-white mb-6">Profile Settings</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Info Card */}
        <div className="glass-card p-6 md:col-span-1 flex flex-col items-center text-center h-fit relative">
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleAvatarChange} 
            accept="image/jpeg, image/png, image/webp"
            className="hidden" 
          />

          <div 
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold mb-4 shadow-xl shadow-primary-500/30 cursor-pointer overflow-hidden relative group",
              !user?.avatar && "bg-gradient-to-tr from-primary-500 to-primary-600 text-white"
            )}
          >
            {user?.avatar ? (
              <img src={`http://localhost:5000${user.avatar}`} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              getInitials(user?.fullName)
            )}

            {/* Hover overlay for upload */}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              {uploading ? <Loader2 className="w-6 h-6 animate-spin text-white" /> : <span className="text-white text-xs font-medium">Upload</span>}
            </div>
          </div>
          <h2 className="text-xl font-bold text-surface-900 dark:text-white">{user?.fullName}</h2>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300 capitalize mt-2 mb-6">
            {user?.role}
          </span>

          <div className="w-full space-y-4 text-left">
            <div className="flex items-center gap-3 text-sm">
              <div className="p-2 rounded-lg bg-surface-100 dark:bg-surface-800 text-surface-500">
                <Mail className="w-4 h-4" />
              </div>
              <div className="overflow-hidden">
                <p className="text-surface-500 text-xs">Email</p>
                <p className="font-medium text-surface-900 dark:text-white truncate">{user?.email}</p>
              </div>
            </div>
            
            {(user?.role === 'student' || user?.role === 'teacher') && (
              <div className="flex items-center gap-3 text-sm">
                <div className="p-2 rounded-lg bg-surface-100 dark:bg-surface-800 text-surface-500">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-surface-500 text-xs">Department</p>
                  <p className="font-medium text-surface-900 dark:text-white">{user?.department || 'N/A'}</p>
                </div>
              </div>
            )}
            
            {user?.role === 'student' && (
              <div className="flex items-center gap-3 text-sm">
                <div className="p-2 rounded-lg bg-surface-100 dark:bg-surface-800 text-surface-500">
                  <Hash className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-surface-500 text-xs">Roll Number</p>
                  <p className="font-medium text-surface-900 dark:text-white">{user?.rollNumber || 'N/A'}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Change Password Card */}
        <div className="glass-card p-6 md:col-span-2">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-surface-200 dark:border-surface-700">
            <div className="p-2.5 rounded-xl bg-primary-50 dark:bg-primary-500/10 text-primary-500">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-surface-900 dark:text-white">Change Password</h3>
              <p className="text-sm text-surface-500">Update your account password</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md">
            <div>
              <label className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-1 block">Current Password</label>
              <input 
                type="password" 
                {...register('currentPassword', { required: 'Current password is required' })} 
                className="input-field" 
              />
              {errors.currentPassword && <p className="text-red-500 text-xs mt-1">{errors.currentPassword.message}</p>}
            </div>
            
            <div>
              <label className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-1 block">New Password</label>
              <input 
                type="password" 
                {...register('newPassword', { 
                  required: 'New password is required',
                  minLength: { value: 6, message: 'Minimum 6 characters' }
                })} 
                className="input-field" 
              />
              {errors.newPassword && <p className="text-red-500 text-xs mt-1">{errors.newPassword.message}</p>}
            </div>
            
            <div>
              <label className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-1 block">Confirm New Password</label>
              <input 
                type="password" 
                {...register('confirmPassword', { 
                  required: 'Please confirm password',
                  validate: val => val === newPassword || 'Passwords do not match'
                })} 
                className="input-field" 
              />
              {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
            </div>

            <div className="pt-2">
              <button type="submit" disabled={loading} className="btn-primary w-full sm:w-auto">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Update Password
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

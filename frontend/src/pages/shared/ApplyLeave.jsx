import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useApi } from '../../hooks/useApi';
import { applyLeave, getMyLeaveRequests } from '../../services/leaveService';
import { Calendar, Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import Badge from '../../components/shared/Badge';

export default function ApplyLeave() {
  const { register, handleSubmit, reset } = useForm();
  const [submitting, setSubmitting] = useState(false);
  const { data: leaves, loading, execute } = useApi(getMyLeaveRequests);

  React.useEffect(() => {
    execute();
  }, [execute]);

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      await applyLeave(data);
      toast.success('Leave request submitted successfully');
      reset();
      execute(); // refresh list
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit leave');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Approved': return <Badge variant="success" icon={CheckCircle2}>Approved</Badge>;
      case 'Rejected': return <Badge variant="danger" icon={XCircle}>Rejected</Badge>;
      default: return <Badge variant="warning" icon={Clock}>Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-surface-900 dark:text-white flex items-center gap-2">
        <Calendar className="w-6 h-6 text-primary-500" />
        Apply for Leave
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold mb-4 text-surface-900 dark:text-white">New Request</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-1 block">Start Date</label>
                <input type="date" {...register('startDate', { required: true })} className="input-field" />
              </div>
              <div>
                <label className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-1 block">End Date</label>
                <input type="date" {...register('endDate', { required: true })} className="input-field" />
              </div>
              <div>
                <label className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-1 block">Reason</label>
                <textarea {...register('reason', { required: true })} className="input-field min-h-[100px]" placeholder="Explain why you need leave..."></textarea>
              </div>
              <button type="submit" disabled={submitting} className="btn-primary w-full">
                {submitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Submit Request'}
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="glass-card p-6 min-h-[400px]">
            <h2 className="text-lg font-semibold mb-4 text-surface-900 dark:text-white">My Leave History</h2>
            
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
              </div>
            ) : leaves?.data?.length > 0 ? (
              <div className="space-y-4">
                {leaves.data.map((leave) => (
                  <div key={leave._id} className="p-4 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-surface-900 dark:text-white">
                          {format(new Date(leave.startDate), 'MMM dd, yyyy')} - {format(new Date(leave.endDate), 'MMM dd, yyyy')}
                        </p>
                        <p className="text-sm text-surface-500 mt-1">{leave.reason}</p>
                      </div>
                      {getStatusBadge(leave.status)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-surface-500">
                <Calendar className="w-12 h-12 mb-2 opacity-50" />
                <p>No leave requests found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

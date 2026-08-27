import React, { useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { getAllLeaveRequests, updateLeaveStatus } from '../../services/leaveService';
import { ClipboardCheck, Check, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import Badge from '../../components/shared/Badge';

export default function AdminLeaveApprovals() {
  const { data: leaves, loading, execute } = useApi(getAllLeaveRequests);
  const [updatingId, setUpdatingId] = useState(null);

  React.useEffect(() => {
    execute();
  }, [execute]);

  const handleUpdateStatus = async (id, status) => {
    setUpdatingId(id);
    try {
      await updateLeaveStatus(id, status);
      toast.success(`Leave request ${status.toLowerCase()}`);
      execute();
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isExpired = (leave) => {
    if (leave.status !== 'Pending') return false;
    const startDate = new Date(leave.startDate);
    startDate.setHours(0, 0, 0, 0);
    return startDate < today;
  };

  const pendingRequests = leaves?.data?.filter(r => r.status === 'Pending' && !isExpired(r)) || [];
  const handledRequests = leaves?.data?.filter(r => r.status !== 'Pending' || isExpired(r)) || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-surface-900 dark:text-white flex items-center gap-2">
        <ClipboardCheck className="w-6 h-6 text-primary-500" />
        Leave Approvals
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6 min-h-[400px] max-h-[600px] flex flex-col">
          <h2 className="text-lg font-semibold mb-4 text-surface-900 dark:text-white flex justify-between">
            Pending Requests
            <Badge variant="warning">{pendingRequests.length}</Badge>
          </h2>

          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>
          ) : pendingRequests.length > 0 ? (
            <div className="space-y-4 overflow-y-auto pr-2 flex-1 scrollbar-thin">
              {pendingRequests.map(leave => (
                <div key={leave._id} className="p-4 rounded-xl border border-warning-200 dark:border-warning-900/50 bg-warning-50/50 dark:bg-warning-900/10">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-surface-900 dark:text-white">{leave.userId?.fullName}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold ${leave.userId?.role === 'teacher' ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300' : 'bg-surface-200 text-surface-700 dark:bg-surface-700 dark:text-surface-300'}`}>
                          {leave.userId?.role}
                        </span>
                      </div>
                      {leave.userId?.role === 'student' ? (
                        <p className="text-xs text-surface-500">{leave.userId?.rollNumber} • {leave.userId?.class}-{leave.userId?.section}</p>
                      ) : (
                        <p className="text-xs text-surface-500">{leave.userId?.department || 'Staff'}</p>
                      )}
                    </div>
                    <Badge variant="warning">Pending</Badge>
                  </div>
                  <div className="mb-4">
                    <p className="text-sm font-medium text-surface-700 dark:text-surface-300">
                      {format(new Date(leave.startDate), 'MMM dd')} - {format(new Date(leave.endDate), 'MMM dd, yyyy')}
                    </p>
                    <p className="text-sm text-surface-600 dark:text-surface-400 mt-1 italic">"{leave.reason}"</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleUpdateStatus(leave._id, 'Approved')}
                      disabled={updatingId === leave._id}
                      className="flex-1 btn-primary bg-emerald-500 hover:bg-emerald-600 text-white gap-2"
                    >
                      {updatingId === leave._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4" /> Approve</>}
                    </button>
                    <button 
                      onClick={() => handleUpdateStatus(leave._id, 'Rejected')}
                      disabled={updatingId === leave._id}
                      className="flex-1 btn-secondary text-red-600 border-red-200 hover:bg-red-50 gap-2"
                    >
                      {updatingId === leave._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><X className="w-4 h-4" /> Reject</>}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-surface-500 text-center py-8">No pending leave requests.</p>
          )}
        </div>

        <div className="glass-card p-6 min-h-[400px] max-h-[600px] flex flex-col">
          <h2 className="text-lg font-semibold mb-4 text-surface-900 dark:text-white">Past Decisions</h2>

          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>
          ) : handledRequests.length > 0 ? (
            <div className="space-y-4 overflow-y-auto pr-2 flex-1 scrollbar-thin">
              {handledRequests.map(leave => (
                <div key={leave._id} className="p-4 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50 opacity-75">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-surface-900 dark:text-white">{leave.userId?.fullName}</p>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full uppercase tracking-wider font-bold ${leave.userId?.role === 'teacher' ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300' : 'bg-surface-200 text-surface-700 dark:bg-surface-700 dark:text-surface-300'}`}>
                          {leave.userId?.role}
                        </span>
                      </div>
                      {leave.userId?.role === 'student' ? (
                        <p className="text-xs text-surface-500 mb-1">{leave.userId?.rollNumber} • {leave.userId?.class}-{leave.userId?.section}</p>
                      ) : (
                        <p className="text-xs text-surface-500 mb-1">{leave.userId?.department || 'Staff'}</p>
                      )}
                      <p className="text-sm text-surface-500">
                        {format(new Date(leave.startDate), 'MMM dd')} - {format(new Date(leave.endDate), 'MMM dd')}
                      </p>
                    </div>
                    <Badge variant={isExpired(leave) ? 'warning' : leave.status === 'Approved' ? 'success' : 'danger'}>
                      {isExpired(leave) ? 'Expired' : leave.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-surface-500 text-center py-8">No handled requests yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

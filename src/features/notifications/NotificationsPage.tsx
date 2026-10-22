import React, { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { NotificationService } from '@/services/notificationService';
import {
  NotificationItem,
  NotificationType,
  NotificationSeverity,
} from '@/types';
import {
  Bell,
  CheckCircle,
  CheckCheck,
  AlertTriangle,
  AlertCircle,
  Info,
  Calendar,
  FlaskConical,
  Pill,
  BedDouble,
  DollarSign,
  CalendarDays,
  ExternalLink,
  Filter,
  Trash2,
  Clock,
} from 'lucide-react';

export function NotificationsPage() {
  const { role } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'unread' | 'critical' | 'warning' | 'info'>('all');
  const [isLoading, setIsLoading] = useState(true);

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      const list = await NotificationService.getNotifications(role);
      setNotifications(list);
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    const unsubscribe = NotificationService.subscribe(() => {
      loadNotifications();
    });
    return unsubscribe;
  }, [role]);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  const filteredList = useMemo(() => {
    return notifications.filter((n) => {
      if (filterSeverity === 'unread') return !n.isRead;
      if (filterSeverity === 'critical') return n.severity === 'critical';
      if (filterSeverity === 'warning') return n.severity === 'warning';
      if (filterSeverity === 'info') return n.severity === 'info' || n.severity === 'success';
      return true;
    });
  }, [notifications, filterSeverity]);

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await NotificationService.markAsRead(id);
      addToast('Notification marked as read.', 'success');
      loadNotifications();
    } catch (err) {
      addToast('Failed to update notification.', 'error');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await NotificationService.markAllAsRead(role);
      addToast('All notifications marked as read.', 'success');
      loadNotifications();
    } catch (err) {
      addToast('Failed to mark all as read.', 'error');
    }
  };

  const handleNavigate = (n: NotificationItem) => {
    if (!n.isRead) {
      NotificationService.markAsRead(n.id);
    }
    if (n.linkUrl) {
      navigate(n.linkUrl);
    }
  };

  const getIconForType = (type: NotificationType, severity: NotificationSeverity) => {
    switch (type) {
      case 'lab_requested':
      case 'lab_result_verified':
        return <FlaskConical className="w-5 h-5 text-rose-600" />;
      case 'low_stock_alert':
      case 'expired_batch_alert':
        return <Pill className="w-5 h-5 text-amber-600" />;
      case 'appointment_created':
      case 'appointment_rescheduled':
      case 'appointment_cancelled':
        return <Calendar className="w-5 h-5 text-blue-600" />;
      case 'admission_created':
      case 'patient_discharged':
        return <BedDouble className="w-5 h-5 text-indigo-600" />;
      case 'invoice_created':
      case 'payment_received':
        return <DollarSign className="w-5 h-5 text-emerald-600" />;
      case 'leave_approved':
        return <CalendarDays className="w-5 h-5 text-purple-600" />;
      default:
        return severity === 'critical' ? (
          <AlertCircle className="w-5 h-5 text-rose-600" />
        ) : (
          <Info className="w-5 h-5 text-blue-600" />
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="In-App Hospital Notification Center"
        subtitle="Real-time Clinical Alerts, Panic Lab Findings, Formulary Stock Thresholds, and Operational Dispatches."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={unreadCount === 0}
              onClick={handleMarkAllRead}
              className="flex items-center gap-1.5"
            >
              <CheckCheck className="w-4 h-4 text-emerald-600" />
              Mark All as Read ({unreadCount})
            </Button>
          </div>
        }
      />

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setFilterSeverity('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filterSeverity === 'all'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Alerts ({notifications.length})
          </button>

          <button
            onClick={() => setFilterSeverity('unread')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              filterSeverity === 'unread'
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Unread
            {unreadCount > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  filterSeverity === 'unread'
                    ? 'bg-white text-blue-600'
                    : 'bg-blue-100 text-blue-700'
                }`}
              >
                {unreadCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setFilterSeverity('critical')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filterSeverity === 'critical'
                ? 'bg-rose-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Critical Panic
          </button>

          <button
            onClick={() => setFilterSeverity('warning')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filterSeverity === 'warning'
                ? 'bg-amber-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Warnings
          </button>

          <button
            onClick={() => setFilterSeverity('info')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filterSeverity === 'info'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Info & Updates
          </button>
        </div>

        <span className="text-xs text-slate-400 font-medium hidden sm:inline">
          Filtered for role: <strong className="text-slate-700 capitalize">{role.replace('_', ' ')}</strong>
        </span>
      </div>

      {/* Notifications Feed */}
      <div className="space-y-3">
        {filteredList.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-sm">
            <Bell className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-700">No Notifications</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              There are no alert items matching your selected filter. New clinical alerts and hospital dispatches will appear here automatically.
            </p>
          </div>
        ) : (
          filteredList.map((item) => {
            const isUnread = !item.isRead;
            const isCritical = item.severity === 'critical';
            const isWarning = item.severity === 'warning';

            return (
              <div
                key={item.id}
                onClick={() => handleNavigate(item)}
                className={`border rounded-xl p-4 transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs ${
                  isUnread
                    ? isCritical
                      ? 'bg-rose-50/70 border-rose-300 ring-1 ring-rose-200 hover:bg-rose-50'
                      : isWarning
                      ? 'bg-amber-50/70 border-amber-300 hover:bg-amber-50'
                      : 'bg-blue-50/70 border-blue-200 hover:bg-blue-50'
                    : 'bg-white border-slate-200 hover:bg-slate-50 opacity-90'
                }`}
              >
                <div className="flex items-start gap-3.5 flex-1">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                      isCritical
                        ? 'bg-rose-100 border-rose-200'
                        : isWarning
                        ? 'bg-amber-100 border-amber-200'
                        : 'bg-slate-100 border-slate-200'
                    }`}
                  >
                    {getIconForType(item.type, item.severity)}
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-sm font-bold ${
                          isUnread ? 'text-slate-900' : 'text-slate-700'
                        }`}
                      >
                        {item.title}
                      </span>
                      <Badge
                        variant={
                          isCritical
                            ? 'destructive'
                            : isWarning
                            ? 'warning'
                            : 'info'
                        }
                        size="sm"
                        className="uppercase text-[10px]"
                      >
                        {item.severity}
                      </Badge>
                      {item.targetRole && (
                        <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded capitalize">
                          {item.targetRole.replace('_', ' ')}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                      {item.message}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-0.5">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(item.createdAt).toLocaleString()}
                      </span>
                      {item.linkUrl && (
                        <span className="text-blue-600 font-medium flex items-center gap-0.5 hover:underline">
                          View details
                          <ExternalLink className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {isUnread ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleMarkAsRead(item.id, e)}
                      title="Mark as read"
                      className="text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-100/60"
                    >
                      <CheckCircle className="w-3.5 h-3.5 mr-1" />
                      Mark Read
                    </Button>
                  ) : (
                    <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                      <CheckCheck className="w-3.5 h-3.5 text-slate-400" />
                      Read
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

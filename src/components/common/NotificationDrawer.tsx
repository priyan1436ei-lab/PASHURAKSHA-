import React from 'react';
import { X, AlertTriangle, Stethoscope, FlaskConical, Pill, Syringe, WifiSync, CheckCircle2 } from 'lucide-react';
import { NotificationItem, UserRole } from '../../types';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  currentRole: UserRole;
  onSelectCase?: (caseId: string) => void;
  onMarkAllRead: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  currentRole,
  onSelectCase,
  onMarkAllRead,
}) => {
  if (!isOpen) return null;

  const filteredNotifs = notifications.filter(
    n => n.targetRole === 'ALL' || n.targetRole === currentRole
  );

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'OUTBREAK_HOTSPOT':
      case 'HIGH_RISK_ALERT':
        return <AlertTriangle className="w-5 h-5 text-rose-600" />;
      case 'VET_ESCALATION':
        return <Stethoscope className="w-5 h-5 text-indigo-600" />;
      case 'LAB_UPDATE':
        return <FlaskConical className="w-5 h-5 text-purple-600" />;
      case 'TREATMENT_UPDATE':
        return <Pill className="w-5 h-5 text-emerald-600" />;
      case 'VACCINATION_REMINDER':
        return <Syringe className="w-5 h-5 text-amber-600" />;
      case 'OFFLINE_SYNC':
        return <WifiSync className="w-5 h-5 text-teal-600" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-slate-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end animate-fade-in">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-slate-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-base font-bold text-slate-900">Notifications & Alerts</h2>
            <p className="text-xs text-slate-500">Real-time disease surveillance feeds</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onMarkAllRead}
              className="text-xs text-emerald-700 hover:text-emerald-900 font-medium px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 transition cursor-pointer"
            >
              Mark all read
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredNotifs.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-medium">No alerts at this moment</p>
              <p className="text-xs text-slate-400 mt-1">All herds within monitoring thresholds.</p>
            </div>
          ) : (
            filteredNotifs.map((notif) => (
              <div
                key={notif.id}
                className={`p-3.5 rounded-xl border transition ${
                  notif.type === 'OUTBREAK_HOTSPOT' || notif.type === 'HIGH_RISK_ALERT'
                    ? 'bg-rose-50/70 border-rose-200'
                    : notif.isRead
                    ? 'bg-white border-slate-200'
                    : 'bg-emerald-50/40 border-emerald-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-white shadow-xs shrink-0">
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-bold text-slate-900 truncate">
                        {notif.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {notif.message}
                    </p>
                    {notif.caseId && onSelectCase && (
                      <button
                        onClick={() => {
                          onSelectCase(notif.caseId!);
                          onClose();
                        }}
                        className="mt-2 text-xs font-semibold text-emerald-700 hover:text-emerald-800 underline cursor-pointer"
                      >
                        View Clinical Case →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 text-[11px] text-slate-500 text-center">
          In-app alerts connected to National Animal Disease Reporting System (NADRS) channel.
        </div>
      </div>
    </div>
  );
};

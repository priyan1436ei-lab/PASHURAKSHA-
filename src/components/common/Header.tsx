import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Wifi,
  WifiOff,
  Bell,
  RefreshCw,
  PhoneCall,
  Sparkles,
  User,
  Stethoscope,
  Building2,
  Globe,
} from 'lucide-react';
import { UserRole, SupportedLanguage, NotificationItem } from '../../types';
import { getTranslation } from '../../i18n/translations';
import { OfflineSyncManager } from '../../services/offlineSync';
import { api } from '../../services/api';

interface HeaderProps {
  currentRole: UserRole;
  onSelectRole: (role: UserRole) => void;
  currentLang: SupportedLanguage;
  onSelectLang: (lang: SupportedLanguage) => void;
  onOpenIVR: () => void;
  onOpenNotifications: () => void;
  onRunDemoScenario: () => void;
  unreadCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onSelectRole,
  currentLang,
  onSelectLang,
  onOpenIVR,
  onOpenNotifications,
  onRunDemoScenario,
  unreadCount,
}) => {
  const t = getTranslation(currentLang);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = OfflineSyncManager.subscribe((online, count) => {
      setIsOnline(online);
      setPendingCount(count);
    });
    return unsubscribe;
  }, []);

  const handleToggleOffline = () => {
    const newOffline = isOnline; // if online, make offline
    OfflineSyncManager.setSimulatedOffline(newOffline);
    setIsOnline(!newOffline);
  };

  const handleSyncNow = async () => {
    if (!isOnline) {
      // Bring online first
      OfflineSyncManager.setSimulatedOffline(false);
      setIsOnline(true);
    }
    setIsSyncing(true);
    try {
      await api.syncOfflineReports();
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <header className="bg-emerald-900 text-white shadow-md sticky top-0 z-40">
      {/* Top utility bar */}
      <div className="bg-emerald-950/80 px-4 py-1.5 text-xs flex flex-wrap items-center justify-between border-b border-emerald-800/40">
        <div className="flex items-center gap-2">
          <span className="bg-amber-400 text-amber-950 font-bold px-2 py-0.5 rounded text-[11px] tracking-wide">
            SIH 2026 • PS 26128
          </span>
          <span className="hidden sm:inline text-emerald-200">
            Smart Livestock Disease Surveillance & Early Warning
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Offline/Online toggle simulation */}
          <button
            onClick={handleToggleOffline}
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded font-medium transition cursor-pointer ${
              isOnline
                ? 'bg-emerald-800 hover:bg-emerald-700 text-emerald-100'
                : 'bg-amber-600 hover:bg-amber-500 text-white animate-pulse'
            }`}
            title="Click to toggle simulated network connectivity"
          >
            {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            <span>{isOnline ? 'Online' : 'Offline Mode'}</span>
            {pendingCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {pendingCount}
              </span>
            )}
          </button>

          {pendingCount > 0 && isOnline && (
            <button
              onClick={handleSyncNow}
              disabled={isSyncing}
              className="flex items-center gap-1 text-emerald-200 hover:text-white underline cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Sync {pendingCount}</span>
            </button>
          )}

          {/* Language Switcher */}
          <div className="flex items-center gap-1 border-l border-emerald-800 pl-3">
            <Globe className="w-3.5 h-3.5 text-emerald-300" />
            <select
              value={currentLang}
              onChange={(e) => onSelectLang(e.target.value as SupportedLanguage)}
              className="bg-emerald-900 text-emerald-100 text-xs rounded px-1.5 py-0.5 border border-emerald-700 focus:outline-none focus:ring-1 focus:ring-emerald-400 cursor-pointer"
            >
              <option value="en">English</option>
              <option value="hi">हिंदी (Hindi)</option>
              <option value="mr">मराठी (Marathi)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shadow-inner border border-emerald-400/30">
            <ShieldAlert className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                {t.appName}
              </h1>
              <span className="bg-emerald-700 text-emerald-100 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-emerald-600">
                PROTOTYPE MVP
              </span>
            </div>
            <p className="text-xs text-emerald-200/90 font-medium hidden sm:block">
              {t.appSubtitle}
            </p>
          </div>
        </div>

        {/* Action Controls & Role Switcher */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Guided Demo Scenario Button */}
          <button
            onClick={onRunDemoScenario}
            className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-amber-950 font-bold px-3 py-1.5 rounded-lg text-xs shadow-sm transition transform hover:-translate-y-0.5 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-950" />
            <span>Cow A102 Demo Flow</span>
          </button>

          {/* IVR Phone Hotline Simulator */}
          <button
            onClick={onOpenIVR}
            className="flex items-center gap-1.5 bg-emerald-800 hover:bg-emerald-700 text-emerald-100 px-3 py-1.5 rounded-lg text-xs font-semibold border border-emerald-700 transition cursor-pointer"
            title="Simulate Toll-free Kisan Call Center IVR voice report flow"
          >
            <PhoneCall className="w-3.5 h-3.5 text-emerald-300" />
            <span className="hidden md:inline">Kisan IVR Helpline</span>
            <span className="md:hidden">IVR</span>
          </button>

          {/* Notification Center */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-emerald-100 border border-emerald-700 transition cursor-pointer"
            title="Open Notifications and Outbreak Alerts"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Role selector segmented control */}
          <div className="bg-emerald-950/70 p-1 rounded-xl flex items-center gap-1 border border-emerald-800/60">
            <button
              onClick={() => onSelectRole('FARMER')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                currentRole === 'FARMER'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-emerald-200 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>{t.roles.FARMER}</span>
            </button>
            <button
              onClick={() => onSelectRole('VETERINARIAN')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                currentRole === 'VETERINARIAN'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-emerald-200 hover:text-white'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5" />
              <span>{t.roles.VETERINARIAN}</span>
            </button>
            <button
              onClick={() => onSelectRole('ADMIN')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                currentRole === 'ADMIN'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-emerald-200 hover:text-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.roles.ADMIN}</span>
              <span className="sm:hidden">Admin</span>
            </button>
          </div>
        </div>
      </div>

      {/* Prominent Mandatory AI Disclaimer Banner */}
      <div className="bg-amber-500/15 border-t border-amber-500/30 px-4 py-1.5 text-center text-xs text-amber-200 flex items-center justify-center gap-2">
        <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span>{t.disclaimerBanner}</span>
      </div>
    </header>
  );
};

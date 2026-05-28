import React, { useState, useEffect } from 'react';
import { Sun, Moon, Bell, Menu, ShieldAlert, LogOut } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { SearchBar, SearchItem } from '../ui/SearchBar';

interface TopBarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  title?: string;
  searchItems?: SearchItem[];
  onSearchSelect?: (item: SearchItem) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  sidebarOpen,
  setSidebarOpen,
  title = "Rturox Command Center",
  searchItems = [],
  onSearchSelect = () => {}
}) => {
  const { user, theme, toggleTheme, notifications, dismissNotification, logout } = useAuthStore();
  const [bellOpen, setBellOpen] = useState(false);

  // Initialize theme visual state on mount
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const activeAlerts = notifications || [];

  return (
    <header className={`h-16 fixed top-0 right-0 z-30 flex items-center justify-between px-4 lg:px-6 bg-brand-card/90 border-b border-brand-border/40 backdrop-blur-md transition-all duration-300 ${
      sidebarOpen ? 'left-0 lg:left-64' : 'left-0 lg:left-20'
    }`}>
      
      {/* Mobile Menu & Dashboard Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1.5 rounded-lg bg-slate-800/40 hover:bg-slate-800 border border-slate-700/50 text-slate-400 hover:text-slate-200 transition-colors focus:outline-none"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="hidden sm:block text-base font-extrabold text-slate-100 font-heading truncate max-w-[240px]">
          {title}
        </h1>
      </div>

      {/* Global Search Bar (Only shown if data is loaded) */}
      <div className="flex-1 max-w-sm mx-4">
        {searchItems.length > 0 && (
          <SearchBar
            items={searchItems}
            onSelect={onSearchSelect}
            placeholder={`Search ${user?.businessSlug === 'admin' ? 'global' : 'records'}...`}
          />
        )}
      </div>

      {/* Utilities Control Hub */}
      <div className="flex items-center gap-4">
        
        {/* Dark/Light mode toggler */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-slate-800/30 hover:bg-slate-800 border border-brand-border/40 text-slate-400 hover:text-amber-400 focus:outline-none transition-all duration-200"
          title={`Toggle to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
        >
          {theme === 'dark' ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
        </button>

        {/* Notifications Bell Dropdown */}
        <div className="relative">
          <button
            onClick={() => setBellOpen(!bellOpen)}
            className="relative p-2 rounded-xl bg-slate-800/30 hover:bg-slate-800 border border-brand-border/40 text-slate-400 hover:text-slate-200 focus:outline-none transition-all duration-200"
            title="System Alert Notifications"
          >
            <Bell className="w-4.5 h-4.5" />
            {activeAlerts.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 border border-brand-card animate-pulse"></span>
            )}
          </button>

          {/* Alerts Notification dropdown menu */}
          {bellOpen && (
            <div className="absolute right-0 mt-3 w-80 rounded-xl bg-[#12121a]/95 border border-brand-border/80 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.5)] backdrop-blur-md overflow-hidden z-50 divide-y divide-brand-border/40">
              
              <div className="p-3 bg-brand-border/10 flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-200 uppercase tracking-wider font-heading">
                  System Alerts ({activeAlerts.length})
                </span>
                {activeAlerts.length > 0 && (
                  <span className="text-[10px] text-rose-400 font-bold px-2 py-0.5 rounded-full bg-rose-950/20 border border-rose-900/30">
                    Action Required
                  </span>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-brand-border/20">
                {activeAlerts.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-1.5">
                    <span className="text-slate-400 text-lg">🎉</span>
                    No active warnings or overdue alerts.
                  </div>
                ) : (
                  activeAlerts.map((alert) => (
                    <div key={alert.id} className="p-3 flex items-start gap-2.5 hover:bg-slate-800/30 transition-colors group">
                      <ShieldAlert className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-slate-200 truncate">{alert.title}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{alert.message}</p>
                      </div>
                      <button
                        onClick={() => dismissNotification(alert.id)}
                        className="text-[9px] text-slate-500 hover:text-slate-300 font-bold self-start mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Dismiss
                      </button>
                    </div>
                  ))
                )}
              </div>
              
            </div>
          )}
        </div>

        {/* Logged in User Profile Info (desktop only) */}
        {user && (
          <div className="hidden md:flex items-center gap-3 pl-3 border-l border-brand-border/40">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-rose-500 flex items-center justify-center font-bold text-white text-xs uppercase shadow-sm">
              {user.userId.slice(0, 2)}
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-slate-200">{user.userId}</p>
              <p className="text-[9px] text-slate-400 font-semibold tracking-wide uppercase mt-0.5">
                {user.role}
              </p>
            </div>
          </div>
        )}

      </div>
    </header>
  );
};

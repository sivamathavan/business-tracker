import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Cpu,
  Home,
  GraduationCap,
  Sparkles,
  ShieldAlert,
  LogOut,
  Users,
  Settings,
  FolderKanban,
  FileCheck
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleLinkClick = () => {
    if (window.innerWidth < 768) {
      setIsOpen(false);
    }
  };

  const menuItems = [
    {
      name: 'Admin Panel',
      path: '/dashboard/admin',
      icon: Settings,
      roles: ['ADMIN'],
      color: 'text-indigo-400 group-hover:text-indigo-300',
    },
    {
      name: 'Rturox Tech',
      path: '/dashboard/tech',
      icon: Cpu,
      roles: ['ADMIN', 'rturox_tech'],
      color: 'text-brand-tech group-hover:text-brand-tech/80',
    },
    {
      name: 'AadanaTharakar',
      path: '/dashboard/realestate',
      icon: Home,
      roles: ['ADMIN', 'aadanatharakar'],
      color: 'text-brand-re group-hover:text-brand-re/80',
    },
    {
      name: 'RturoxAcademy',
      path: '/dashboard/training',
      icon: GraduationCap,
      roles: ['ADMIN', 'rturox_training'],
      color: 'text-brand-training group-hover:text-brand-training/80',
    },
    {
      name: 'CKS Tuition',
      path: '/dashboard/coaching',
      icon: Sparkles,
      roles: ['ADMIN', 'rturox_coaching'],
      color: 'text-brand-coaching group-hover:text-brand-coaching/80',
    }
  ];

  // Filter menu items by user role / business mapping
  const filteredMenu = menuItems.filter(item => {
    if (!user) return false;
    
    // Admins see all
    if (user.role === 'ADMIN') return true;

    // Regular users see only their business dashboard
    return item.roles.includes(user.userId);
  });

  return (
    <aside
      className="h-full w-64 md:w-full flex flex-col bg-brand-card border-r border-brand-border/60"
    >
      {/* Brand Header */}
      <div className={`h-20 flex items-center px-3 border-b border-brand-border/40 relative ${
        isOpen ? 'justify-start' : 'justify-center'
      }`}>
        <NavLink to="/" onClick={handleLinkClick} className="flex items-center gap-3 overflow-hidden min-w-0">
          {/* Logo image — always visible */}
          <img
            src="/logo.png"
            alt="BusinessTracker Logo"
            className="flex-shrink-0 w-14 h-14 object-contain rounded-xl drop-shadow-[0_0_12px_rgba(255,180,0,0.4)]"
          />
          {isOpen && (
            <span className="font-heading text-[11px] font-black tracking-widest text-slate-100 uppercase whitespace-nowrap leading-tight">
              Business<br />Tracker
            </span>
          )}
        </NavLink>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`absolute top-1/2 -translate-y-1/2 -right-3.5 z-50 p-1 rounded-full bg-slate-850 hover:bg-slate-700 border border-brand-border/80 text-slate-400 hover:text-slate-200 transition-all duration-200 shadow-md items-center justify-center cursor-pointer ${
            isOpen ? 'flex' : 'hidden md:flex'
          }`}
          title={isOpen ? "Collapse Sidebar" : "Expand Sidebar"}
        >
          {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>

      {/* Main Menu Links */}
      <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
        {filteredMenu.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={handleLinkClick}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold border transition-all duration-200 ${
                  isActive
                    ? 'bg-slate-800/60 text-white border-brand-border/80 shadow-md'
                    : 'text-slate-400 border-transparent hover:bg-slate-800/30 hover:text-slate-200'
                }`
              }
            >
              <Icon className={`w-5 h-5 transition-colors ${item.color}`} />
              {isOpen && <span className="truncate">{item.name}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Logged in User Profile Info & Logout */}
      <div className="p-3 border-t border-brand-border/40 space-y-2.5">
        {isOpen && user && (
          <div className="flex items-center gap-3 p-2 rounded-xl bg-brand-dark/40 border border-brand-border/20">
            <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700/80 flex items-center justify-center font-bold text-xs text-slate-300 uppercase">
              {user.userId.slice(0, 2)}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-slate-200 truncate">{user.userId}</p>
              <p className="text-[10px] text-slate-400 truncate">{user.businessName}</p>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold border border-transparent text-rose-400 hover:bg-rose-950/20 hover:border-rose-900/40 hover:text-rose-300 transition-all duration-200 ${
            isOpen ? 'justify-start' : 'justify-center'
          }`}
          title="Sign out of your session"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {isOpen && <span>Sign Out</span>}
        </button>
      </div>

    </aside>
  );
};

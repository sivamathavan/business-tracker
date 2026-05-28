import { create } from 'zustand';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1';

export interface UserProfile {
  id: string;
  userId: string;
  role: 'ADMIN' | 'USER';
  businessId: string | null;
  businessName: string;
  businessSlug: string; // 'admin', 'tech', 'realestate', 'training', 'coaching'
}

interface AlertNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  section: string;
}

interface AuthState {
  token: string | null;
  user: UserProfile | null;
  isAuthenticated: boolean;
  theme: 'dark' | 'light';
  notifications: AlertNotification[];
  isLoading: boolean;
  
  // Actions
  setToken: (token: string | null) => void;
  setUser: (user: UserProfile | null) => void;
  toggleTheme: () => void;
  setTheme: (theme: 'dark' | 'light') => void;
  setNotifications: (alerts: AlertNotification[]) => void;
  dismissNotification: (id: string) => void;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem('access_token'),
  user: JSON.parse(localStorage.getItem('user_profile') || 'null'),
  isAuthenticated: !!localStorage.getItem('access_token'),
  theme: (localStorage.getItem('theme') as 'dark' | 'light') || 'dark',
  notifications: [],
  isLoading: false,

  setToken: (token) => {
    if (token) {
      localStorage.setItem('access_token', token);
      set({ token, isAuthenticated: true });
    } else {
      localStorage.removeItem('access_token');
      set({ token: null, isAuthenticated: false });
    }
  },

  setUser: (user) => {
    if (user) {
      localStorage.setItem('user_profile', JSON.stringify(user));
      set({ user });
    } else {
      localStorage.removeItem('user_profile');
      set({ user: null });
    }
  },

  toggleTheme: () => {
    const nextTheme = get().theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    set({ theme: nextTheme });
  },

  setTheme: (theme) => {
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    set({ theme });
  },

  setNotifications: (notifications) => set({ notifications }),

  dismissNotification: (id) => set((state) => ({
    notifications: state.notifications.filter((n) => n.id !== id),
  })),

  logout: async () => {
    try {
      await axios.post(`${API_URL}/auth/logout`, {}, { withCredentials: true });
    } catch (e) {
      console.error('Logout error on server:', e);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_profile');
      set({ token: null, user: null, isAuthenticated: false, notifications: [] });
    }
  },

  checkSession: async () => {
    const token = get().token;
    if (!token) return;
    set({ isLoading: true });
    try {
      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      });
      if (response.data.success) {
        get().setUser(response.data.user);
      }
    } catch (error) {
      console.error('Session check failed, logging out...');
      get().logout();
    } finally {
      set({ isLoading: false });
    }
  }
}));

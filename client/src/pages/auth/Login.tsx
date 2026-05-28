import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast, Toaster } from 'react-hot-toast';
import { Cpu, Home, GraduationCap, Sparkles, ShieldCheck, Key, User } from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '../../store/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1';

interface LoginFormInput {
  userId: string;
  passcode: string;
  businessSlug: string;
  isAdmin: boolean;
}

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { setToken, setUser, isAuthenticated, user } = useAuthStore();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<LoginFormInput>({
    defaultValues: {
      userId: '',
      passcode: '',
      businessSlug: 'tech',
      isAdmin: false
    }
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(`/dashboard/${user.businessSlug}`);
    }
  }, [isAuthenticated, user, navigate]);

  // Sync admin checkbox with input variables
  const handleAdminToggle = (checked: boolean) => {
    setIsAdmin(checked);
    setValue('isAdmin', checked);
    if (checked) {
      setValue('businessSlug', 'admin');
    } else {
      setValue('businessSlug', 'tech');
    }
  };

  const onSubmit = async (data: LoginFormInput) => {
    setIsLoading(true);
    const loadingToast = toast.loading('Verifying credentials...');

    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        userId: data.userId,
        passcode: data.passcode,
        businessSlug: data.isAdmin ? 'admin' : data.businessSlug,
        isAdmin: data.isAdmin
      }, { withCredentials: true });

      if (response.data.success) {
        toast.success('Login successful! Redirecting...', { id: loadingToast });
        setToken(response.data.accessToken);
        setUser(response.data.user);
        
        // Dynamic redirect to correct pipeline
        setTimeout(() => {
          navigate(`/dashboard/${response.data.user.businessSlug}`);
        }, 800);
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Login failed. Please verify your User ID and passcode.';
      toast.error(msg, { id: loadingToast });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4 relative overflow-hidden font-sans select-none">
      
      {/* Visual background glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-tech/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-re/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-[#161623]/80 border border-brand-border/60 hover:border-slate-800 rounded-3xl p-8 backdrop-blur-md shadow-2xl relative z-10 transition-all duration-300">
        
        {/* Glowing Bolt Logo Header */}
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-tech via-[#8c43ff] to-brand-re flex items-center justify-center shadow-[0_0_20px_rgba(108,99,255,0.4)] animate-pulse">
            <span className="text-2xl font-black text-white">⚡</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white mt-4 font-heading tracking-tight">
            BusinessTracker
          </h2>
          <p className="text-[11px] text-slate-400 font-semibold tracking-widest uppercase mt-1">
            Multi-Tenant Business Terminal
          </p>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-8">
          
          {/* Admin Mode Toggler */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/40 border border-brand-border/30">
            <div className="flex items-center gap-2">
              <ShieldCheck className={`w-5 h-5 ${isAdmin ? 'text-indigo-400' : 'text-slate-500'}`} />
              <div>
                <p className="text-xs font-bold text-slate-200">System Admin Portal</p>
                <p className="text-[9px] text-slate-500 font-medium">Bypasses business restrictions</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isAdmin}
                onChange={(e) => handleAdminToggle(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600 peer-checked:after:bg-white"></div>
            </label>
          </div>

          {/* Business Selector (only shown if regular user login) */}
          {!isAdmin && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                Select Business Tenant
              </label>
              <div className="relative">
                <select
                  {...register('businessSlug')}
                  className="w-full pl-3 pr-10 py-2.5 bg-slate-900 border border-brand-border/60 focus:border-brand-tech rounded-xl text-xs text-slate-200 font-semibold focus:outline-none transition-all duration-200 appearance-none"
                >
                  <option value="tech">💻 Business 1 — Rturox Technology</option>
                  <option value="realestate">🏠 Business 2 — AadanaTharakar</option>
                  <option value="training">🎓 Business 3 — RturoxAcademy</option>
                  <option value="coaching">🌟 Business 4 — CKS Tuition</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                  <svg className="fill-current h-4 w-4" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
            </div>
          )}

          {/* User ID Field */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
              User ID Credentials
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Enter User ID"
                {...register('userId', { required: 'User ID is required' })}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-brand-border/60 hover:border-slate-800 focus:border-brand-tech/80 rounded-xl text-xs text-slate-200 focus:outline-none transition-all duration-200"
              />
            </div>
            {errors.userId && (
              <span className="text-[10px] font-semibold text-rose-500 px-1">{errors.userId.message}</span>
            )}
          </div>

          {/* Passcode Field PIN (6-digit) */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
              Passcode PIN (6 Digits)
            </label>
            <div className="relative">
              <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="password"
                maxLength={6}
                placeholder="••••••"
                {...register('passcode', {
                  required: '6-digit passcode is required',
                  pattern: { value: /^\d{6}$/, message: 'Passcode must be numeric digits only' }
                })}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-brand-border/60 hover:border-slate-800 focus:border-indigo-500/80 rounded-xl text-xs text-slate-200 tracking-widest font-mono focus:outline-none transition-all duration-200"
              />
            </div>
            {errors.passcode && (
              <span className="text-[10px] font-semibold text-rose-500 px-1">{errors.passcode.message}</span>
            )}
          </div>

          {/* Log-In Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-wider text-white bg-gradient-to-r ${
              isAdmin 
                ? 'from-indigo-600 via-[#8c43ff] to-rose-500 hover:shadow-[0_0_20px_rgba(108,99,255,0.4)]' 
                : 'from-brand-tech to-[#8b5cf6] hover:shadow-[0_0_20px_rgba(108,99,255,0.3)]'
            } transition-all duration-300 font-heading focus:outline-none flex items-center justify-center disabled:opacity-50`}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <span>Decrypt & Establish Session</span>
            )}
          </button>

        </form>

        {/* footer details */}
        <p className="text-[10px] text-slate-500 font-semibold text-center mt-6 tracking-wide">
          Protected under AES multi-tenant JWT protocols.
        </p>

      </div>
      <Toaster position="bottom-right" />
    </div>
  );
};
export default Login;

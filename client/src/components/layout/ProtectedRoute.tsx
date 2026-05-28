import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedSlugs?: string[]; // 'admin', 'tech', 'realestate', 'training', 'coaching'
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedSlugs
}) => {
  const { isAuthenticated, user, isLoading } = useAuthStore();

  // Show loading spinner if checking session
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-brand-tech border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest font-heading">
            Authenticating Session...
          </p>
        </div>
      </div>
    );
  }

  // Not authenticated -> redirect to login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Gates role and business access
  if (allowedSlugs && allowedSlugs.length > 0) {
    const isUserAdmin = user.role === 'ADMIN';
    const hasBusinessSlugAccess = allowedSlugs.includes(user.businessSlug);

    // If neither admin nor belongs to this business slug
    if (!isUserAdmin && !hasBusinessSlugAccess) {
      console.warn(`Access denied for "${user.userId}" to slug:`, allowedSlugs);
      // Auto-redirect to correct business dashboard home
      return <Navigate to={`/dashboard/${user.businessSlug}`} replace />;
    }
  }

  // Authenticated and authorized -> render page
  return <>{children}</>;
};
export default ProtectedRoute;

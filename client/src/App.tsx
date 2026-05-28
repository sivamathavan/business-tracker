import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import ProtectedRoute from './components/layout/ProtectedRoute';
import Login from './pages/auth/Login';

// Import Dashboards (Placeholders created in pages/ folders)
import AdminDashboard from './pages/admin/AdminDashboard';
import TechDashboard from './pages/tech/TechDashboard';
import ReDashboard from './pages/realestate/ReDashboard';
import TrainingDashboard from './pages/training/TrainingDashboard';
import CoachingDashboard from './pages/coaching/CoachingDashboard';

// Custom Wrapper layout for dashboards to share the TopBar & Sidebar shell
const DashboardLayout: React.FC<{ children: React.ReactNode; title: string }> = ({ children, title }) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(() => window.innerWidth >= 1024);
  
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0f] text-slate-800 dark:text-slate-100 flex transition-colors duration-300">
      {/* Mobile backdrop overlay — only visible on small screens */}
      {sidebarOpen && (
        <div 
          className="print-hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar:
          - Mobile/tablet (<1024px): fixed overlay, slides in/out
          - Desktop (≥1024px): sticky in-flow, always visible, pushes content */}
      <div className={`print-hidden flex-shrink-0 transition-all duration-300
        fixed inset-y-0 left-0 z-40
        lg:sticky lg:top-0 lg:h-screen lg:z-auto
        ${sidebarOpen
          ? 'w-64 translate-x-0'
          : 'w-64 -translate-x-full lg:translate-x-0 lg:w-20'
        }`}
      >
        <SidebarShell isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      </div>

      {/* Main viewport — flex-1 takes remaining width after sidebar on desktop */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <TopBarShell 
          sidebarOpen={sidebarOpen} 
          setSidebarOpen={setSidebarOpen} 
          title={title} 
        />
        
        {/* Main printable scroll container */}
        <main className="flex-grow pt-20 pb-12 px-4 lg:px-8 overflow-y-auto print-container">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};


// Simplified local components to prevent early dependency circular errors before files are fully written
import { Sidebar as SidebarShell } from './components/layout/Sidebar';
import { TopBar as TopBarShell } from './components/layout/TopBar';

const App: React.FC = () => {
  const { checkSession, isAuthenticated, user } = useAuthStore();

  // Validate session token on bootstrap
  useEffect(() => {
    checkSession();
  }, [checkSession]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Auth routes */}
        <Route path="/login" element={<Login />} />

        {/* Dashboard routes nested inside Layout shells */}
        <Route
          path="/dashboard/admin"
          element={
            <ProtectedRoute allowedSlugs={['admin']}>
              <DashboardLayout title="Master Admin Command Center">
                <AdminDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/tech"
          element={
            <ProtectedRoute allowedSlugs={['tech']}>
              <DashboardLayout title="💻 Rturox Technology Dashboard">
                <TechDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/realestate"
          element={
            <ProtectedRoute allowedSlugs={['realestate']}>
              <DashboardLayout title="🏠 DreamKey Properties Dashboard">
                <ReDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/training"
          element={
            <ProtectedRoute allowedSlugs={['training']}>
              <DashboardLayout title="🎓 Rturox Tech Training Portal">
                <TrainingDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/coaching"
          element={
            <ProtectedRoute allowedSlugs={['coaching']}>
              <DashboardLayout title="🌟 Rturox Coaching Centre Portal">
                <CoachingDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* Catch-all redirects */}
        <Route
          path="*"
          element={
            isAuthenticated && user ? (
              <Navigate to={`/dashboard/${user.businessSlug}`} replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;

import React, { useState, useEffect } from 'react';
import { ViewState, BrandProfile, User } from './types';
import { getCurrentUser, getProfile, saveProfile, logoutUser } from './services/storage';
import BrandSurvey from './components/BrandSurvey';
import ContentCalendar from './components/ContentCalendar';
import AdminDashboard from './components/AdminDashboard';
import Login from './components/Login';
import { LayoutDashboard, Calendar, ShieldCheck, LogOut, Lock } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.LOGIN);
  const [user, setUser] = useState<User | null>(null);
  const [brandProfile, setBrandProfile] = useState<BrandProfile | null>(null);

  useEffect(() => {
    // Check for existing session on load
    const currentUser = getCurrentUser();
    if (currentUser) {
      handleLogin(currentUser);
    }
    // Check URL hash for admin back door
    if (window.location.hash === '#admin-portal') {
      setView(ViewState.ADMIN_LOGIN);
    }
  }, []);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    
    if (loggedInUser.role === 'admin') {
      setView(ViewState.ADMIN_DASHBOARD);
    } else {
      // Check if user has a profile
      const profile = getProfile(loggedInUser.id);
      if (profile) {
        setBrandProfile(profile);
        setView(ViewState.CALENDAR);
      } else {
        // No profile, go to survey
        setView(ViewState.SURVEY);
      }
    }
  };

  const handleLogout = () => {
    logoutUser();
    setUser(null);
    setBrandProfile(null);
    setView(ViewState.LOGIN);
  };

  const handleSurveyComplete = (profileData: BrandProfile) => {
    if (!user) return;
    const newProfile = { ...profileData, userId: user.id };
    saveProfile(newProfile);
    setBrandProfile(newProfile);
    setView(ViewState.CALENDAR);
  };

  const renderContent = () => {
    switch (view) {
      case ViewState.LOGIN:
        return <Login onLogin={handleLogin} onNavigate={setView} />;
      case ViewState.ADMIN_LOGIN:
        return <Login onLogin={handleLogin} onNavigate={setView} isAdminLogin={true} />;
      case ViewState.SURVEY:
        return <BrandSurvey onComplete={handleSurveyComplete} />;
      case ViewState.CALENDAR:
        return (user && brandProfile) ? <ContentCalendar profile={brandProfile} userId={user.id} /> : <div>Loading...</div>;
      case ViewState.ADMIN_DASHBOARD:
        return (user && user.role === 'admin') ? <AdminDashboard /> : <div className="text-center p-10">Access Denied</div>;
      default:
        return <Login onLogin={handleLogin} onNavigate={setView} />;
    }
  };

  // Safe navigation guard
  const showNav = user !== null;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Navigation - Only show if logged in */}
      {showNav && (
        <nav className="bg-white border-b border-slate-100 sticky top-0 z-50">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center cursor-pointer">
                 <span className="text-2xl font-bold text-slate-800 tracking-tight">Kawayan<span className="text-emerald-500">.</span></span>
                 {user?.role === 'admin' && <span className="ml-2 px-2 py-0.5 bg-slate-800 text-white text-[10px] uppercase font-bold rounded">Admin</span>}
              </div>
              
              <div className="flex items-center space-x-4">
                {view === ViewState.CALENDAR && (
                   <div className="hidden md:flex items-center gap-2 text-slate-500 text-sm mr-4">
                     <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                     {user?.businessName}
                   </div>
                )}
                
                <div className="h-6 w-px bg-slate-200"></div>
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-slate-400 hover:text-rose-600 transition text-sm font-medium"
                >
                  <LogOut className="w-4 h-4" /> <span className="hidden md:inline">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </nav>
      )}

      {/* Main Content */}
      <main className={`flex-grow ${!showNav ? 'flex items-center justify-center' : ''}`}>
        <div className={`w-full ${showNav ? 'max-w-[1600px] mx-auto py-6 px-4 sm:px-6 lg:px-8' : 'w-full'}`}>
          {renderContent()}
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-slate-400 text-sm">&copy; 2025 Kawayan AI. Designed for Philippine SMEs.</p>
          {!user && view !== ViewState.ADMIN_LOGIN && (
             <button 
               onClick={() => setView(ViewState.ADMIN_LOGIN)} 
               className="mt-4 text-xs text-slate-200 hover:text-slate-400 transition flex items-center gap-1 mx-auto"
             >
               <Lock className="w-3 h-3"/> Staff Access
             </button>
          )}
        </div>
      </footer>
    </div>
  );
};

export default App;

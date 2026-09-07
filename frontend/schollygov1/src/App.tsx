import React, { useState, useEffect, Suspense, lazy, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, BookOpen, ScrollText, Map, TrendingUp, Play, Bell,
  User as UserIcon, LogOut, Zap, 
  Menu, X, ChevronLeft, Sun, Moon
} from 'lucide-react';
import { Logo } from './components/ui/Logo';
import { useAuthStore } from './stores/auth';
import { useAppStore } from './stores/appStore';
import PWAInstallBanner from './components/ui/PWAInstallBanner';

const Dashboard = lazy(() => import('./views/dashboard/Dashboard'));
const LoginView = lazy(() => import('./views/auth/LoginView'));
const SignupView = lazy(() => import('./views/auth/SignupView'));
const ChapterView = lazy(() => import('./views/learning/ChapterView'));
const ChapterDetailView = lazy(() => import('./views/learning/ChapterDetailView'));
const QuizArena = lazy(() => import('./views/learning/QuizArena'));
const ProfileView = lazy(() => import('./views/dashboard/ProfileView'));
const AnalyticsView = lazy(() => import('./views/dashboard/AnalyticsView'));
const DesignSystemView = lazy(() => import('./views/internal/DesignSystemView'));
import { Sidebar } from './components/layout/Sidebar';
import { TopNavbar } from './components/layout/TopNavbar';

export default function App() {
  const { user, isLoading, logout, fetchUser } = useAuthStore();
  const [currentRoute, setCurrentRoute] = useState(() => {
    if (window.location.pathname === '/design-system') return 'design-system';
    return (localStorage.getItem('token') || sessionStorage.getItem('token')) ? 'dashboard' : 'login';
  });
  const [prefilledMobile, setPrefilledMobile] = useState('');
  const { 
    theme, toggleTheme,
    selectedSubject, setSelectedSubject,
    selectedChapter, setSelectedChapter,
    chaptersCache, setChaptersCache, updateChapterInCache
  } = useAppStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<any>(null);
  const [selectedNextTopic, setSelectedNextTopic] = useState<any>(null);
  const [quizSettings, setQuizSettings] = useState<{ difficulty?: 'easy'|'medium'|'hard'|'adaptive', type?: 'practice'|'assignment'|'mistakes', assignmentId?: number }>({});

  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  }, [currentRoute, selectedSubject, selectedChapter]);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

  useEffect(() => {
     if (!isLoading) {
         if (!user && currentRoute !== 'login' && currentRoute !== 'signup') {
             setCurrentRoute('login');
         } else if (user && (currentRoute === 'login' || currentRoute === 'signup')) {
             setCurrentRoute('dashboard');
         }
     }
  }, [user, isLoading, currentRoute]);

  useEffect(() => {
     // Force dark theme until light theme is fine-tuned
     document.documentElement.classList.add('dark');
     document.documentElement.classList.remove('light');
  }, []);

  const handleNavigation = (targetRoute: string, data?: any) => {
    console.log('NAVIGATING TO', targetRoute, data);
    // Navigation Bridge: Catches legacy string emits from child views
    const routeDictionary: Record<string, string> = {
      'dashboard': 'dashboard',
      'profile': 'profile',
      'profileview': 'profile',
      'analytics': 'analytics'
    };

    if (targetRoute === 'chapterview' && data !== undefined) {
      setSelectedSubject(data);
      setCurrentRoute('chapterview');
      setIsMobileMenuOpen(false);
      return;
    }

    if (targetRoute.startsWith('subject_')) {
      const subjectId = targetRoute.split('_')[1];
      setSelectedSubject(subjectId);
      setCurrentRoute('chapterview');
      setIsMobileMenuOpen(false);
      return;
    }

    const targetLower = targetRoute.toLowerCase();
    const mappedRouteName = routeDictionary[targetLower] || targetLower;
    const validRoutes = ['dashboard', 'profile', 'analytics', 'login', 'signup', 'chapterview', 'chapterdetail', 'quiz', 'design-system'];
    
    if (validRoutes.includes(mappedRouteName)) {
      setCurrentRoute(mappedRouteName);
    } else {
      // Dynamic Subject Fallback: treat any unknown route as a subject name
      setPrefilledMobile(mappedRouteName);
      setSelectedSubject(mappedRouteName);
      setCurrentRoute('chapterview');
    }
    
    setIsMobileMenuOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('token');
    logout();
    setCurrentRoute('login');
    setIsMobileMenuOpen(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-voltage-yellow border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }



  const LoadingFallback = (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-voltage-yellow border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (currentRoute === 'login') {
    return (
      <Suspense fallback={LoadingFallback}>
        <LoginView 
          apiBase={API_BASE_URL}
          prefilledMobile={prefilledMobile}
          onLoginSuccess={() => setCurrentRoute('dashboard')}
          onNavigate={handleNavigation}
        />
      </Suspense>
    );
  }

  if (currentRoute === 'signup') {
    return (
      <Suspense fallback={LoadingFallback}>
        <SignupView 
          apiBase={import.meta.env.VITE_API_URL} 
          onSignupSuccess={() => setCurrentRoute('dashboard')}
          onToggleLogin={(mobile) => {
            setPrefilledMobile(mobile || '');
            setCurrentRoute('login');
          }}
          onNavigate={setCurrentRoute}
        />
      </Suspense>
    );
  }

  const renderContent = () => {
    switch (currentRoute) {
      case 'design-system':
        return <DesignSystemView />;
      case 'dashboard':
        return <Dashboard apiBase={API_BASE_URL} onNavigate={handleNavigation} />;
      case 'chapterview':
        return (
          <ChapterView 
             apiBase={API_BASE_URL} 
             onLogout={handleLogout} 
             onNavigate={handleNavigation}
             onViewChapter={(chapter) => {
               setSelectedChapter(chapter);
               setCurrentRoute('chapterdetail');
             }} 
          />
        );
      case 'chapterdetail':
        return (
          <ChapterDetailView
            chapter={selectedChapter}
            apiBase={API_BASE_URL}
            onBack={() => setCurrentRoute('chapterview')}
            onStartQuiz={(topic, nextTopic) => {
              setSelectedTopic(topic);
              setSelectedNextTopic(nextTopic);
              setQuizSettings({ difficulty: topic ? ((topic.accuracy || 0) >= 90 ? undefined : 'easy') : 'adaptive' });
              setCurrentRoute('quiz');
            }}
          />
        );
      case 'quiz':
        return (
          <QuizArena
            chapter={selectedChapter}
            topic={selectedTopic}
            apiBase={API_BASE_URL}
            onBack={() => {
              setCurrentRoute('chapterdetail');
            }}
            onNavigate={handleNavigation}
            predefinedDifficulty={quizSettings.difficulty}
            quizType={quizSettings.type || 'practice'}
            onNextWarmup={selectedNextTopic ? () => {
              setSelectedTopic(selectedNextTopic);
              setSelectedNextTopic(null); // Or recalculate, but easier to just clear it if we don't have the full list here
              setQuizSettings({ difficulty: (selectedNextTopic.accuracy || 0) >= 90 ? undefined : 'easy' });
              // We trigger a re-render with the new topic. But QuizArena resets internal state on mount. 
              // Since it's the same component, we need to ensure QuizArena reacts to topic prop change, 
              // or we unmount and remount.
              setCurrentRoute('quiz'); 
            } : undefined}
            onStartAdaptive={() => {
              setSelectedTopic(null);
              setSelectedNextTopic(null);
              setQuizSettings({ difficulty: 'adaptive' });
              setCurrentRoute('quiz');
            }}
            onQuizComplete={(result) => {
              console.log('Quiz finished', result);
              fetchUser(); // Refresh user data
              
              if (selectedChapter) {
                 const prevAttempts = selectedChapter.attempts || 0;
                 const newAttempts = prevAttempts + 1;
                 const prevAcc = selectedChapter.accuracy || 0;
                 // Use new_chapter_mastery for the chapter's mastery update
                 const finalAcc = result.new_chapter_mastery !== undefined && result.new_chapter_mastery !== null 
                                     ? result.new_chapter_mastery 
                                     : prevAcc;

                 const updatedChapter = {
                     ...selectedChapter,
                     attempts: newAttempts,
                     accuracy: finalAcc
                 };
                 
                 setSelectedChapter(updatedChapter);

                 if (selectedSubject) {
                     const subjStr = typeof selectedSubject === 'string' ? selectedSubject : (selectedSubject as any).id;
                     if (subjStr) {
                         updateChapterInCache(subjStr, selectedChapter.id, { attempts: newAttempts, accuracy: finalAcc });
                     }
                 }
              }
            }}
          />
        );

      case 'analytics':
        return <AnalyticsView apiBase={API_BASE_URL} onNavigate={handleNavigation} />;
      case 'profile':
        return (
          <ProfileView apiBase={API_BASE_URL} onNavigate={handleNavigation} />
        );
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full space-y-4 text-center p-8 max-w-sm mx-auto">
             <h2 className="text-2xl font-bold text-red-400">Sector Not Found</h2>
             <p className="text-gray-400 text-sm">The route "{currentRoute}" is currently unreachable.</p>
             <button 
               onClick={() => handleNavigation('dashboard')} 
               className="bg-brand-primary hover:bg-yellow-400 text-deep-space font-bold py-3 px-8 rounded-xl transition-all shadow-[0_0_15px_rgba(250,204,21,0.3)]"
             >
               Return to Basecamp
             </button>
          </div>
        );
    }
  }

  const navItems = [
    { id: 'dashboard', label: 'Basecamp', icon: LayoutDashboard },
    { id: 'analytics', label: 'Progress', icon: TrendingUp },
    { id: 'profile', label: 'Profile', icon: UserIcon },
  ];

  // Derive player stats for the TopNavbar
  const playerStats = {
    id: user?.username || user?.fullName || 'Player One',
    avatar: user?.avatar_seed ? (user.avatar_seed.startsWith('http') ? user.avatar_seed : `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.avatar_seed}&backgroundColor=1A1A1A`) : `https://api.dicebear.com/7.x/avataaars/svg?seed=player_one&backgroundColor=1A1A1A`,
    streak: user?.current_streak ?? user?.streak ?? 0,
    xp: user?.total_xp ?? user?.xp ?? user?.score ?? 0,
  };

  return (
    <div className="flex h-screen w-full overflow-hidden overflow-x-hidden bg-bg-app text-text-primary font-sans selection:bg-brand-primary/30 selection:text-white relative">
      <PWAInstallBanner />
      
      {/* Desktop Sidebar / Navigation */}
      <Sidebar 
        currentRoute={currentRoute}
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        onNavigate={handleNavigation}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main ref={mainRef} className="flex-1 overflow-y-auto relative bg-transparent pb-24 md:pb-8">
        
        {/* Decorative Background Glows */}
        <div className="fixed top-[-10%] left-[20%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none z-0"></div>
        <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-brand-primary/5 rounded-full blur-[100px] pointer-events-none z-0"></div>

        {/* Header Section */}
        <TopNavbar 
          player={playerStats} 
          onLogout={handleLogout}
          onNavigate={handleNavigation}
          onToggleMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />

        <div className="relative z-10 h-full w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentRoute}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="h-full w-full"
            >
              <Suspense fallback={
                <div className="flex h-full items-center justify-center">
                  <div className="w-8 h-8 border-4 border-voltage-yellow border-t-transparent rounded-full animate-spin"></div>
                </div>
              }>
                {renderContent()}
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile Bottom Tab Bar */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-bg-app border-t border-white/5 pb-4 z-50">
        <div className="flex justify-around items-center h-16 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentRoute === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.id)}
                className="flex flex-col items-center justify-center gap-1 w-16 focus:outline-none"
              >
                <Icon className={`w-6 h-6 ${isActive ? 'text-brand-primary' : 'text-text-muted hover:text-text-secondary'}`} />
                <span className={`text-[10px] font-bold tracking-wide ${isActive ? 'text-brand-primary' : 'text-text-muted'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

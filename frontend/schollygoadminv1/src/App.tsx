import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, BookOpen, ScrollText, 
  BarChart3, User as UserIcon, LogOut, Zap, 
  Menu, X, ChevronLeft, Users, Settings
} from 'lucide-react';
import Dashboard from './views/dashboard/Dashboard';
import AssignmentsView from './views/learning/AssignmentsView';
import LoginView from './views/auth/LoginView';
import SignupView from './views/auth/SignupView';
import ChapterView from './views/learning/ChapterView';
import ChapterDetailView from './views/learning/ChapterDetailView';
import QuizArena from './views/learning/QuizArena';
import ProfileView from './views/dashboard/ProfileView';
import { Logo } from './components/ui/Logo';
import { useAuthStore } from './stores/auth';

import AnalyticsView from './views/dashboard/AnalyticsView';
import ManageAssignmentsView from './views/dashboard/ManageAssignmentsView';
import BatchDetailView from './views/dashboard/BatchDetailView';
import SubjectDetailView from './views/dashboard/SubjectDetailView';
import UploadContentView from './views/dashboard/UploadContentView';

import SetupView from './views/dashboard/SetupView';
import BatchesView from './views/dashboard/BatchesView';
import TeachersView from './views/dashboard/TeachersView';

export default function App() {
  const { user, isLoading, logout, fetchUser } = useAuthStore();
  const [currentRoute, setCurrentRoute] = useState(() => {
    return localStorage.getItem('token') ? 'dashboard' : 'login';
  });
  const [prefilledMobile, setPrefilledMobile] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('math');
  const [selectedChapter, setSelectedChapter] = useState<any>(null);
  const [selectedBatch, setSelectedBatch] = useState<any>(null);
  const [selectedSubjectData, setSelectedSubjectData] = useState<any>(null);
  const [selectedChapterData, setSelectedChapterData] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_URL || '';

  useEffect(() => {
     if (!isLoading) {
         if (!user && currentRoute !== 'login' && currentRoute !== 'signup') {
             setCurrentRoute('login');
         } else if (user && (currentRoute === 'login' || currentRoute === 'signup')) {
             setCurrentRoute('dashboard');
         }
     }
  }, [user, isLoading, currentRoute]);

  const [quizSettings, setQuizSettings] = useState<{difficulty?: 'easy' | 'medium' | 'hard', type?: 'practice' | 'assignment'}>({});

  const handleNavigation = (targetRoute: string, data?: any) => {
    // Navigation Bridge: Catches legacy string emits from child views
    const routeDictionary: Record<string, string> = {
      'dashboard': 'dashboard',
      'profile': 'profile',
      'profileview': 'profile',
      'assignments': 'assignments',
      'manage_assignments': 'manage_assignments',
      'batch_detail': 'batch_detail',
      'subject_detail': 'subject_detail',
      'upload_content': 'upload_content',
      'analytics': 'analytics',
      'setup': 'setup',
      'batches': 'batches',
      'teachers': 'teachers'
    };

    if (targetRoute === 'chapterview' && data !== undefined) {
      setSelectedSubject(data);
      setCurrentRoute('chapterview');
      setIsMobileMenuOpen(false);
      return;
    }

    if (targetRoute === 'batch_detail' && data !== undefined) {
      setSelectedBatch(data);
      setCurrentRoute('batch_detail');
      setIsMobileMenuOpen(false);
      return;
    }

    if (targetRoute === 'subject_detail' && data !== undefined) {
      setSelectedSubjectData(data);
      setCurrentRoute('subject_detail');
      setIsMobileMenuOpen(false);
      return;
    }

    if (targetRoute === 'upload_content' && data !== undefined) {
      setSelectedChapterData(data);
      setCurrentRoute('upload_content');
      setIsMobileMenuOpen(false);
      return;
    }

    if (targetRoute.startsWith('subject_')) {
      const subjectCode = targetRoute.split('_')[1];
      setSelectedSubject(subjectCode);
      setCurrentRoute('chapterview');
      setIsMobileMenuOpen(false);
      return;
    }

    const targetLower = targetRoute.toLowerCase();
    const isSubject = ['math', 'mathematics', 'sci', 'science', 'eng', 'english', 'sst', 'social', 'hindi', 'computer'].includes(targetLower);
    
    if (isSubject) {
      setPrefilledMobile(targetLower); // Or store subject specifically, but let's add selectedSubject state instead
      setSelectedSubject(targetLower);
      setCurrentRoute('chapterview');
    } else {
      const mappedRouteName = routeDictionary[targetLower] || targetLower;
      setCurrentRoute(mappedRouteName);
    }
    
    setIsMobileMenuOpen(false);
  };

  const [chaptersCache, setChaptersCache] = useState<Record<string, any[]>>({});

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

  if (currentRoute === 'login') {
    return (
      <LoginView 
        apiBase={API_BASE_URL}
        prefilledMobile={prefilledMobile}
        onLoginSuccess={() => setCurrentRoute('dashboard')}
        onNavigate={handleNavigation}
      />
    );
  }

  if (currentRoute === 'signup') {
    return (
      <SignupView 
        apiBase={import.meta.env.VITE_API_URL} 
        onToggleLogin={(mobile) => {
          setPrefilledMobile(mobile || '');
          setCurrentRoute('login');
        }}
        onNavigate={setCurrentRoute}
      />
    );
  }

  const renderContent = () => {
    switch (currentRoute) {
      case 'dashboard':
        return <Dashboard apiBase={API_BASE_URL} onNavigate={handleNavigation} />;
      case 'chapterview':
        return (
          <ChapterView 
             initialSubject={selectedSubject} 
             apiBase={API_BASE_URL} 
             userSession={user}
             coins={user?.coins || 0}
             onLogout={handleLogout} 
             onNavigate={handleNavigation}
             chaptersCache={chaptersCache}
             setChaptersCache={setChaptersCache}
             onViewChapter={(chapter) => {
               setSelectedChapter(chapter);
               setCurrentRoute('chapterdetail');
             }} 
          />
        );
      case 'chapterdetail':
        return (
          <ChapterDetailView
            subject={selectedSubject}
            chapter={selectedChapter}
            userSession={{ token: localStorage.getItem('token') }}
            coins={user?.coins || 0}
            apiBase={API_BASE_URL}
            onBack={() => setCurrentRoute('chapterview')}
            onStartQuiz={() => {
              setQuizSettings({});
              setCurrentRoute('quiz');
            }}
          />
        );
      case 'quiz':
        return (
          <QuizArena
            chapter={selectedChapter}
            userSession={{ token: localStorage.getItem('token'), total_xp: user?.xp || 0 }}
            apiBase={API_BASE_URL}
            onBack={() => {
              if (quizSettings.type === 'assignment') {
                  setCurrentRoute('assignments');
              } else {
                  setCurrentRoute('chapterdetail');
              }
            }}
            onNavigate={handleNavigation}
            predefinedDifficulty={quizSettings.difficulty}
            quizType={quizSettings.type || 'practice'}
            onQuizComplete={(result) => {
              console.log('Quiz finished', result);
              fetchUser(); // Refresh user data
              
              // Update local chapters state so chapter detail shows new mastery
              setSelectedChapter((prev: any) => {
                 if (!prev) return prev;
                 const prevAttempts = prev.attempts || 0;
                 const newAttempts = prevAttempts + 1;
                 const prevAcc = prev.accuracy || 0;
                 const sessionAcc = result.accuracy || 0;
                 // running average for mock if backend new_accuracy is missing
                 const mockNewAcc = Math.round(((prevAcc * prevAttempts) + sessionAcc) / newAttempts);
                 const finalAcc = result.new_accuracy !== undefined ? result.new_accuracy : mockNewAcc;

                 // Update chapters cache to persist accuracy across route changes
                 setChaptersCache(prevCache => {
                    const newCache = { ...prevCache };
                    if (selectedSubject) {
                        const chapterList = newCache[selectedSubject];
                        if (chapterList) {
                            newCache[selectedSubject] = chapterList.map(ch => 
                                ch.id === prev.id ? { ...ch, attempts: newAttempts, accuracy: finalAcc } : ch
                            );
                        }
                    }
                    return newCache;
                 });
                 
                 return {
                    ...prev,
                    attempts: newAttempts,
                    accuracy: finalAcc
                 };
              });
            }}
          />
        );
      case 'assignments':
        return <AssignmentsView 
                  apiBase={API_BASE_URL} 
                  userSession={{ token: localStorage.getItem('token') || localStorage.getItem('access_token') }} 
                  onNavigate={handleNavigation} 
                  onStartQuiz={(chapterCode: string, difficulty: 'easy' | 'medium' | 'hard', type: 'practice' | 'assignment') => {
                      setSelectedChapter({ id: chapterCode });
                      setQuizSettings({ difficulty, type });
                      setCurrentRoute('quiz');
                  }}
               />;
      case 'manage_assignments':
        return <ManageAssignmentsView onNavigate={handleNavigation} />;
      case 'batch_detail':
        return <BatchDetailView batch={selectedBatch} onNavigate={handleNavigation} />;
      case 'subject_detail':
        return <SubjectDetailView payload={selectedSubjectData} onNavigate={handleNavigation} />;
      case 'upload_content':
        return <UploadContentView payload={selectedChapterData} onNavigate={handleNavigation} />;
      case 'analytics':
        return <AnalyticsView apiBase={API_BASE_URL} onNavigate={handleNavigation} />;
      case 'profile':
        return (
          <ProfileView apiBase={API_BASE_URL} />
        );
      case 'setup':
        return <SetupView apiBase={API_BASE_URL} onNavigate={handleNavigation} />;
      case 'batches':
        return <BatchesView apiBase={API_BASE_URL} onNavigate={handleNavigation} />;
      case 'teachers':
        return <TeachersView apiBase={API_BASE_URL} onNavigate={handleNavigation} />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full space-y-4 text-center p-8 max-w-sm mx-auto">
             <h2 className="text-2xl font-bold text-red-400">Sector Not Found</h2>
             <p className="text-gray-400 text-sm">The route "{currentRoute}" is currently unreachable.</p>
             <button 
               onClick={() => handleNavigation('dashboard')} 
               className="bg-voltage-yellow hover:bg-yellow-400 text-deep-space font-bold py-3 px-8 rounded-xl transition-all shadow-[0_0_15px_rgba(255,215,0,0.3)]"
             >
               Return to Basecamp
             </button>
          </div>
        );
    }
  }

  const navItems = [
    { id: 'setup', label: 'Setup', icon: Settings },
    { id: 'batches', label: 'Batches', icon: LayoutDashboard },
    { id: 'teachers', label: 'Teachers', icon: UserIcon },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-black text-off-white font-sans selection:bg-voltage-yellow/30 selection:text-white relative">
      
      {/* Mobile Top Navigation Overlay Trigger */}
      <div className="md:hidden absolute top-4 right-4 z-50">
         <button 
           onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
           className="w-10 h-10 rounded-lg bg-graphite flex items-center justify-center border border-gray-700 text-white shadow-lg"
           aria-label="Toggle Navigation"
         >
           {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
         </button>
      </div>

      {/* Sidebar / Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 flex flex-col justify-between bg-graphite border-r border-gray-800 transform transition-all duration-300 ease-in-out md:relative md:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        ${isSidebarCollapsed ? 'w-[80px] p-3' : 'w-[250px] p-4'}
      `}>
        <div>
          {/* Logo / Brand */}
          <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'} mb-8 px-2 py-2`}>
            <div className="flex items-center gap-3 overflow-hidden">
              {!isSidebarCollapsed ? (
                <Logo className="h-6" />
              ) : (
                <div className="w-8 h-8 rounded flex-shrink-0 flex items-center justify-center font-extrabold text-voltage-yellow bg-deep-space border border-gray-700 shadow-inner text-xl">
                  s
                </div>
              )}
            </div>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentRoute === item.id;
              return (
                <button
                  key={item.id}
                  title={isSidebarCollapsed ? item.label : undefined}
                  onClick={() => handleNavigation(item.id)}
                  className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-3 text-center' : 'gap-3 px-4 py-3'} rounded-xl font-medium transition-all duration-200 ${
                    isActive 
                      ? 'bg-deep-space text-white shadow-inner border border-gray-700/50' 
                      : 'text-gray-400 border border-transparent hover:bg-deep-space hover:text-white hover:border-gray-700/50'
                  }`}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-voltage-yellow' : 'opacity-70'}`} />
                  {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto space-y-2">
          {/* Desktop Toggle Button */}
          <button 
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className={`hidden md:flex items-center w-full ${isSidebarCollapsed ? 'justify-center p-3' : 'justify-between px-4 py-3'} text-gray-400 hover:text-white hover:bg-gray-800 transition-colors rounded-xl`}
                title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                  {isSidebarCollapsed ? (
                    <Menu className="w-5 h-5 flex-shrink-0" />
                  ) : (
                    <>
                      <span className="font-medium text-sm">Collapse</span>
                      <ChevronLeft className="w-5 h-5 flex-shrink-0" />
                    </>
                  )}
          </button>

          <button 
            onClick={handleLogout}
            title={isSidebarCollapsed ? "Logout" : undefined}
            className={`flex items-center w-full ${isSidebarCollapsed ? 'justify-center p-3' : 'justify-center gap-2 p-3'} border border-gray-800 bg-deep-space text-gray-400 rounded-xl font-bold transition-all hover:bg-red-900/20 hover:border-red-900 hover:text-red-400 shadow-lg`}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!isSidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Overlay to close mobile menu */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative bg-deep-space">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentRoute}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="h-full w-full"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart3, Target, CheckCircle2, Award, Zap, ArrowLeft, Loader2, AlertTriangle, Crosshair, TrendingUp, Clock, ChevronDown, ChevronUp, Timer, RotateCcw, Star, Trophy } from 'lucide-react';
import { useAuthStore } from '../../stores/auth';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

interface SubjectProgress {
    subject_code: number;
    name: string;
    icon_class: string;
    progress: number;
}

interface Chapter {
    id: number;
    subject_code: number;
    title_translations: any;
    status: 'locked' | 'untested' | 'practicing' | 'proficient';
    accuracy: number;
    easy_accuracy: number;
    medium_accuracy: number;
    hard_accuracy: number;
    attempts: number;
    total_time_seconds: number;
    topics?: any[];
}

interface AnalyticsViewProps {
    apiBase?: string;
    onNavigate: (route: string) => void;
}

export default function AnalyticsView({ apiBase = import.meta.env.VITE_API_URL || '', onNavigate }: AnalyticsViewProps) {
    const { user } = useAuthStore();
    const [subjects, setSubjects] = useState<SubjectProgress[]>([]);
    const [allChapters, setAllChapters] = useState<Chapter[]>([]);
    const [topicAnalytics, setTopicAnalytics] = useState<any[]>([]);
    const [errAnalytics, setErrAnalytics] = useState<{total_mistakes: number, resolved_mistakes: number, err_percentage: number} | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [activeSubjectId, setActiveSubjectId] = useState<number | null>(null);
    const [isSubjectDropdownOpen, setIsSubjectDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsSubjectDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [dropdownRef]);

    useEffect(() => {
        const loadAnalytics = async () => {
            if (!user?.curriculum_code) {
                setFetchError("Curriculum information is missing from your profile.");
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setFetchError(null);

            try {
                const token = localStorage.getItem('token') || localStorage.getItem('access_token') || sessionStorage.getItem('token') || sessionStorage.getItem('access_token') || '';
                
                // 1. Fetch Subjects
                const subUrl = `${apiBase}/curriculum/subjects?curriculum_code=${encodeURIComponent(user.curriculum_code)}`;
                const subRes = await fetch(subUrl, { headers: { 'Authorization': `Bearer ${token}` } });
                
                if (!subRes.ok) throw new Error('Failed to fetch subjects');
                const rawSubjects: any[] = await subRes.json();
                const subjectsData: SubjectProgress[] = rawSubjects.map(s => {
                    const trans = typeof s.name_translations === 'string' ? JSON.parse(s.name_translations) : (s.name_translations || {});
                    return { ...s, name: s.name || trans.en || 'Subject' };
                });
                setSubjects(subjectsData);
                if (subjectsData.length > 0) {
                    setActiveSubjectId(subjectsData[0].subject_code);
                }

                // 2. Fetch Chapters for all subjects
                const chaptersPromises = subjectsData.map(async (subj) => {
                    const chapterUrl = `${apiBase}/curriculum/subjects/${subj.subject_code}/chapters`;
                    const chapRes = await fetch(chapterUrl, { headers: { 'Authorization': `Bearer ${token}` } });
                    if (chapRes.ok) {
                        const rawChapData: any[] = await chapRes.json();
                        const chapData: Chapter[] = rawChapData.map(c => {
                            const trans = typeof c.title_translations === 'string' ? JSON.parse(c.title_translations) : (c.title_translations || {});
                            return { ...c, title: c.title || trans.en || c.module_name || 'Chapter' };
                        });
                        return chapData;
                    }
                    return [];
                });

                const allChapResults = await Promise.all(chaptersPromises);
                const flatChapters = allChapResults.flat();
                setAllChapters(flatChapters);

                // 3. Fetch Topic Analytics
                try {
                    const topicUrl = `${apiBase}/quiz/analytics/topics`;
                    const topicRes = await fetch(topicUrl, { headers: { 'Authorization': `Bearer ${token}` } });
                    if (topicRes.ok) {
                        const topicData = await topicRes.json();
                        setTopicAnalytics(topicData);
                    }
                } catch (e) {
                    console.error("Topic fetch error", e);
                }

                // 4. Fetch ERR Analytics
                try {
                    const errUrl = `${apiBase}/quiz/analytics/err`;
                    const errRes = await fetch(errUrl, { headers: { 'Authorization': `Bearer ${token}` } });
                    if (errRes.ok) {
                        const errData = await errRes.json();
                        setErrAnalytics(errData);
                    }
                } catch (e) {
                    console.error("ERR fetch error", e);
                }

            } catch (err: any) {
                setFetchError(err.message || 'Unable to load your analytics right now.');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        loadAnalytics();
    }, [apiBase, user]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full space-y-4 py-20 text-text-secondary">
                <Loader2 className="animate-spin w-10 h-10 text-brand-primary" />
                <p className="font-medium animate-pulse">Computing your analytics...</p>
            </div>
        );
    }

    if (fetchError) {
        return (
            <div className="flex flex-col items-center justify-center flex-1 p-8 text-center">
                 <div className="w-16 h-16 bg-red-900/20 border-2 border-red-900 rounded-full flex items-center justify-center mb-4">
                     <AlertTriangle className="w-8 h-8 text-semantic-error" />
                 </div>
                 <h2 className="text-xl font-bold text-white mb-2">Analytics Unavailable</h2>
                 <p className="text-gray-400 max-w-sm">{fetchError}</p>
                 <Button variant="secondary" onClick={() => onNavigate('dashboard')} className="mt-6">
                     Return to Basecamp
                 </Button>
            </div>
        );
    }

    // --- Computed Metrics ---
    const currentXp = user?.total_xp ?? user?.xp ?? user?.score ?? 0;
    const attemptedChapters = allChapters.filter(c => c.attempts > 0);
    const totalAttempts = attemptedChapters.reduce((sum, c) => sum + Number(c.attempts), 0);
    const proficientTopics = allChapters.filter(c => c.status === 'active' && Number(c.accuracy) >= 75).length;
    const totalTimeSeconds = attemptedChapters.reduce((sum, c) => sum + Number(c.total_time_seconds || 0), 0);
    
    // Accuracies (only among attempted concepts)
    const avgOverallAccuracy = attemptedChapters.length > 0 
        ? attemptedChapters.reduce((sum, c) => sum + Number(c.accuracy), 0) / attemptedChapters.length 
        : 0;

    const avgEasyAccuracy = attemptedChapters.length > 0
        ? attemptedChapters.reduce((sum, c) => sum + (Number(c.easy_accuracy) || 0), 0) / attemptedChapters.length
        : 0;
        
    const avgMediumAccuracy = attemptedChapters.length > 0
        ? attemptedChapters.reduce((sum, c) => sum + (Number(c.medium_accuracy) || 0), 0) / attemptedChapters.length
        : 0;
        
    const avgHardAccuracy = attemptedChapters.length > 0
        ? attemptedChapters.reduce((sum, c) => sum + (Number(c.hard_accuracy) || 0), 0) / attemptedChapters.length
        : 0;

    const formatTime = (seconds: number) => {
        if (seconds < 60) return `${seconds}s`;
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        if (m < 60) return `${m}m ${s}s`;
        const h = Math.floor(m / 60);
        const m2 = m % 60;
        return `${h}h ${m2}m`;
    };

    const subjectDetails = subjects.map(subj => {
        const allSubjChapters = allChapters.filter(c => c.subject_code === subj.subject_code);
        const subjChapters = allSubjChapters.filter(c => c.attempts > 0);
        const totalChapters = allSubjChapters.length;
        const chaptersMastered = allSubjChapters.filter(c => c.status === 'active' && Number(c.accuracy) >= 75).length;
        const subjPlays = allSubjChapters.reduce((sum, c) => sum + (c.topics || []).reduce((tSum: number, t: any) => tSum + (Number(t.attempts) || 0), 0), 0);
        const completionPct = totalChapters > 0 ? (chaptersMastered / totalChapters) * 100 : 0;
        const timeSpent = subjChapters.reduce((sum, c) => sum + Number(c.total_time_seconds || 0), 0);
        const easyAcc = subjChapters.length > 0 ? subjChapters.reduce((sum, c) => sum + (Number(c.easy_accuracy) || 0), 0) / subjChapters.length : 0;
        const medAcc = subjChapters.length > 0 ? subjChapters.reduce((sum, c) => sum + (Number(c.medium_accuracy) || 0), 0) / subjChapters.length : 0;
        const hardAcc = subjChapters.length > 0 ? subjChapters.reduce((sum, c) => sum + (Number(c.hard_accuracy) || 0), 0) / subjChapters.length : 0;
        
        return {
            ...subj,
            timeSpent,
            easyAcc,
            medAcc,
            hardAcc,
            totalChapters,
            chaptersMastered,
            completionPct,
            subjPlays,
            chapters: subjChapters
        };
    });

    return (
        <div className="flex flex-col w-full min-h-full font-sans text-white relative z-10 bg-bg-app pb-24 md:pb-8">
            {/* Mobile Header */}
            <header className="md:hidden flex items-center justify-between p-4 sticky top-0 bg-deep-space/90 backdrop-blur-md z-30 border-b border-white/5">
                <div className="flex items-center gap-3">
                    <button onClick={() => onNavigate('dashboard')} className="text-text-secondary hover:text-white transition-colors p-1 -ml-1 cursor-pointer active:scale-95">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-bg-surface rounded-lg flex items-center justify-center border border-brand-primary/30 text-brand-primary">
                            <BarChart3 className="w-4 h-4" />
                        </div>
                        <span className="font-black text-lg text-white">Performance</span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                </div>
            </header>

            <div className="p-4 md:p-8 max-w-5xl mx-auto w-full flex-1">
                {/* Header Section */}
                <Card variant="gamified" className="mb-6 p-4 sm:p-6 md:p-8 flex flex-col relative overflow-hidden group">
                    <div className="relative z-10 w-full flex flex-col gap-5 md:gap-8">
                        <div className="flex items-center gap-3 sm:gap-5 w-full">
                            <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 shrink-0 rounded-[1rem] md:rounded-[1.25rem] bg-brand-primary/5 flex items-center justify-center border border-brand-primary/20 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] relative overflow-hidden transition-colors">
                                <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/10 to-transparent opacity-50"></div>
                                <div className="text-brand-primary relative z-10">
                                    <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10" />
                                </div>
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2 mb-1 sm:mb-2">
                                    <Badge variant="outline" className="text-[10px] uppercase tracking-widest shadow-inner border-yellow-600/30">
                                        <span className="w-1.5 h-1.5 rounded-full bg-bg-surface animate-pulse mr-1 inline-block"></span>
                                        Overall Progress
                                    </Badge>
                                </div>
                                <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-orange-300 tracking-tight leading-tight truncate whitespace-normal drop-shadow-sm">
                                    Performance Overview
                                </h2>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 md:flex md:flex-row gap-2 sm:gap-3 md:gap-4 w-full">
                            <div className="bg-black/20 backdrop-blur-sm border border-white/5 rounded-xl px-2 py-3 md:px-5 md:py-4 flex-1 min-w-0 text-center">
                                <div className="text-white font-black text-xl sm:text-2xl md:text-3xl leading-none mb-1.5">{currentXp}</div>
                                <div className="text-[10px] sm:text-xs font-semibold tracking-wider text-text-secondary uppercase">Total XP Earned</div>
                            </div>
                            <div className="bg-black/20 backdrop-blur-sm border border-white/5 rounded-xl px-2 py-3 md:px-5 md:py-4 flex-1 min-w-0 text-center relative overflow-hidden group/accuracy">
                                <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-brand-primary/20 to-orange-500/20 border-r-2 border-orange-500/50 transition-all duration-1000" style={{ width: `${Math.round(avgOverallAccuracy)}%` }}></div>
                                <div className="text-brand-primary font-black text-xl sm:text-2xl md:text-3xl leading-none mb-1.5 relative z-10">{Math.round(avgOverallAccuracy)}%</div>
                                <div className="text-[10px] sm:text-xs font-semibold tracking-wider text-text-secondary uppercase relative z-10">Avg Accuracy</div>
                            </div>
                            <div className="col-span-2 md:col-span-1 bg-black/20 backdrop-blur-sm border border-white/5 rounded-xl px-2 py-3 md:px-5 md:py-4 flex-1 min-w-0 text-center">
                                <div className="text-emerald-400 font-black text-xl sm:text-2xl md:text-3xl leading-none mb-1.5 flex justify-center items-center gap-1">{proficientTopics}</div>
                                <div className="text-[10px] sm:text-xs font-semibold tracking-wider text-text-secondary uppercase">Chapters Mastered</div>
                            </div>
                            <div className="col-span-2 md:col-span-1 bg-black/20 backdrop-blur-sm border border-white/5 rounded-xl px-2 py-3 md:px-5 md:py-4 flex-1 min-w-0 text-center">
                                <div className="text-purple-400 font-black text-xl sm:text-2xl md:text-3xl leading-none mb-1.5 flex justify-center items-center gap-1">{formatTime(totalTimeSeconds)}</div>
                                <div className="text-[10px] sm:text-xs font-semibold tracking-wider text-text-secondary uppercase">Time Invested</div>
                            </div>
                        </div>
                    </div>
                </Card>


            {/* Subject Filters Dropdown */}
            {subjectDetails.length > 0 && (
                <div className="mb-10 relative z-[100] isolate mt-2" ref={dropdownRef}>
                    <button
                        onClick={() => setIsSubjectDropdownOpen(!isSubjectDropdownOpen)}
                        className="w-full md:w-[320px] min-h-[44px] flex justify-between items-center bg-bg-surface border-2 border-border-subtle/50 text-white px-5 py-3 md:py-2 rounded-xl hover:border-brand-primary/50 hover:bg-bg-surface transition-all focus:outline-none shadow-inner"
                    >
                        <div className="flex flex-col items-start leading-tight pr-4 text-left overflow-hidden">
                            <span className="font-bold text-xs text-text-secondary uppercase tracking-widest">
                                Selected Subject
                            </span>
                            <span className="text-sm font-black truncate w-full mt-1 text-brand-primary">
                                {subjectDetails.find(s => s.subject_code === activeSubjectId)?.name || 'Subject'}
                            </span>
                        </div>
                        <div className={`w-8 h-8 rounded-full bg-bg-surface-elevated flex items-center justify-center transition-transform duration-300 ${isSubjectDropdownOpen ? 'rotate-180 bg-brand-primary/20' : ''}`}>
                            <ChevronDown className={`w-4 h-4 ${isSubjectDropdownOpen ? 'text-brand-primary' : 'text-text-secondary'}`} />
                        </div>
                    </button>

                    <AnimatePresence>
                        {isSubjectDropdownOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: -10, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                                transition={{ duration: 0.15, ease: 'easeOut' }}
                                className="absolute top-full left-0 mt-3 w-full md:w-[380px] bg-bg-surface border-2 border-border-subtle/50 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden z-[100]"
                            >
                                <div className="max-h-80 overflow-y-auto overscroll-contain scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent py-2">
                                    {subjectDetails.map((subj) => (
                                        <button
                                            key={subj.subject_code}
                                            onClick={() => {
                                                setActiveSubjectId(subj.subject_code);
                                                setIsSubjectDropdownOpen(false);
                                            }}
                                            className={`w-full text-left px-5 py-3 transition-colors group flex items-center gap-3 ${activeSubjectId === subj.subject_code
                                                    ? 'bg-brand-primary/10 border-l-4 border-brand-primary'
                                                    : 'hover:bg-gray-800/50 border-l-4 border-transparent'
                                                }`}
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-bg-surface-elevated flex items-center justify-center border border-border-subtle shrink-0">
                                                {subj.icon_class ? <i className={`${subj.icon_class} text-sm ${activeSubjectId === subj.subject_code ? 'text-brand-primary' : 'text-text-secondary'}`}></i> : <Zap className={`w-4 h-4 ${activeSubjectId === subj.subject_code ? 'text-brand-primary' : 'text-text-secondary'}`} />}
                                            </div>
                                            <div>
                                                <span className={`font-bold text-sm block leading-snug group-hover:text-white transition-colors ${activeSubjectId === subj.subject_code ? 'text-brand-primary' : 'text-gray-300'}`}>{subj.name}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            {/* Detailed Subject Breakdown */}
            <div className="space-y-4">
                {subjectDetails.map((subj) => {
                    const pct = Number(subj.completionPct) || 0;
                    const isActive = activeSubjectId === subj.subject_code;
                    const chaptersMastered = subj.chaptersMastered;
                    const totalChapters = subj.totalChapters;
                    const completionPct = subj.completionPct;
                    const subjPlays = subj.subjPlays;
                    
                    return (
                        <Card 
                            variant="default"
                            key={subj.subject_code} 
                            className={`${isActive ? 'block' : 'hidden'} group transition-all duration-300 p-0 overflow-hidden`}
                        >
                            {/* Prominent Subject Header */}
                            <div className="w-full p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-border-subtle relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/5 via-orange-500/5 to-transparent"></div>
                                <div className="flex items-center gap-5 relative z-10 w-full sm:w-auto">
                                    <div className="w-16 h-16 rounded-[1.25rem] bg-bg-surface-elevated/80 flex items-center justify-center border-2 border-border-subtle/50 shadow-inner group-hover:border-brand-primary/50 transition-colors">
                                       {subj.icon_class ? <i className={`${subj.icon_class} text-text-secondary group-hover:text-brand-primary text-2xl transition-colors`}></i> : <Zap className="w-7 h-7 text-text-secondary group-hover:text-brand-primary transition-colors" />}
                                    </div>
                                    <div className="text-left flex-1">
                                        <h3 className="text-2xl font-black text-white capitalize tracking-tight mb-1 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-brand-primary group-hover:to-orange-300 transition-all">{subj.name}</h3>
                                        <div className="text-[10px] sm:text-xs text-text-secondary font-bold uppercase tracking-widest flex flex-wrap items-center gap-2">
                                            <Clock className="w-3.5 h-3.5" /> {formatTime(subj.timeSpent)} spent 
                                            <span className="text-slate-600">•</span>
                                            <Target className="w-3.5 h-3.5" /> {subj.chapters.length} concepts
                                        </div>
                                    </div>
                                </div>
                                <div className="w-full md:w-64 p-4 rounded-xl relative z-10 shrink-0">
                                    <div className="flex justify-between items-end mb-2">
                                        <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Overall Completion</span>
                                        <span className="text-xl font-black text-brand-primary leading-none">{chaptersMastered} / {totalChapters}</span>
                                    </div>
                                    <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-gradient-to-r from-brand-primary to-orange-400 rounded-full transition-all duration-1000 shadow-sm" 
                                            style={{ width: `${completionPct}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>

                            {/* Chapter Details */}
                            <div className="p-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 max-w-full">
                                    <div className="bg-white/5 px-4 py-3 rounded-xl border border-border-subtle flex flex-col items-center justify-center">
                                        <div className="text-[10px] text-text-secondary uppercase tracking-widest font-bold mb-1 text-center">Warm-up Plays</div>
                                        <div className="text-2xl font-black text-white leading-none">{subjPlays}</div>
                                    </div>
                                    <div className="bg-white/5 px-4 py-3 rounded-xl border border-border-subtle flex flex-col items-center justify-center">
                                        <div className="text-[10px] text-text-secondary uppercase tracking-widest font-bold mb-1 text-center">Arena Challenges Passed</div>
                                        <div className="text-2xl font-black text-white leading-none">{chaptersMastered}</div>
                                    </div>
                                </div>
                                
                                <h5 className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-4 px-2">Chapter Breakdown</h5>
                                
                                {subj.chapters.length > 0 ? (
                                    <div className="space-y-3">
                                        {subj.chapters.map(ch => {
                                            const avgTopicMastery = ch.topics && ch.topics.length > 0 
                                                ? ch.topics.reduce((sum: number, t: any) => sum + Number(t.accuracy || 0), 0) / ch.topics.length 
                                                : 0;
                                            
                                            return (
                                            <div key={ch.id} className="group bg-bg-surface hover:bg-bg-surface-elevated/30 transition-colors rounded-[1.25rem] p-4 sm:p-5 border-2 border-border-subtle/50 flex flex-col md:flex-row md:items-center justify-between gap-4 relative w-full">
                                                <div className="flex items-start md:items-center gap-4 flex-1">
                                                    <div className={`mt-1 md:mt-0 w-3 h-3 rounded-full flex-shrink-0 ${ch.status === 'proficient' ? 'bg-semantic-success shadow-[0_0_8px_rgba(74,222,128,0.5)]' : 'bg-brand-primary shadow-[0_0_8px_rgba(250,204,21,0.5)]'}`}></div>
                                                    <div>
                                                        <div className="mb-1.5">
                                                            <h4 className="text-lg font-black text-white group-hover:text-brand-primary transition-colors">{ch.title}</h4>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-center gap-3 md:gap-4 ml-7 md:ml-0 self-start md:self-auto mt-2 md:mt-0 flex-wrap">
                                                    <div className="flex flex-col items-center justify-center px-4 py-2 rounded-xl border border-white/10 bg-white/5 shadow-[0_0_15px_rgba(255,255,255,0.03)] min-w-[80px]">
                                                        <span className="text-[9px] text-text-secondary font-black uppercase tracking-widest mb-1 text-center">Plays</span>
                                                        <span className="text-lg font-black text-white leading-none">{ch.attempts}</span>
                                                    </div>
                                                    <div className="flex flex-col items-center justify-center px-4 py-2 rounded-xl border border-white/10 bg-white/5 shadow-[0_0_15px_rgba(255,255,255,0.03)] min-w-[80px]">
                                                        <span className="text-[9px] text-text-secondary font-black uppercase tracking-widest mb-1 text-center">Time</span>
                                                        <span className="text-lg font-black text-white leading-none">{formatTime(Number(ch.total_time_seconds) || 0)}</span>
                                                    </div>
                                                    <div className="flex flex-col items-center justify-center px-4 py-2 rounded-xl border border-brand-primary/30 bg-brand-primary/10 shadow-[0_0_15px_rgba(250,204,21,0.1)] min-w-[80px]">
                                                        <span className="text-[9px] text-brand-primary font-black uppercase tracking-widest mb-1 text-center">Warm-up</span>
                                                        <span className="text-lg font-black text-white leading-none">{Math.round(avgTopicMastery)}%</span>
                                                    </div>
                                                    <div className="flex flex-col items-center justify-center px-4 py-2 rounded-xl border border-blue-400/30 bg-blue-400/10 shadow-[0_0_15px_rgba(96,165,250,0.1)] min-w-[80px]">
                                                        <span className="text-[9px] text-blue-400 font-black uppercase tracking-widest mb-1 text-center">Arena</span>
                                                        <span className="text-lg font-black text-white leading-none">{Math.round(Number(ch.accuracy) || 0)}%</span>
                                                    </div>
                                                </div>

                                            </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                                        <p className="text-sm text-text-secondary font-bold uppercase tracking-widest mb-4">No chapters practiced yet.</p>
                                        <Button variant="primary" size="sm" onClick={() => onNavigate('dashboard')}>Start First Chapter</Button>
                                    </div>
                                )}
                            </div>
                        </Card>
                    );
                })}
        </div>
        </div>
        </div>
    );
}

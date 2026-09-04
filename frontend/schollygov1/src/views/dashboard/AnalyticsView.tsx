import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { BarChart3, Target, CheckCircle2, Award, Zap, ArrowLeft, Loader2, AlertTriangle, Crosshair, TrendingUp, Clock, ChevronDown, ChevronUp, Timer, RotateCcw, Star, Trophy } from 'lucide-react';
import { useAuthStore } from '../../stores/auth';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

interface SubjectProgress {
    subject_id: number;
    name: string;
    icon_class: string;
    progress: number;
}

interface Chapter {
    id: number;
    subject_id: number;
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
                    setActiveSubjectId(subjectsData[0].subject_id);
                }

                // 2. Fetch Chapters for all subjects
                const chaptersPromises = subjectsData.map(async (subj) => {
                    const chapterUrl = `${apiBase}/curriculum/subjects/${subj.subject_id}/chapters`;
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
    const proficientTopics = allChapters.filter(c => c.status === 'proficient' || c.status === 'mastered').length;
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
        const allSubjChapters = allChapters.filter(c => c.subject_id === subj.subject_id);
        const subjChapters = allSubjChapters.filter(c => c.attempts > 0);
        const totalChapters = allSubjChapters.length;
        const chaptersMastered = allSubjChapters.filter(c => c.status === 'proficient' || c.status === 'mastered').length;
        const subjPlays = subjChapters.reduce((sum, c) => sum + (Number(c.attempts) || 0), 0);
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
        <div className="px-4 py-8 max-w-5xl mx-auto pb-32 flex-1 w-full">
            <button onClick={() => onNavigate('dashboard')} className="flex md:hidden items-center gap-2 text-text-secondary hover:text-brand-primary text-xs font-black uppercase tracking-widest mb-6 transition-colors cursor-pointer active:scale-95 group">
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Basecamp
            </button>

            {/* Header Section */}
            <Card variant="gamified" className="mb-8 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 group">
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-brand-primary/20 rounded-full blur-3xl pointer-events-none group-hover:bg-brand-primary/30 transition-colors duration-500"></div>
                <div className="relative z-10 w-full flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-[1.25rem] bg-bg-surface-elevated/80 flex items-center justify-center border-2 border-brand-primary/50 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300 shadow-inner overflow-hidden">
                            <div className="text-brand-primary group-hover:drop-shadow-[0_0_10px_rgba(250,204,21,0.8)] transition-all">
                                <BarChart3 className="w-8 h-8 md:w-10 md:h-10" />
                            </div>
                        </div>
                        <div>
                            <div className="flex flex-wrap items-center gap-2 mb-1.5 md:mb-2">
                                <Badge variant="milestone">
                                    <span className="w-1.5 h-1.5 rounded-full bg-bg-surface animate-pulse mr-1 inline-block"></span>
                                    Overall Progress
                                </Badge>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-orange-300 tracking-tight mb-2 md:mb-1 drop-shadow-sm">
                                Performance Overview
                            </h1>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Top Level KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {/* Total XP Earned */}
                <Card variant="default" className="p-4 md:p-6 flex flex-col items-center justify-center text-center shadow-lg transition-transform hover:-translate-y-1 relative overflow-hidden group">
                    <Star className="absolute -top-4 -right-4 w-16 h-16 text-brand-primary opacity-10 group-hover:scale-110 transition-transform duration-500 pointer-events-none" />
                    <div className="relative z-10 flex flex-col h-full justify-between items-center gap-2">
                        <Star className="w-6 h-6 text-brand-primary mb-1" />
                        <div className="flex items-baseline gap-1">
                            <span className="text-3xl md:text-4xl font-black text-white leading-none tracking-tight">{currentXp}</span>
                            <span className="text-sm font-bold text-brand-primary">XP</span>
                        </div>
                        <div className="text-xs font-semibold tracking-wider text-text-secondary uppercase mt-1">Total XP Earned</div>
                    </div>
                </Card>

                {/* Avg Accuracy */}
               <Card variant="default" className="p-4 md:p-6 flex flex-col items-center justify-center text-center shadow-lg transition-transform hover:-translate-y-1 relative overflow-hidden group">
                   <Crosshair className="absolute -top-4 -right-4 w-16 h-16 text-blue-400 opacity-10 group-hover:scale-110 transition-transform duration-500 pointer-events-none" />
                   <div className="relative z-10 flex flex-col h-full justify-between items-center gap-2">
                       <Crosshair className="w-6 h-6 text-blue-400 mb-1" />
                       <div className="flex items-baseline gap-1">
                           <span className="text-3xl md:text-4xl font-black text-white leading-none">{Math.round(avgOverallAccuracy)}</span>
                           <span className="text-sm font-bold text-blue-400">%</span>
                       </div>
                       <div className="text-xs font-semibold tracking-wider text-text-secondary uppercase mt-1">Avg Accuracy</div>
                   </div>
               </Card>
               
               {/* Chapters Mastered */}
               <Card variant="default" className="p-4 md:p-6 flex flex-col items-center justify-center text-center shadow-lg transition-transform hover:-translate-y-1 relative overflow-hidden group">
                   <Trophy className="absolute -top-4 -right-4 w-16 h-16 text-emerald-400 opacity-10 group-hover:scale-110 transition-transform duration-500 pointer-events-none" />
                   <div className="relative z-10 flex flex-col h-full justify-between items-center gap-2">
                       <Trophy className="w-6 h-6 text-emerald-400 mb-1" />
                       <div className="flex items-baseline gap-1.5">
                           <span className="text-3xl md:text-4xl font-black text-white leading-none">{proficientTopics}</span>
                       </div>
                       <div className="text-xs font-semibold tracking-wider text-text-secondary uppercase mt-1">Chapters Mastered</div>
                   </div>
               </Card>
               
               {/* Time Invested */}
               <Card variant="default" className="p-4 md:p-6 flex flex-col items-center justify-center text-center shadow-lg transition-transform hover:-translate-y-1 relative overflow-hidden group">
                   <Clock className="absolute -top-4 -right-4 w-16 h-16 text-purple-400 opacity-10 group-hover:scale-110 transition-transform duration-500 pointer-events-none" />
                   <div className="relative z-10 flex flex-col h-full justify-between items-center gap-2">
                       <Clock className="w-6 h-6 text-purple-400 mb-1" />
                       <div className="flex items-baseline gap-1">
                           <span className="text-2xl md:text-3xl font-black text-white leading-none tracking-tight">{formatTime(totalTimeSeconds)}</span>
                       </div>
                       <div className="text-xs font-semibold tracking-wider text-text-secondary uppercase mt-1">Time Invested</div>
                   </div>
               </Card>
            </div>


            {/* Pill Filter Navigation */}
            <div className="flex overflow-x-auto hide-scrollbar gap-2 mb-8 items-center justify-center pb-2 -mx-4 px-4 md:mx-0 md:px-0">
                {subjectDetails.map((subj) => {
                    const isActive = activeSubjectId === subj.subject_id;
                    return (
                        <button
                            key={subj.subject_id}
                            onClick={() => setActiveSubjectId(subj.subject_id)}
                            className={`px-4 py-2 rounded-xl text-xs font-black tracking-widest uppercase transition-all duration-300 border-2 border-b-[4px] active:scale-95 flex items-center gap-2 ${
                                isActive 
                                    ? 'bg-brand-primary text-black border-brand-hover shadow-[0_5px_15px_rgba(250,204,21,0.4)]' 
                                    : 'bg-bg-surface text-text-secondary border-border-subtle/50 hover:border-brand-primary hover:text-brand-primary'
                            }`}
                        >
                            {subj.icon_class ? <i className={subj.icon_class}></i> : <Zap className="w-3.5 h-3.5" />}
                            {subj.name}
                        </button>
                    );
                })}
            </div>

            {/* Detailed Subject Breakdown */}
            <div className="space-y-4">
                {subjectDetails.map((subj) => {
                    const pct = Number(subj.completionPct) || 0;
                    const isActive = activeSubjectId === subj.subject_id;
                    const chaptersMastered = subj.chaptersMastered;
                    const totalChapters = subj.totalChapters;
                    const completionPct = subj.completionPct;
                    const subjPlays = subj.subjPlays;
                    
                    return (
                        <Card 
                            variant="default"
                            key={subj.subject_id} 
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
                                                        <div className="text-[10px] sm:text-xs text-text-secondary font-bold tracking-widest uppercase flex flex-wrap items-center gap-2">
                                                            <TrendingUp className="w-3.5 h-3.5" /> {ch.attempts} plays
                                                            <span className="text-slate-600 border-l border-border-subtle pl-2 ml-1">
                                                                <Clock className="w-3.5 h-3.5 inline mr-1" /> {formatTime(Number(ch.total_time_seconds) || 0)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-center gap-3 md:gap-4 ml-7 md:ml-0 self-start md:self-auto mt-2 md:mt-0">
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
    );
}

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { BarChart3, Target, CheckCircle2, Award, Zap, ArrowLeft, Loader2, AlertTriangle, Crosshair, TrendingUp, Clock, ChevronDown, ChevronUp, Timer, RotateCcw } from 'lucide-react';
import { useAuthStore } from '../../stores/auth';

interface SubjectProgress {
    subject_code: number;
    name: string;
    icon_class: string;
    progress: number;
}

interface Chapter {
    id: number;
    subject_code: number;
    title: string;
    status: 'locked' | 'untested' | 'practicing' | 'proficient';
    accuracy: number;
    easy_accuracy: number;
    medium_accuracy: number;
    hard_accuracy: number;
    attempts: number;
    total_time_seconds: number;
}

interface AnalyticsViewProps {
    apiBase?: string;
    onNavigate: (route: string) => void;
}

export default function AnalyticsView({ apiBase = import.meta.env.VITE_API_URL || '', onNavigate }: AnalyticsViewProps) {
    const { user } = useAuthStore();
    const [subjects, setSubjects] = useState<SubjectProgress[]>([]);
    const [allChapters, setAllChapters] = useState<Chapter[]>([]);
    const [errAnalytics, setErrAnalytics] = useState<{total_mistakes: number, resolved_mistakes: number, err_percentage: number} | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [expandedSubject, setExpandedSubject] = useState<number | null>(null);

    useEffect(() => {
        const loadAnalytics = async () => {
            if (!user?.board || !user?.grade) {
                setFetchError("Board or grade information is missing from your profile.");
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setFetchError(null);

            try {
                const token = localStorage.getItem('token') || localStorage.getItem('access_token') || sessionStorage.getItem('token') || sessionStorage.getItem('access_token') || '';
                
                // 1. Fetch Subjects
                const subUrl = `${apiBase}/curriculum/subjects?board=${encodeURIComponent(user.board)}&grade=${encodeURIComponent(user.grade)}`;
                const subRes = await fetch(subUrl, { headers: { 'Authorization': `Bearer ${token}` } });
                
                if (!subRes.ok) throw new Error('Failed to fetch subjects');
                const subjectsData: SubjectProgress[] = await subRes.json();
                setSubjects(subjectsData);

                // 2. Fetch Chapters for all subjects
                const chaptersPromises = subjectsData.map(async (subj) => {
                    const chapterUrl = `${apiBase}/curriculum/subjects/${subj.subject_code}/chapters`;
                    const chapRes = await fetch(chapterUrl, { headers: { 'Authorization': `Bearer ${token}` } });
                    if (chapRes.ok) {
                        const chapData: Chapter[] = await chapRes.json();
                        return chapData;
                    }
                    return [];
                });

                const allChapResults = await Promise.all(chaptersPromises);
                const flatChapters = allChapResults.flat();
                setAllChapters(flatChapters);
                
                // 3. Fetch ERR Analytics
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
            <div className="flex flex-col items-center justify-center h-full space-y-4 py-20 text-gray-500">
                <Loader2 className="animate-spin w-10 h-10 text-voltage-yellow" />
                <p className="font-medium animate-pulse">Computing your analytics...</p>
            </div>
        );
    }

    if (fetchError) {
        return (
            <div className="flex flex-col items-center justify-center flex-1 p-8 text-center">
                 <div className="w-16 h-16 bg-red-900/20 border-2 border-red-900 rounded-full flex items-center justify-center mb-4">
                     <AlertTriangle className="w-8 h-8 text-error-red" />
                 </div>
                 <h2 className="text-xl font-bold text-white mb-2">Analytics Unavailable</h2>
                 <p className="text-gray-400 max-w-sm">{fetchError}</p>
                 <button onClick={() => onNavigate('dashboard')} className="mt-6 px-6 py-2 bg-gray-800 rounded-xl text-white font-bold hover:bg-gray-700 transition-colors">
                     Return to Basecamp
                 </button>
            </div>
        );
    }

    // --- Computed Metrics ---
    const attemptedChapters = allChapters.filter(c => c.attempts > 0);
    const totalAttempts = attemptedChapters.reduce((sum, c) => sum + Number(c.attempts), 0);
    const proficientTopics = allChapters.filter(c => c.status === 'proficient').length;
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
        const subjChapters = allChapters.filter(c => c.subject_code === subj.subject_code && c.attempts > 0);
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
            chapters: subjChapters
        };
    });

    return (
        <div className="px-4 py-8 max-w-5xl mx-auto pb-32 flex-1 w-full h-full overflow-y-auto">
            <button onClick={() => onNavigate('dashboard')} className="flex items-center gap-2 text-gray-400 hover:text-voltage-yellow text-sm font-medium uppercase tracking-wider mb-6 transition-colors cursor-pointer active:scale-95 group">
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Basecamp
            </button>

            {/* Header Section */}
            <div className="bg-graphite border border-white/5 rounded-3xl p-6 md:p-8 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-2xl shadow-black/40">
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-voltage-yellow/5 rounded-full blur-3xl pointer-events-none"></div>
                <div className="relative z-10 w-full flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-deep-space flex items-center justify-center border border-white/5 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] relative overflow-hidden group-hover:border-voltage-yellow/30 transition-colors">
                            <div className="absolute inset-0 bg-gradient-to-br from-voltage-yellow/10 to-transparent opacity-50"></div>
                            <div className="text-voltage-yellow relative z-10">
                                <BarChart3 className="w-8 h-8 md:w-10 md:h-10" />
                            </div>
                        </div>
                        <div>
                            <div className="flex flex-wrap items-center gap-2 mb-1.5 md:mb-2">
                                <span className="bg-deep-space text-xs font-bold px-3 py-1 rounded-full border border-gray-700 text-gray-300 uppercase tracking-wider">
                                    Overall Progress
                                </span>
                            </div>
                            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-2 md:mb-1">
                                Player Analytics
                            </h1>
                            <p className="text-gray-400 text-sm md:text-base font-medium max-w-xl">
                                Detailed breakdown of your learning journey and topic mastery.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Top Level KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
               <motion.div whileHover={{ y: -4 }} className="bg-graphite border border-white/5 rounded-2xl p-5 flex flex-col gap-2">
                   <div className="w-10 h-10 rounded-xl bg-gray-800/80 flex flex-col justify-center items-center mb-2 border border-gray-700">
                       <Crosshair className="w-5 h-5 text-voltage-yellow" />
                   </div>
                   <div className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Avg Accuracy</div>
                   <div className="text-2xl md:text-3xl font-black text-white">{Math.round(avgOverallAccuracy)}<span className="text-sm text-gray-500 font-bold">%</span></div>
               </motion.div>
               
               <motion.div whileHover={{ y: -4 }} className="bg-graphite border border-white/5 rounded-2xl p-5 flex flex-col gap-2">
                   <div className="w-10 h-10 rounded-xl bg-gray-800/80 flex flex-col justify-center items-center mb-2 border border-gray-700">
                       <CheckCircle2 className="w-5 h-5 text-success-green" />
                   </div>
                   <div className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Mastered</div>
                   <div className="text-2xl md:text-3xl font-black text-white">{proficientTopics} <span className="text-sm text-gray-500 font-bold uppercase">Topics</span></div>
               </motion.div>
               
               <motion.div whileHover={{ y: -4 }} className="bg-graphite border border-white/5 rounded-2xl p-5 flex flex-col gap-2">
                   <div className="w-10 h-10 rounded-xl bg-gray-800/80 flex flex-col justify-center items-center mb-2 border border-gray-700">
                       <TrendingUp className="w-5 h-5 text-blue-400" />
                   </div>
                   <div className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Quiz Attempts</div>
                   <div className="text-2xl md:text-3xl font-black text-white">{totalAttempts} <span className="text-sm text-gray-500 font-bold uppercase">Plays</span></div>
               </motion.div>
               
               <motion.div whileHover={{ y: -4 }} className="bg-graphite border border-white/5 rounded-2xl p-5 flex flex-col gap-2">
                   <div className="w-10 h-10 rounded-xl bg-gray-800/80 flex flex-col justify-center items-center mb-2 border border-gray-700">
                       <Clock className="w-5 h-5 text-purple-400" />
                   </div>
                   <div className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Time Spent</div>
                   <div className="text-2xl md:text-3xl font-black text-white">{formatTime(totalTimeSeconds)}</div>
               </motion.div>
               
               <motion.div whileHover={{ y: -4 }} className="bg-graphite border border-white/5 rounded-2xl p-5 flex flex-col gap-2">
                   <div className="w-10 h-10 rounded-xl bg-gray-800/80 flex flex-col justify-center items-center mb-2 border border-gray-700">
                       <RotateCcw className="w-5 h-5 text-rose-500" />
                   </div>
                   <div className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Err Res. Rate</div>
                   <div className="text-2xl md:text-3xl font-black text-white">{errAnalytics ? errAnalytics.err_percentage : 0} <span className="text-sm text-gray-500 font-bold">%</span></div>
               </motion.div>
            </div>

            {/* Detailed Subject Breakdown */}
            <div className="space-y-4">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5 text-voltage-yellow" /> Subject Mastery Breakdown
                </h3>
                {subjectDetails.map((subj) => {
                    const pct = Number(subj.progress) || 0;
                    const isExpanded = expandedSubject === subj.subject_code;
                    
                    return (
                        <div key={subj.subject_code} className="bg-graphite border border-white/5 rounded-2xl overflow-hidden transition-all duration-300">
                            {/* Subject Header */}
                            <button 
                                onClick={() => setExpandedSubject(isExpanded ? null : subj.subject_code)}
                                className="w-full p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-deep-space flex flex-col items-center justify-center border border-gray-700">
                                       {subj.icon_class ? <i className={`${subj.icon_class} text-voltage-yellow text-xl`}></i> : <Zap className="w-5 h-5 text-voltage-yellow" />}
                                    </div>
                                    <div className="text-left">
                                        <h4 className="text-lg font-bold text-white capitalize">{subj.name}</h4>
                                        <div className="text-xs text-gray-400 font-medium tracking-wide">
                                            {formatTime(subj.timeSpent)} spent • {subj.chapters.length} attempted concepts
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6 w-full md:w-auto">
                                    <div className="flex-1 md:w-32 hidden sm:block">
                                        <div className="flex justify-between items-center text-xs mb-1">
                                            <span className="text-gray-400 font-bold uppercase tracking-wider">Mastery</span>
                                            <span className="text-white font-black">{pct.toFixed(0)}%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-deep-space rounded-full overflow-hidden">
                                            <div className="h-full bg-voltage-yellow rounded-full transition-all" style={{ width: `${pct}%` }}></div>
                                        </div>
                                    </div>
                                    <div className="text-gray-500">
                                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                    </div>
                                </div>
                            </button>

                            {/* Expanded Chapter Details */}
                            {isExpanded && (
                                <div className="p-5 border-t border-white/5 bg-deep-space/50">
                                    <div className="grid grid-cols-3 gap-4 mb-6 mt-2 max-w-2xl text-center">
                                        <div className="bg-deep-space rounded-xl p-3 border border-gray-800">
                                            <div className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-1">Easy Acc.</div>
                                            <div className="text-lg font-black text-success-green">{Math.round(subj.easyAcc)}%</div>
                                        </div>
                                        <div className="bg-deep-space rounded-xl p-3 border border-gray-800">
                                            <div className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-1">Med Acc.</div>
                                            <div className="text-lg font-black text-voltage-yellow">{Math.round(subj.medAcc)}%</div>
                                        </div>
                                        <div className="bg-deep-space rounded-xl p-3 border border-gray-800">
                                            <div className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-1">Hard Acc.</div>
                                            <div className="text-lg font-black text-error-red">{Math.round(subj.hardAcc)}%</div>
                                        </div>
                                    </div>
                                    
                                    <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 px-2">Concept Breakdown</h5>
                                    
                                    {subj.chapters.length > 0 ? (
                                        <div className="space-y-3">
                                            {subj.chapters.map(ch => (
                                                <div key={ch.id} className="bg-graphite/40 rounded-xl p-4 border border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                    <div className="flex items-start gap-3 flex-1">
                                                        <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${ch.status === 'proficient' ? 'bg-success-green shadow-[0_0_8px_rgba(74,222,128,0.4)]' : 'bg-voltage-yellow shadow-[0_0_8px_rgba(255,215,0,0.4)]'}`}></div>
                                                        <div>
                                                            <div className="text-sm font-bold text-gray-200">{ch.title}</div>
                                                            <div className="text-xs text-gray-500 font-medium tracking-wide">
                                                                Attempted {ch.attempts} times • {formatTime(Number(ch.total_time_seconds) || 0)} spent • <span className="text-voltage-yellow font-bold text-[11px] uppercase ml-1">Overall Acc: {Math.round(Number(ch.accuracy) || 0)}%</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-xs font-bold w-full md:w-auto">
                                                        <div className="bg-deep-space flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-800" title="Easy Accuracy">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-success-green"></div> {Math.round(Number(ch.easy_accuracy) || 0)}%
                                                        </div>
                                                        <div className="bg-deep-space flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-800" title="Medium Accuracy">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-voltage-yellow"></div> {Math.round(Number(ch.medium_accuracy) || 0)}%
                                                        </div>
                                                        <div className="bg-deep-space flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-800" title="Hard Accuracy">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-error-red"></div> {Math.round(Number(ch.hard_accuracy) || 0)}%
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-sm text-gray-500 px-2 py-4 italic">No concepts practiced yet.</div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            
            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                  width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                  background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                  background: #374151;
                  border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                  background: #4b5563;
                }
            `}</style>
        </div>
    );
}

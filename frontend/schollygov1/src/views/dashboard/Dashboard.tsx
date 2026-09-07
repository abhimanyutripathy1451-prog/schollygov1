import React, { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '../../stores/auth';
import { Logo } from '../../components/ui/Logo';
import { SubjectCard, User } from '../../types';
import {
    Zap, Flame, BookOpen, ScrollText,
    Calculator, FlaskConical, Clock, AlertTriangle, Check, Calendar, Target,
    Shield, Trophy, Hexagon, Star, ChevronRight, Swords
} from 'lucide-react';
import { getRankTitle } from '../../utils/gamification';
import { DynamicNoticeBoard } from '../../components/ui/DynamicNoticeBoard';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { AvatarContainer } from '../../components/ui/AvatarContainer';
import { MidnightSkeleton } from '../../components/ui/MidnightSkeleton';
import { useReducedMotion, motion } from 'motion/react';

interface DashboardProps {
    apiBase?: string;
    onNavigate: (route: string, data?: any) => void;
}

export interface UnifiedNotice {
    id: string;
    message: string;
    priority: number;
    sticky: boolean;
    icon?: React.ReactNode | string;
    action_cta?: string;
    action_url?: string;
    isBackend?: boolean;
}

export default function Dashboard({ apiBase = import.meta.env.VITE_API_URL || '', onNavigate }: DashboardProps) {
    const { user: authUser, updateUser } = useAuthStore();
    const shouldReduceMotion = useReducedMotion();

    const [subjects, setSubjects] = useState<SubjectCard[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [liveProfile, setLiveProfile] = useState<any>(null);
    const [activeNotice, setActiveNotice] = useState<any>(null);
    const [dismissedNoticeIds, setDismissedNoticeIds] = useState<Set<string>>(() => {
        try {
            const stored = sessionStorage.getItem('dismissed_notices');
            return stored ? new Set(JSON.parse(stored)) : new Set();
        } catch {
            return new Set();
        }
    });

    const getToken = () => localStorage.getItem('access_token') || localStorage.getItem('token') || sessionStorage.getItem('access_token') || sessionStorage.getItem('token') || '';

    const fetchProfile = async () => {
        const userId = authUser?.id || authUser?.user_id;
        if (!userId) return;

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);
            const res = await fetch(`${apiBase}/auth/profile/${userId}`, {
                headers: { Authorization: `Bearer ${getToken()}` },
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (res.ok) {
                const data = await res.json();
                setLiveProfile(data);
                updateUser(data);
            } else {
                throw new Error("Failed to load profile data.");
            }
        } catch (err: any) {
            // We can gracefully let the profile remain null or fallback to authUser local state
            // Supressing error log to avoid noise when backend is not connected
        }
    };

    const fetchSubjects = async () => {
        const curriculumCode = liveProfile?.curriculum_code || authUser?.curriculum_code;
        const grade = liveProfile?.grade || authUser?.grade;

        if (!curriculumCode) {
            setFetchError('Curriculum not set. Please check your profile settings.');
            return;
        }

        setIsLoading(true);
        setFetchError(null);

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            const url = `${apiBase}/curriculum/subjects?curriculum_code=${encodeURIComponent(curriculumCode)}`;
            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${getToken()}` },
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!res.ok) {
                throw new Error(`Server responded with ${res.status}`);
            }

            const data: any[] = await res.json();
            setSubjects(data.map((s) => {
                const translations = typeof s.name_translations === 'string' ? JSON.parse(s.name_translations) : (s.name_translations || {});
                return {
                    id: s.subject_id || s.id,
                    name: s.name || translations.en || 'Subject',
                    name_translations: translations,
                    icon: s.icon_class,
                    progress: Number(s.progress ?? 0),
                    chapters_completed: Number(s.chapters_completed ?? 0),
                    total_chapters: Number(s.total_chapters ?? 0),
                    total_xp: Number(s.total_xp ?? 0),
                    curriculum_medium: s.curriculum_medium,
                };
            }));
        } catch (err: any) {
            setFetchError("Unable to load subjects at the moment. Please check your connection or try again later.");
            setSubjects([]);
        } finally {
            setIsLoading(false);
        }
    };


    const fetchNotice = async () => {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);
            
            const currentHour = new Date().getHours().toString();
            
            const res = await fetch(`${apiBase}/api/v2/notices/active`, {
                headers: { 
                    Authorization: `Bearer ${getToken()}`,
                    'x-local-hour': currentHour 
                },
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            
            if (res.ok) {
                const data = await res.json();
                setActiveNotice(data);
            }
        } catch (err) {
            console.error('Failed to fetch notices:', err);
        }
    };

    const handleDismissNotice = async (notice: UnifiedNotice) => {
        const newDismissed = new Set(dismissedNoticeIds);
        newDismissed.add(notice.id);
        setDismissedNoticeIds(newDismissed);
        sessionStorage.setItem('dismissed_notices', JSON.stringify(Array.from(newDismissed)));
        setCurrentNoticeIdx(0); // Safely reset index

        if (notice.isBackend) {
            try {
                await fetch(`${apiBase}/api/v2/notices/${notice.id}/dismiss`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${getToken()}` },
                });
                setActiveNotice(null);
            } catch (err) {
                console.error('Failed to dismiss backend notice:', err);
            }
        }
    };

    useEffect(() => {
        const init = async () => {
            await fetchProfile();
            await fetchSubjects();
            await fetchNotice();
        };
        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authUser?.id]);

    // Backend's Gamification Math Engine comes mapped directly from profile
    const player = useMemo(() => {
        const currentXp = liveProfile?.total_xp ?? authUser?.xp ?? authUser?.score ?? 0;

        const displayId = liveProfile?.nickname || liveProfile?.username || authUser?.username || authUser?.fullName || 'player_one';
        const customAvatar = liveProfile?.avatar_seed || authUser?.avatar || authUser?.avatarSeed || authUser?.avatar_seed;

        let avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${displayId}&backgroundColor=1A1A1A`;
        if (customAvatar) {
            avatarUrl = (customAvatar.startsWith('http://') || customAvatar.startsWith('https://'))
                ? customAvatar
                : `https://api.dicebear.com/7.x/avataaars/svg?seed=${customAvatar}&backgroundColor=1A1A1A`;
        }

        const xpInLevel = liveProfile?.xpWithinLevel ?? currentXp;
        const targetXp = liveProfile?.next_level_xp ?? 2000;
        const computedProgress = targetXp > 0 ? Math.min(100, Math.max(0, (xpInLevel / targetXp) * 100)) : 0;

        return {
            id: displayId,
            avatar: avatarUrl,
            level: liveProfile?.computed_level || 1,
            rankTitle: getRankTitle(liveProfile?.computed_level || authUser?.level || 1),
            xp: currentXp,
            nextLevelXp: targetXp,
            xpWithinLevel: xpInLevel,
            progress: computedProgress,
            streak: liveProfile?.current_streak ?? authUser?.streak ?? authUser?.current_streak ?? 0,
        };
    }, [liveProfile, authUser]);

    const [animatedProgress, setAnimatedProgress] = useState(0);

    useEffect(() => {
        // Reset to 0 when unmounted, but here we just animate up when player.progress changes
        const timer = setTimeout(() => {
            setAnimatedProgress(player.progress);
        }, 100);
        return () => clearTimeout(timer);
    }, [player.progress]);

    const averageMastery = useMemo(() => {
        if (!subjects || subjects.length === 0) return 0;
        return Math.round(subjects.reduce((acc, sub) => acc + (sub.progress || 0), 0) / subjects.length);
    }, [subjects]);

    const greeting = useMemo(() => {
        const hour = new Date().getHours();
        if (hour < 12) return { text: "Good morning", icon: "☀️" };
        if (hour < 18) return { text: "Good afternoon", icon: "✨" };
        return { text: "Good evening", icon: "🌙" };
    }, []);

    const unifiedQueue = useMemo(() => {
        const queue: UnifiedNotice[] = [];

        // Priority 1: Backend Notice
        if (activeNotice && !dismissedNoticeIds.has(activeNotice.id || 'backend_notice')) {
            queue.push({
                id: activeNotice.id || 'backend_notice',
                message: activeNotice.message,
                priority: 1,
                sticky: true,
                icon: activeNotice.icon,
                action_cta: activeNotice.action_cta,
                action_url: activeNotice.action_url,
                isBackend: true
            });
        }

        // Priority 2: Onboarding
        if (player.xp === 0 && !dismissedNoticeIds.has('local-onboarding-zero-xp')) {
            queue.push({
                id: 'local-onboarding-zero-xp',
                message: `🎯 Welcome to SchollyGo! Take your first practice quiz to establish your baseline and earn your first XP.`,
                priority: 2,
                sticky: true
            });
        } else {
            // Priority 3 / 4: Nudges and Streaks
            if (!dismissedNoticeIds.has('local-mastery-reminder')) {
                queue.push({
                    id: 'local-mastery-reminder',
                    message: `💡 Every master was once a beginner! Don't forget to correct your mistakes by revisiting the Weakness Deck.`,
                    priority: 4,
                    sticky: false
                });
            }

            if (player.streak > 0) {
                if (!dismissedNoticeIds.has('local-streak-epic')) {
                    queue.push({
                        id: 'local-streak-epic',
                        message: `🔥 Keep the fire burning! You are on an epic ${player.streak}-day streak!`,
                        priority: 3,
                        sticky: false
                    });
                }
            } else {
                if (!dismissedNoticeIds.has('local-streak-start')) {
                    queue.push({
                        id: 'local-streak-start',
                        message: `🔥 Start your streak today! Consistency is the key to mastery.`,
                        priority: 3,
                        sticky: false
                    });
                }
            }
        }

        return queue.sort((a, b) => a.priority - b.priority);
    }, [activeNotice, player.xp, player.streak, dismissedNoticeIds]);

    const [currentNoticeIdx, setCurrentNoticeIdx] = useState(0);
    const [isNoticePaused, setIsNoticePaused] = useState(false);

    const safeNoticeIdx = currentNoticeIdx >= unifiedQueue.length ? 0 : currentNoticeIdx;
    const currentNotice = unifiedQueue[safeNoticeIdx];

    useEffect(() => {
        if (unifiedQueue.length === 0 || isNoticePaused || currentNotice?.sticky) return;
        const interval = setInterval(() => {
            setCurrentNoticeIdx(prev => (prev + 1) >= unifiedQueue.length ? 0 : prev + 1);
        }, 4000); 
        return () => clearInterval(interval);
    }, [unifiedQueue.length, isNoticePaused, currentNotice?.sticky]);

    const getIcon = (iconStr: string | undefined, size = "w-6 h-6") => {
        if (!iconStr) return <BookOpen className={size} />;
        if (iconStr.includes('ph-')) return <i className={`${iconStr} text-2xl`}></i>;
        if (iconStr.includes('calculator')) return <Calculator className={size} />;
        if (iconStr.includes('flask')) return <FlaskConical className={size} />;
        if (iconStr.includes('book')) return <BookOpen className={size} />;
        if (iconStr.includes('scroll')) return <ScrollText className={size} />;
        if (iconStr.includes('clock')) return <Clock className={size} />;
        return <BookOpen className={size} />;
    };

    return (
        <div className="w-full min-h-screen bg-transparent font-sans text-white flex flex-col relative">
            <div className="p-4 pb-28 md:p-8 max-w-5xl mx-auto space-y-6 w-full flex-1">
                {/* Greeting Section */}
                <div className="mt-2 md:mt-4 mb-6">
                    {isLoading && !liveProfile ? (
                        <div className="flex items-center gap-4">
                            <div className="flex flex-col gap-2">
                                <MidnightSkeleton className="h-8 w-48" />
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-4">
                            <h2 className="text-2xl md:text-4xl flex flex-wrap items-center gap-x-2 gap-y-1 tracking-tight">
                                <span className="font-medium text-text-secondary">{greeting.text},</span>
                                <span className="font-black text-brand-primary drop-shadow-sm inline-block pb-1">
                                    {player.id.split(' ')[0]}
                                </span>
                                <span>{greeting.icon}</span>
                            </h2>
                        </div>
                    )}
                </div>

                {/* Dashboard Metrics Area */}
                {isLoading ? (
                    <div className="space-y-6">
                        <MidnightSkeleton className="w-full h-32 rounded-[2.5rem]" />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <MidnightSkeleton className="h-24 rounded-[2.5rem]" />
                            <MidnightSkeleton className="h-24 rounded-[2.5rem]" />
                            <MidnightSkeleton className="h-24 rounded-[2.5rem]" />
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Primary Daily Goal */}
                        <Card variant="gamified" className="p-1">
                            <div className="p-5 md:p-6 relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden">
                                <div className="flex-1 relative z-10">
                                    <h3 className="text-brand-primary font-bold text-sm uppercase tracking-widest mb-1">Featured Quest</h3>
                                    {player.xp === 0 ? (
                                        <>
                                            <h4 className="text-2xl font-black text-white mb-2">Welcome to the Arena! 🏟️</h4>
                                            <p className="text-sm text-text-secondary mb-4">Your learning journey begins now. Start practicing to earn your first XP and unlock ranks.</p>
                                            <Button size="sm" variant="primary" onClick={() => onNavigate('dashboard')} className="shadow-[0_0_15px_rgba(250,204,21,0.2)]">Start Your First Quest →</Button>
                                        </>
                                    ) : (
                                        <>
                                            <h4 className="text-2xl font-black text-white mb-2">Keep Grinding!</h4>
                                            <p className="text-sm text-text-secondary mb-4">Conquer a new topic today to keep your momentum going and earn bonus XP!</p>
                                            <Button size="sm" variant="primary" onClick={() => onNavigate('dashboard')} className="shadow-[0_0_15px_rgba(250,204,21,0.2)]">Jump into Practice →</Button>
                                        </>
                                    )}
                                </div>
                                <div className="hidden md:flex shrink-0 items-center justify-center bg-bg-surface-elevated border-2 border-brand-primary/30 p-4 rounded-2xl shadow-inner relative overflow-hidden">
                                    <Target className="w-10 h-10 text-brand-primary animate-pulse relative z-10" />
                                </div>
                                {/* Mobile-only watermark icon */}
                                <Target className="md:hidden absolute -right-4 top-1/2 -translate-y-1/2 w-32 h-32 text-brand-primary opacity-5 pointer-events-none" />
                            </div>
                        </Card>

                        {/* Metrics Grid */}
                        <section aria-labelledby="metrics-heading" className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <h2 id="metrics-heading" className="sr-only">Performance Metrics</h2>
                            
                            {/* XP Progress Card */}
                            <Card variant="default" className="p-5 flex flex-col justify-center gap-3 col-span-2 md:col-span-1">
                                <div className="flex items-center justify-between relative z-10">
                                    <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest">Rank & XP</h3>
                                    <Badge variant="rank" className="!text-[10px]">{player.rankTitle}</Badge>
                                </div>
                                <div className="relative z-10">
                                    <div className="flex justify-between items-end mb-2">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-brand-primary font-black text-xl leading-none">{player.xpWithinLevel}</span>
                                            <span className="text-text-secondary font-bold text-xs">{player.nextLevelXp > 0 ? `/ ${player.nextLevelXp}` : ""}</span>
                                        </div>
                                    </div>
                                    <div className="w-full h-3 bg-bg-surface-elevated rounded-full overflow-hidden border border-border-subtle shadow-inner">
                                        <div
                                            className="h-full bg-gradient-to-r from-brand-primary to-orange-500 rounded-full shadow-sm"
                                            style={{
                                                width: `${Number.isNaN(animatedProgress) ? 0 : animatedProgress}%`,
                                                transition: shouldReduceMotion ? 'none' : 'width 1.2s ease-out',
                                                opacity: animatedProgress > 0 ? 1 : 0
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            </Card>

                            {/* Accuracy/Mastery Card */}
                            <Card variant="default" className="p-5 flex flex-col justify-center gap-3 relative overflow-hidden">
                                <Zap className="absolute -right-4 -bottom-4 w-24 h-24 text-semantic-info opacity-5 pointer-events-none" />
                                <div className="flex items-center justify-between relative z-10">
                                    <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest">Mastery</h3>
                                    <div className="w-6 h-6 rounded-full bg-semantic-info/10 flex items-center justify-center border border-semantic-info/20">
                                        <Zap className="w-3 h-3 text-semantic-info" />
                                    </div>
                                </div>
                                <div className="flex items-baseline gap-1 relative z-10">
                                    <span className="text-white font-black text-3xl leading-none">{averageMastery}</span>
                                    <span className="text-text-secondary font-bold text-sm">%</span>
                                </div>
                            </Card>

                            {/* Streak Card */}
                            <Card variant="default" className="p-5 flex flex-col justify-center gap-3 relative overflow-hidden">
                                <Flame className="absolute -right-4 -bottom-4 w-24 h-24 text-orange-500 opacity-5 pointer-events-none" />
                                <div className="flex items-center justify-between relative z-10">
                                    <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest">Streak</h3>
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${player.streak > 0 ? 'bg-orange-500/10 border-orange-500/20' : 'bg-bg-surface-elevated border-border-subtle'}`}>
                                        <Flame className={`w-3 h-3 ${player.streak > 0 ? 'text-orange-500' : 'text-text-muted'}`} />
                                    </div>
                                </div>
                                <div className="relative z-10">
                                    <div className="flex items-baseline gap-1 mb-1">
                                        <span className="text-white font-black text-3xl leading-none">{player.streak}</span>
                                        <span className="text-text-secondary font-bold text-sm">Days</span>
                                    </div>
                                    {player.streak === 0 && (
                                        <p className="text-[10px] text-text-muted font-bold tracking-wide">Start your streak today!</p>
                                    )}
                                </div>
                            </Card>
                        </section>
                    </div>
                )}

                {/* Dynamic Notice Board (Bottom) */}
                {currentNotice && (
                    <div 
                        className="mt-4"
                        onMouseEnter={() => setIsNoticePaused(true)}
                        onMouseLeave={() => setIsNoticePaused(false)}
                    >
                        <DynamicNoticeBoard 
                            icon={currentNotice.icon}
                            message={currentNotice.message}
                            buttonText={currentNotice.action_cta}
                            onClickAction={currentNotice.action_url ? () => onNavigate(currentNotice.action_url!) : undefined}
                            onDismiss={() => handleDismissNotice(currentNotice)}
                        />
                    </div>
                )}

                {/* Arsenal */}
                <Card variant="default" className="mb-10 group">
                    <div className="mb-6">
                        <h3 className="text-2xl font-black text-text-primary tracking-tight flex items-center gap-2 mb-1">
                            <Swords className="w-6 h-6 text-brand-primary fill-brand-primary"/> My Arsenal
                        </h3>
                        <p className="text-sm text-text-secondary font-bold">Displaying subjects as per your board curriculum.</p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 relative z-10">
                        {isLoading ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <MidnightSkeleton key={i} className="w-full h-24 rounded-[2rem]" />
                            ))
                        ) : subjects.length > 0 ? (
                            subjects.map((sub, idx) => (
                                <Card
                                    variant="interactive"
                                    key={sub.id}
                                    onClick={() => onNavigate('chapterview', sub.name)}
                                    className="w-full flex flex-col gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-app"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            onNavigate('chapterview', sub.name);
                                        }
                                    }}
                                >
                                    <div className="grid grid-cols-[1fr_auto] gap-4 items-start w-full">
                                        <div className="overflow-hidden">
                                            <div className="flex items-center gap-3 mb-1">
                                                <div className="shrink-0 w-8 h-8 rounded-lg font-black flex items-center justify-center text-sm border shadow-inner bg-brand-primary/10 text-brand-primary border-brand-primary/30">
                                                    {getIcon(sub.icon || '', "w-4 h-4")}
                                                </div>
                                                <h4 className="font-black text-lg text-text-primary group-hover:text-brand-primary transition-colors leading-tight truncate">
                                                    {sub.name}
                                                </h4>
                                            </div>
                                            {sub.curriculum_medium?.toLowerCase() !== 'english' && (
                                                <span className="text-sm font-bold text-text-secondary mt-0.5 block pl-11 truncate">
                                                    {sub.name_translations?.[sub.curriculum_medium?.toLowerCase() === 'hindi' ? 'hi' : sub.curriculum_medium?.toLowerCase().substring(0, 2) || 'hi'] || sub.name_translations?.hi}
                                                </span>
                                            )}
                                        </div>
                                        <button tabIndex={-1} className="shrink-0 w-10 h-10 bg-bg-surface border-2 border-brand-primary text-brand-primary rounded-xl group-hover:bg-brand-primary group-hover:text-black transition-colors flex items-center justify-center">
                                            <ChevronRight className="w-5 h-5 ml-0.5" />
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 pt-3 border-t border-white/5">
                                        {(() => {
                                            const acc = Number(sub.progress) || 0;
                                            let variant: 'active' | 'info' | 'default' = 'default';
                                            let struggleMessage = "Not Started";
                                            
                                            if (acc >= 70) {
                                                variant = 'active';
                                                struggleMessage = "Mastered";
                                            } else if (acc > 0) {
                                                variant = 'info';
                                                struggleMessage = "In Progress";
                                            }
                                            
                                            return (
                                                <Badge variant={variant} className="!text-[10px]">
                                                    {struggleMessage}
                                                </Badge>
                                            );
                                        })()}
                                        
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] sm:text-xs font-semibold text-text-secondary uppercase tracking-widest ml-auto justify-end">
                                            <span className="whitespace-nowrap flex items-center gap-1">
                                                Mastery: <span className={(Number(sub.progress) || 0) >= 70 ? 'text-semantic-success' : (Number(sub.progress) || 0) >= 40 ? 'text-brand-primary' : 'text-semantic-error'}>{Math.round(Number(sub.progress) || 0)}%</span>
                                            </span>
                                            
                                            {sub.total_chapters !== undefined && sub.total_chapters > 0 && (
                                                <span className="hidden sm:flex whitespace-nowrap items-center gap-2">
                                                    <span className="text-border-subtle">•</span>
                                                    <span>Chapters: {sub.chapters_completed} / {sub.total_chapters}</span>
                                                </span>
                                            )}
                                            
                                            {sub.total_xp !== undefined && (
                                                <span className="whitespace-nowrap flex items-center gap-2">
                                                    <span className="text-border-subtle">•</span>
                                                    <span className="text-brand-primary font-black drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]">{sub.total_xp} XP</span>
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            ))
                        ) : (
                            <div className="col-span-1 flex flex-col items-center justify-center text-center text-text-secondary py-12 px-6 md:px-10 bg-bg-surface rounded-[2rem] border-2 border-border-subtle/50 border-dashed">
                                <BookOpen className="w-12 h-12 text-border-subtle mb-4" />
                                <h4 className="text-xl font-black text-text-primary tracking-tight mb-2">Coming Soon!</h4>
                                <p className="font-bold text-sm max-w-sm">We are preparing the curriculum. Check back later to start your journey.</p>
                            </div>
                        )}
                    </div>
                </Card>

            </div>

            <style>{`
            .custom-animate-float { animation: float 3s ease-in-out infinite; }
            @keyframes float {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-5px); }
            }
            .animate-shadow-pulse { animation: shadow-pulse 3s infinite ease-in-out; }
            @keyframes shadow-pulse {
                0%, 100% { filter: drop-shadow(0 0 10px rgba(251,192,45,0.4)); }
                50% { filter: drop-shadow(0 0 25px rgba(251,192,45,0.8)); }
            }
            .scrollbar-hide::-webkit-scrollbar {
                display: none;
            }
            .scrollbar-hide {
                -ms-overflow-style: none;
                scrollbar-width: none;
            }
            `}</style>
        </div>
    );
}

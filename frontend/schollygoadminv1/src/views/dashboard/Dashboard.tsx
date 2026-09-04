import React, { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '../../stores/auth';
import { Logo } from '../../components/ui/Logo';
import { SubjectCard } from '../../types';
import { 
    BookOpen, ScrollText, Calculator, FlaskConical, Clock,
    Users, Gift, CheckCircle
} from 'lucide-react';

interface DashboardProps {
    apiBase?: string;
    onNavigate: (route: string, state?: any) => void;
}

export default function Dashboard({ apiBase = import.meta.env.VITE_API_URL || '', onNavigate }: DashboardProps) {
    const { user: authUser, updateUser } = useAuthStore();
    
    const [subjects, setSubjects] = useState<SubjectCard[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [liveProfile, setLiveProfile] = useState<any>(null);

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
        const board = liveProfile?.board || authUser?.board;
        const grade = liveProfile?.grade || authUser?.grade;

        if (!board || !grade) {
            setFetchError('Board or grade not set. Please check your profile settings.');
            return;
        }

        setIsLoading(true);
        setFetchError(null);

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            const url = `${apiBase}/curriculum/subjects?board=${encodeURIComponent(board)}&grade=${encodeURIComponent(grade)}`;
            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${getToken()}` },
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!res.ok) {
                throw new Error(`Server responded with ${res.status}`);
            }

            const data: any[] = await res.json();
            setSubjects(data.map((s) => ({
                id: s.subject_id || s.id,
                name: s.name,
                hindiName: s.name_hi,
                icon: s.icon_class,
                progress: Number(s.progress ?? 0),
            })));
        } catch (err: any) {
            setFetchError("Unable to load subjects at the moment. Please check your connection or try again later.");
            setSubjects([]);
        } finally {
            setIsLoading(false);
        }
    };

    const [assignments, setAssignments] = useState<any[]>([]);
    const [isAssignmentsLoading, setIsAssignmentsLoading] = useState(false);

    const fetchAssignments = async () => {
        setIsAssignmentsLoading(true);
        try {
            // Removed /assignments fetch as requested
            setAssignments([]);
        } catch (err) {
            console.error(err);
        } finally {
            setIsAssignmentsLoading(false);
        }
    };

    useEffect(() => {
        const init = async () => {
            await fetchProfile();
            await fetchSubjects();
            await fetchAssignments();
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

        return {
            id: displayId,
            avatar: avatarUrl,
            level: liveProfile?.computed_level || 1,
            rankTitle: liveProfile?.rankTitle || authUser?.rankTitle || 'Novice',
            xp: currentXp,
            nextLevelXp: liveProfile?.next_level_xp || 2000,
            xpWithinLevel: liveProfile?.xpWithinLevel || currentXp,
            progress: liveProfile?.level_progress_percentage || 0,
            streak: liveProfile?.current_streak ?? authUser?.streak ?? authUser?.current_streak ?? 0,
            coins: liveProfile?.coins ?? authUser?.coins ?? 0,
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
        <div className="w-full min-h-screen bg-deep-space font-sans text-off-white flex flex-col relative">
            <header className="md:hidden flex items-center justify-between p-4 sticky top-0 bg-deep-space/90 backdrop-blur-md z-30 border-b border-gray-800">
                <div className="flex items-center gap-2">
                    <Logo className="h-6" />
                </div>
            </header>

            <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6 w-full flex-1">
                <div className="hidden md:flex justify-end items-end mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => onNavigate('profileview')}
                            className="w-12 h-12 rounded-full bg-graphite border-2 border-voltage-yellow flex items-center justify-center overflow-hidden cursor-pointer active:scale-95 shadow-[0_0_15px_rgba(255,215,0,0.2)] hover:opacity-90 transition-opacity"
                            aria-label="Go to profile"
                        >
                            <img src={player.avatar} alt="Player avatar" className="w-full h-full object-cover" />
                        </button>
                    </div>
                </div>

                {/* Welcome Note */}
                <h1 className="text-2xl md:text-3xl font-extrabold text-white mb-6">
                    Welcome, <span className="text-voltage-yellow">{player.id}</span>!
                </h1>

                {/* Partner KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    {/* Total Enrolled Students */}
                    <div className="bg-graphite rounded-2xl p-6 border border-gray-800 shadow-[0_4px_20px_rgba(0,0,0,0.5)] flex items-center gap-4 relative overflow-hidden group cursor-pointer hover:border-gray-700 transition-colors">
                        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                            <Users className="w-6 h-6 text-blue-500 group-hover:scale-110 transition-transform" />
                        </div>
                        <div>
                            <p className="text-gray-400 text-sm font-bold tracking-wider uppercase mb-1">Total Enrolled</p>
                            <h3 className="text-3xl font-black text-white">1,248</h3>
                        </div>
                    </div>

                    {/* On Free Trial */}
                    <div className="bg-graphite rounded-2xl p-6 border border-gray-800 shadow-[0_4px_20px_rgba(0,0,0,0.5)] flex items-center gap-4 relative overflow-hidden group cursor-pointer hover:border-gray-700 transition-colors">
                        <div className="absolute top-0 left-0 w-1 h-full bg-voltage-yellow"></div>
                        <div className="w-12 h-12 rounded-xl bg-voltage-yellow/10 flex items-center justify-center shrink-0">
                            <Gift className="w-6 h-6 text-voltage-yellow group-hover:scale-110 transition-transform" />
                        </div>
                        <div>
                            <p className="text-gray-400 text-sm font-bold tracking-wider uppercase mb-1">On Free Trial</p>
                            <h3 className="text-3xl font-black text-white">312</h3>
                        </div>
                    </div>

                    {/* Active Subscriptions */}
                    <div className="bg-graphite rounded-2xl p-6 border border-gray-800 shadow-[0_4px_20px_rgba(0,0,0,0.5)] flex items-center gap-4 relative overflow-hidden group cursor-pointer hover:border-gray-700 transition-colors">
                        <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                            <CheckCircle className="w-6 h-6 text-emerald-500 group-hover:scale-110 transition-transform" />
                        </div>
                        <div>
                            <p className="text-gray-400 text-sm font-bold tracking-wider uppercase mb-1">Active Subs</p>
                            <h3 className="text-3xl font-black text-white">845</h3>
                        </div>
                    </div>
                </div>


                {/* Batch Management */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <Users className="w-6 h-6 text-voltage-yellow" fill="currentColor" /> Batch Management
                        </h3>
                        <button className="text-xs font-extrabold text-voltage-yellow hover:underline underline-offset-4 uppercase tracking-wider transition-all">
                            View All
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[
                            { id: 1, board: 'CGBSESCIENCE', grade: '12th', students: 120 },
                            { id: 2, board: 'CGBSESCIENCE', grade: '11th', students: 85 },
                            { id: 3, board: 'CBSE', grade: '10th', students: 210 },
                            { id: 4, board: 'ICSE', grade: '10th', students: 64 },
                        ].map((batch) => (
                            <div 
                                key={batch.id} 
                                onClick={() => onNavigate('batch_detail', batch)}
                                className="bg-graphite border border-white/5 shadow-lg shadow-black/20 hover:border-voltage-yellow/50 hover:shadow-[0_8px_30px_rgb(255,215,0,0.15)] rounded-2xl p-5 flex items-center justify-between group cursor-pointer transition-all duration-300 w-full text-left"
                            >
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="bg-gray-800 text-gray-300 text-[10px] font-bold px-2 py-0.5 rounded-sm tracking-wider">{batch.board}</span>
                                    </div>
                                    <h4 className="text-lg font-bold text-white group-hover:text-voltage-yellow transition-colors">{batch.board} - {batch.grade}</h4>
                                    <p className="text-xs text-gray-500 font-medium mt-1">{batch.students} Students Enrolled</p>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-deep-space border border-white/5 flex items-center justify-center group-hover:bg-voltage-yellow/20 group-hover:border-voltage-yellow/40 transition-all duration-300 text-gray-400 group-hover:text-voltage-yellow">
                                    <svg className="w-5 h-5 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"></path></svg>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
            
            <style>{`
            .animate-fade-in-up { animation: fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
            @keyframes fadeInUp {
                0% { opacity: 0; transform: translateY(10px); }
                100% { opacity: 1; transform: translateY(0); }
            }
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

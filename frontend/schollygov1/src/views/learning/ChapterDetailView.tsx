import React, { useState, useEffect } from 'react';
import { 
    ArrowLeft, Sword, AlertOctagon, Loader2, FolderOpen, Play, 
    ExternalLink, Download, FileText, FileDown, File, TrendingUp, AlertTriangle, Target
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

interface Chapter {
    id: string | number;
    title: string;
    title_translations?: any;
    hindiTitle?: string;
    status: string;
    accuracy: number;
    easy_accuracy?: number;
    medium_accuracy?: number;
    hard_accuracy?: number;
    attempts: number;
    total_time_seconds?: number;
    name?: string;
    curriculum_medium?: string;
}

interface Topic {
    id: string | number;
    title: string;
    title_translations?: any;
    description?: string;
    importance_level?: string;
    base_difficulty?: string;
    estimated_minutes?: number;
    accuracy: number;
    attempts: number;
}

interface ChapterDetailViewProps {
    subject?: string;
    chapter?: Chapter | null;
    apiBase?: string;
    onBack: () => void;
    onStartQuiz: (topic: any, nextTopic?: any) => void;
}

export default function ChapterDetailView({
    subject = '',
    chapter,
    apiBase = import.meta.env.VITE_API_URL || '',
    onBack,
    onStartQuiz
}: ChapterDetailViewProps) {
    const [topics, setTopics] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [isFrictionModalOpen, setIsFrictionModalOpen] = useState(false);

    useEffect(() => {
        const fetchChapterData = async () => {
            if (!chapter?.id) return;
            setIsLoading(true);
            setFetchError(null);
            
            const headers = {
                'Authorization': `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('token') || sessionStorage.getItem('token') || ''}`
            };
            // Fetch Topics
            try {
                const topicsRes = await fetch(`${apiBase}/curriculum/chapters/${chapter.id}/topics`, { headers });
                if (topicsRes.ok) {
                    const tData = await topicsRes.json();
                    setTopics(tData);
                }
            } catch (e) {
                console.error("Topics fetch error", e);
            }
            
            setIsLoading(false);
        };

        fetchChapterData();
    }, [chapter?.id, chapter?.attempts, apiBase]);

    const secondaryLangCode = React.useMemo(() => {
        if (!chapter?.curriculum_medium || chapter.curriculum_medium.toLowerCase() === 'english') return null;
        const med = chapter.curriculum_medium.toLowerCase();
        return med === 'hindi' ? 'hi' : (med.substring(0, 2) || 'hi');
    }, [chapter?.curriculum_medium]);

    const chapterMastery = Math.round(chapter?.accuracy || 0);
    const averageTopicMastery = topics.length > 0 
        ? Math.round(topics.reduce((sum, t) => sum + (t.accuracy || 0), 0) / topics.length)
        : 0;
    const isReady = averageTopicMastery >= 70;

    return (
        <div className="min-h-screen bg-bg-app text-white pb-20 w-full relative z-10">
            {/* Mobile Header */}
            <header className="md:hidden flex items-center justify-between p-4 sticky top-0 bg-bg-app/90 backdrop-blur-md z-30 border-b border-border-subtle">
                <div className="flex items-center gap-3 w-full">
                    <button onClick={onBack} className="text-text-secondary hover:text-white transition-colors p-1 -ml-1 cursor-pointer active:scale-95">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div className="flex items-center gap-2 truncate">
                        <span className="font-bold text-lg text-white truncate">{chapter?.title || chapter?.name || 'Chapter Details'}</span>
                    </div>
                </div>
            </header>

            <div className="p-4 md:p-8 max-w-5xl mx-auto w-full flex-1">
                {/* Back Button outside Hero - Removed because nav bar already has back button */}

                {/* Chapter Hero Section */}
                <Card variant="gamified" className="mb-6 p-4 sm:p-6 md:p-8 flex flex-col relative overflow-hidden group">
                    <div className="relative z-10 w-full flex flex-col gap-5 md:gap-8">
                        <div className="flex items-center gap-3 sm:gap-5 w-full">
                            <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 shrink-0 rounded-[1rem] md:rounded-[1.25rem] bg-brand-primary/5 flex items-center justify-center border border-brand-primary/20 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] relative overflow-hidden transition-colors">
                                <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/10 to-transparent opacity-50"></div>
                                <div className="text-brand-primary relative z-10">
                                    <FileText className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10" />
                                </div>
                            </div>
                            <div className="min-w-0 flex-1">
                                <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-orange-300 tracking-tight leading-tight truncate whitespace-normal drop-shadow-sm">{chapter?.title || chapter?.name || 'Chapter Details'}</h2>
                                {secondaryLangCode && chapter?.title_translations && (chapter.title_translations[secondaryLangCode] || chapter.title_translations.hi) && (
                                    <span className="block text-text-secondary text-sm sm:text-base font-bold mt-1">
                                        {chapter.title_translations[secondaryLangCode] || chapter.title_translations.hi}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:flex md:flex-row gap-2 sm:gap-3 md:gap-4 w-full">
                            <div className="bg-black/20 backdrop-blur-sm border border-white/5 rounded-xl px-2 py-3 md:px-5 md:py-4 flex-1 min-w-0 text-center hover:-translate-y-1 transition-transform">
                                <div className="text-white font-black text-xl sm:text-2xl md:text-3xl leading-none mb-1.5">{topics.length}</div>
                                <div className="text-[10px] sm:text-xs text-text-secondary uppercase font-bold tracking-widest">Total Concepts</div>
                            </div>
                            <div className="bg-black/20 backdrop-blur-sm border border-white/5 rounded-xl px-2 py-3 md:px-5 md:py-4 flex-1 min-w-0 text-center hover:-translate-y-1 transition-transform">
                                <div className="text-white font-black text-xl sm:text-2xl md:text-3xl leading-none mb-1.5">{topics.filter(t => (t.accuracy || 0) >= 90).length}</div>
                                <div className="text-[10px] sm:text-xs text-text-secondary uppercase font-bold tracking-widest">Mastered</div>
                            </div>
                            <div className="bg-black/20 backdrop-blur-sm border border-white/5 rounded-xl px-2 py-3 md:px-5 md:py-4 flex-1 min-w-0 text-center hover:-translate-y-1 transition-transform relative overflow-hidden">
                                <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-brand-primary/20 to-orange-500/20 border-r-2 border-orange-500/50 transition-all duration-1000" style={{ width: `${averageTopicMastery}%` }}></div>
                                <div className="text-white font-black text-xl sm:text-2xl md:text-3xl leading-none mb-1.5 relative z-10">{averageTopicMastery}%</div>
                                <div className="text-[10px] sm:text-xs text-text-secondary uppercase font-bold tracking-widest relative z-10">Avg Mastery</div>
                            </div>
                            <div className="bg-black/20 backdrop-blur-sm border border-white/5 rounded-xl px-2 py-3 md:px-5 md:py-4 flex-1 min-w-0 text-center hover:-translate-y-1 transition-transform relative overflow-hidden group/accuracy">
                                <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-brand-primary/20 to-orange-500/20 border-r-2 border-orange-500/50 transition-all duration-1000" style={{ width: `${chapter?.accuracy || 0}%` }}></div>
                                <div className="text-brand-primary font-black text-xl sm:text-2xl md:text-3xl leading-none mb-1.5 relative z-10">{Math.round(chapter?.accuracy || 0)}%</div>
                                <div className="text-[10px] sm:text-xs text-text-secondary uppercase font-bold tracking-widest relative z-10">Chap Mastery</div>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Adaptive Practice Button (Moved Below) */}

                {/* Topics / Concepts List */}
                <Card variant="default" className="mb-10 p-6 md:p-8 flex flex-col relative overflow-hidden group">
                    <div className="mb-6">
                        <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-2 mb-1"><Target className="w-6 h-6 text-brand-primary"/> Concept Training Grounds</h3>
                        <p className="text-sm text-text-secondary font-bold">Master your foundational skills here. Reach 90% accuracy in these trials to prove your combat readiness.</p>
                    </div>
                    <div className="grid grid-cols-1 gap-4 relative z-10">
                        {topics.length > 0 ? topics.map((topic, index) => (
                            <Card variant="interactive" key={topic.id} onClick={() => onStartQuiz(topic, topics[index + 1] || null)} className="w-full p-5 flex flex-col group/topic gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-app">
                                <div className="flex flex-row items-start justify-between w-full gap-2">
                                    <div className="flex-1 min-w-0 pr-2 sm:pr-4">
                                        <div className="flex items-start sm:items-center gap-2 sm:gap-3 mb-1">
                                            <div className="shrink-0 w-6 h-6 sm:w-8 sm:h-8 mt-0.5 sm:mt-0 rounded-md sm:rounded-lg bg-brand-primary/10 text-brand-primary font-black flex items-center justify-center text-xs sm:text-sm border border-brand-primary/30 shadow-inner">
                                                {index + 1}
                                            </div>
                                            <h4 className="font-black text-base sm:text-lg text-white group-hover/topic:text-brand-primary transition-colors leading-tight break-words">
                                                {topic.title || 'Concept ' + topic.id}
                                            </h4>
                                        </div>
                                        {secondaryLangCode && topic.title_translations && (
                                            <span className="text-xs sm:text-sm font-bold text-text-secondary mt-0.5 block pl-8 sm:pl-11">
                                                {typeof topic.title_translations === 'string' 
                                                    ? (JSON.parse(topic.title_translations)[secondaryLangCode] || JSON.parse(topic.title_translations).hi)
                                                    : (topic.title_translations[secondaryLangCode] || topic.title_translations.hi)}
                                            </span>
                                        )}
                                        {topic.description && (
                                            <p className="hidden sm:block text-xs text-gray-400 mt-1.5 leading-snug line-clamp-2 pl-11">
                                                {topic.description}
                                            </p>
                                        )}
                                    </div>
                                    <button className="shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-bg-surface border-2 border-brand-primary text-brand-primary rounded-lg sm:rounded-xl group-hover/topic:bg-brand-primary group-hover/topic:text-black transition-colors flex items-center justify-center mt-0.5 sm:mt-0">
                                        <Play className="w-3 h-3 sm:w-4 sm:h-4 fill-current ml-0.5" />
                                    </button>
                                </div>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 pt-3 border-t border-white/5">
                                    {(() => {
                                        const attempts = topic.attempts || 0;
                                        const acc = topic.accuracy || 0;
                                        let variant: 'active' | 'info' | 'error' | 'default' = 'default';
                                        let struggleMessage = "Not Started";
                                        
                                        if (attempts > 0) {
                                            if (acc >= 90) {
                                                variant = 'active';
                                                struggleMessage = "Mastered";
                                            } else if (attempts >= 2 && acc < 70) {
                                                variant = 'error';
                                                struggleMessage = "Needs Attention";
                                            } else {
                                                variant = 'info';
                                                struggleMessage = "Keep Improving";
                                            }
                                        }
                                        return (
                                            <Badge variant={variant} className="!text-[10px]">
                                                {struggleMessage}
                                            </Badge>
                                        );
                                    })()}
                                    <div className="flex items-center gap-3 text-[10px] font-bold text-text-secondary uppercase tracking-widest ml-auto">
                                        <span>Mastery: {topic.mastery_state === 'calibrating' ? (
                                            <span className="text-brand-primary animate-pulse">Calibrating</span>
                                        ) : (
                                            <span className={topic.accuracy >= 80 ? 'text-semantic-success' : topic.accuracy >= 50 ? 'text-brand-primary' : 'text-semantic-error'}>{Math.round(topic.accuracy || 0)}%</span>
                                        )}</span>
                                        <span>•</span>
                                        <span>Plays: {topic.attempts || 0}</span>
                                    </div>
                                </div>
                            </Card>
                        )) : (
                            <div className="col-span-full py-8 text-center text-text-secondary font-bold">
                                No concepts found for this chapter.
                            </div>
                        )}
                    </div>
                </Card>

                {/* Adaptive Practice Button */}
                <div className="mb-8">
                    <button 
                        onClick={() => {
                            if (isReady) {
                                onStartQuiz(null);
                            } else {
                                setIsFrictionModalOpen(true);
                            }
                        }}
                        className={`w-full md:w-auto py-5 md:py-6 px-6 md:px-8 rounded-[2rem] flex items-center justify-center md:justify-start gap-4 md:gap-6 font-black border-2 border-b-[6px] transition-all duration-300 relative overflow-hidden group cursor-pointer active:translate-y-0 ${
                            isReady
                                ? 'bg-brand-primary border-yellow-600 text-black hover:bg-yellow-400 shadow-[0_8px_30px_rgba(250,204,21,0.4)]'
                                : 'bg-bg-surface border-brand-primary/50 text-white hover:bg-bg-surface-elevated hover:border-brand-primary/80 shadow-[0_5px_20px_rgba(250,204,21,0.15)] hover:shadow-[0_8px_30px_rgba(250,204,21,0.25)]'
                        }`}
                    >
                        {isReady ? (
                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
                        ) : (
                            <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/0 via-brand-primary/5 to-brand-primary/0 opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
                        )}
                        
                        <div className={`shrink-0 w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center relative z-10 border-2 shadow-inner transition-colors ${
                            isReady 
                                ? 'bg-black/10 border-black/20 text-black group-hover:bg-black/20' 
                                : 'bg-brand-primary/10 border-brand-primary/30 text-brand-primary group-hover:bg-brand-primary/20 group-hover:border-brand-primary/50'
                        }`}>
                            <TrendingUp className="w-6 h-6 md:w-8 md:h-8" />
                        </div>
                        
                        <div className="flex flex-col items-start relative z-10 text-left flex-1 min-w-0">
                            {isReady ? (
                                <>
                                    <span className="text-xl md:text-2xl drop-shadow-sm truncate w-full">Chapter Mastery Arena</span>
                                    <span className="text-[10px] md:text-xs font-black text-black/70 tracking-widest uppercase mt-1 leading-snug">{averageTopicMastery}% Topic Mastery Achieved — Ready to earn Chapter XP.</span>
                                </>
                            ) : (
                                <>
                                    <span className="text-xl md:text-2xl text-white drop-shadow-md truncate w-full">Chapter Mastery Arena</span>
                                    <span className="text-[10px] md:text-xs font-black text-brand-primary tracking-widest uppercase mt-1 flex items-center gap-1.5 flex-wrap leading-snug">
                                        <AlertTriangle className="w-3 h-3 md:w-4 md:h-4 shrink-0 animate-pulse" /> <span>{averageTopicMastery}% Average Topic Mastery — 70%+ recommended to maximize your XP.</span>
                                    </span>
                                </>
                            )}
                        </div>
                        
                        <div className="hidden md:flex shrink-0 relative z-10">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                                isReady ? 'bg-black/10 border-black/20' : 'bg-brand-primary/10 border-brand-primary/30'
                            }`}>
                                <Play className={`w-4 h-4 ml-0.5 ${isReady ? 'fill-black text-black' : 'fill-brand-primary text-brand-primary'}`} />
                            </div>
                        </div>
                    </button>
                </div>

                {fetchError && (
                    <div className="py-6 px-8 mb-8 text-center bg-gray-800/30 rounded-2xl border border-gray-800 border-dashed transition-all duration-300">
                        <AlertOctagon className="w-8 h-8 text-semantic-error mb-3 mx-auto" />
                        <p className="text-red-400 font-bold">{fetchError}</p>
                    </div>
                )}

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                        <Loader2 className="animate-spin w-10 h-10 text-brand-primary mb-4" />
                        <p className="font-medium">Syncing databanks...</p>
                    </div>
                ) : (
                    <>
                        {/* Resources feature temporarily removed */}
                    </>
                )}
            </div>

            {/* Friction Modal for Low Mastery */}
            {isFrictionModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm fade-enter-active">
                    <div className="bg-bg-surface border-2 border-border-subtle/50 rounded-3xl p-6 md:p-8 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-semantic-error/10 text-semantic-error rounded-full flex items-center justify-center mb-6 border-2 border-semantic-error/30 shadow-inner">
                            <AlertTriangle className="w-8 h-8" />
                        </div>
                        <h3 className="text-2xl font-black text-white mb-3 tracking-tight">Are you sure you're ready?</h3>
                        <p className="text-text-secondary font-bold mb-8 leading-relaxed">
                            You haven't mastered the Warm-Up concepts yet. This Adaptive Quiz impacts your XP and Rank.
                        </p>
                        <div className="flex flex-col gap-3 w-full">
                            <Button 
                                variant="primary"
                                onClick={() => setIsFrictionModalOpen(false)}
                                className="w-full"
                            >
                                Take me back to Warm-Ups
                            </Button>
                            <Button 
                                variant="secondary"
                                onClick={() => {
                                    setIsFrictionModalOpen(false);
                                    onStartQuiz(null);
                                }}
                                className="w-full"
                            >
                                I know this, start the Quiz
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

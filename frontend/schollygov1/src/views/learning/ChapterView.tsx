import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    ArrowLeft, Bell, Medal, Lock, ChevronRight, RotateCcw, Info, Loader2, AlertOctagon,
    Award, Shield, Swords, Star, LockOpen, Sparkles, FolderOpen, Map as MapIcon,
    Calculator, FlaskConical, Globe, Book, BookOpen, ChevronDown, Stars
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '../../stores/appStore';
import { useAuthStore } from '../../stores/auth';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

interface Chapter {
    id: string | number;
    module: string;
    module_translations?: any;
    title: string;
    title_translations?: any;
    status: 'proficient' | 'practicing' | 'untested';
    accuracy: number;
    easy_accuracy?: number;
    medium_accuracy?: number;
    hard_accuracy?: number;
    attempts: number;
    total_time_seconds?: number;
    description?: string;
}

interface Unit {
    id?: string | number;
    title: string;
    hindiTitle?: string;
    chapters: Chapter[];
}

interface Subject {
    id: string | number;
    name: string;
    name_translations?: any;
    icon: string;
    progress?: number;
}

interface ChapterViewProps {
    apiBase?: string;
    onLogout: () => void;
    onNavigate: (route: string) => void;
    onViewChapter?: (chapter: Chapter) => void;
}

const getDefaultIcon = (name: string) => {
    const n = (name || '').toLowerCase();
    if (n.includes('math')) return 'calculator';
    if (n.includes('sci')) return 'flask';
    if (n.includes('eng')) return 'book-open';
    if (n.includes('social') || n.includes('sst') || n.includes('history')) return 'globe';
    return 'book';
};

const renderIcon = (iconName: string, className = "w-6 h-6") => {
    switch (iconName) {
        case 'calculator': return <Calculator className={className} />;
        case 'flask': return <FlaskConical className={className} />;
        case 'globe': return <Globe className={className} />;
        case 'book-open': return <BookOpen className={className} />;
        default: return <Book className={className} />;
    }
};

export default function ChapterView({
    apiBase = import.meta.env.VITE_API_URL || '',
    onLogout,
    onNavigate,
    onViewChapter
}: ChapterViewProps) {
    const { chaptersCache, setChaptersCache, selectedSubject } = useAppStore();
    const [activeSubjectId, setActiveSubjectId] = useState<string | number | null>(null);
    const [activeModule, setActiveModule] = useState<string | 'all'>('all');
    const [isModuleDropdownOpen, setIsModuleDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsModuleDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [dropdownRef]);

    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [subjects, setSubjects] = useState<Subject[]>([]);

    const loadingSubjects = useRef(new Set<string | number>());
    const chaptersRecord = chaptersCache;

    const { user } = useAuthStore();

    const getAuthHeaders = () => {
        const token = localStorage.getItem('access_token') || localStorage.getItem('token') || sessionStorage.getItem('access_token') || sessionStorage.getItem('token') || '';
        return {
            'Authorization': `Bearer ${token}`
        };
    };

    const resolveActiveSubject = (queryStr: string | number, currentSubjects: Subject[]) => {
        if (!currentSubjects.length) return;

        const query = String(queryStr).toLowerCase();

        const exactIdMatch = currentSubjects.find(s => String(s.id) === query);
        if (exactIdMatch) {
            setActiveSubjectId(exactIdMatch.id);
            return;
        }

        const matched = currentSubjects.find(s => {
            const name = s.name.toLowerCase();
            if ((query === 'sst' || query === 'social') && name.includes('social')) return true;
            if (query === 'sci' && name.includes('science')) return true;
            if (query === 'math' && name.includes('math')) return true;
            return name.includes(query);
        });

        setActiveSubjectId(matched ? matched.id : currentSubjects[0]?.id || null);
    };

    const loadSubjects = async () => {
        try {
            const curriculumCode = user?.curriculum_code;
            const grade = user?.grade;

            if (!curriculumCode) {
                setFetchError('Curriculum is missing in your profile. Please update it.');
                setIsLoading(false);
                return;
            }

            const res = await fetch(`${apiBase}/curriculum/subjects?curriculum_code=${encodeURIComponent(curriculumCode)}`, {
                headers: getAuthHeaders()
            });

            if (res.status === 401) {
                console.warn('Session expired or unauthorized.');
                onLogout();
                return;
            }

            if (!res.ok) throw new Error('Failed to load subjects');

            const data = await res.json();

            const parsedSubjects = data.map((s: any) => {
                const trans = typeof s.name_translations === 'string' ? JSON.parse(s.name_translations) : (s.name_translations || {});
                return {
                    id: s.subject_id || s.id,
                    name: s.name || trans.en || 'Subject',
                    name_translations: trans,
                    icon: s.icon || s.icon_class || getDefaultIcon(s.name || trans.en || 'Subject'),
                    progress: Number(s.progress) || 0,
                    curriculum_medium: s.curriculum_medium,
                };
            });

            setSubjects(parsedSubjects);
            if (parsedSubjects.length === 0) {
                setIsLoading(false);
            } else {
                resolveActiveSubject(selectedSubject, parsedSubjects);
            }

        } catch (err: any) {
            console.error("Failed to fetch subjects:", err);
            setFetchError("Our servers are currently resting. Please try again later. 😊");
        }
    };

    useEffect(() => {
        loadSubjects();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (subjects.length > 0) {
            resolveActiveSubject(selectedSubject, subjects);
        }
    }, [selectedSubject, subjects]);

    const loadChapters = async (subjectId: string | number) => {
        if (!subjectId || subjectId === 'undefined') return;
        if (chaptersRecord[subjectId] || loadingSubjects.current.has(subjectId)) {
            setIsLoading(false);
            return;
        }

        loadingSubjects.current.add(subjectId);
        setIsLoading(true);

        try {
            const headers = getAuthHeaders();

            const chRes = await fetch(`${apiBase}/curriculum/subjects/${subjectId}/chapters`, { headers });
            if (!chRes.ok) throw new Error('Failed to load chapters');
            const chaptersData = await chRes.json();

            const formattedChapters: Chapter[] = chaptersData.map((ch: any) => {
                const parseSafe = (val: any) => {
                    if (!val) return {};
                    if (typeof val === 'string') {
                        try { return JSON.parse(val); }
                        catch (e) { return { en: val }; }
                    }
                    return val;
                };
                const modTrans = parseSafe(ch.module_translations);
                const titleTrans = parseSafe(ch.title_translations);
                return {
                    id: ch.id,
                    module: ch.module_name || modTrans.en || 'General',
                    module_translations: modTrans,
                    title: ch.title || titleTrans.en || 'Chapter',
                    title_translations: titleTrans,
                    description: ch.description,
                    status: ch.status || 'untested',
                    accuracy: ch.accuracy || 0,
                    easy_accuracy: ch.easy_accuracy || 0,
                    medium_accuracy: ch.medium_accuracy || 0,
                    hard_accuracy: ch.hard_accuracy || 0,
                    attempts: ch.attempts || 0
                };
            });

            setChaptersCache(subjectId.toString(), formattedChapters);
        } catch (err: any) {
            console.error("Failed to fetch chapters:", err);
            setFetchError("Unable to fetch chapters at this moment. Please try again. 😊");
        } finally {
            loadingSubjects.current.delete(subjectId);
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (activeSubjectId !== null) {
            setActiveModule('all');
            loadChapters(activeSubjectId);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeSubjectId]);

    const currentSubjectDetails = useMemo(() => {
        return subjects.find(s => s.id === activeSubjectId) || subjects[0];
    }, [subjects, activeSubjectId]);

    const secondaryLangCode = useMemo(() => {
        if (!currentSubjectDetails || currentSubjectDetails.curriculum_medium?.toLowerCase() === 'english') return null;
        const med = currentSubjectDetails.curriculum_medium?.toLowerCase();
        return med === 'hindi' ? 'hi' : (med?.substring(0, 2) || 'hi');
    }, [currentSubjectDetails]);

    const flatChapters = useMemo(() => {
        if (!activeSubjectId) return [];
        return chaptersRecord[activeSubjectId] || [];
    }, [chaptersRecord, activeSubjectId]);

    const availableModules = useMemo(() => {
        const modulesMap = new Map<string, string>(); // module -> moduleHi mapping
        flatChapters.forEach(ch => {
            if (ch.module) {
                const secondaryText = secondaryLangCode && ch.module_translations ? (ch.module_translations[secondaryLangCode] || ch.module_translations.hi) : '';
                modulesMap.set(ch.module, secondaryText || '');
            }
        });
        return Array.from(modulesMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    }, [flatChapters, secondaryLangCode]);

    const filteredChapters = useMemo(() => {
        if (activeModule === 'all') return flatChapters;
        return flatChapters.filter(ch => ch.module === activeModule);
    }, [flatChapters, activeModule]);

    return (
        <div className="flex flex-col w-full min-h-full font-sans text-white relative z-10 bg-bg-app">

            {/* Mobile Header */}
            <header className="md:hidden flex items-center justify-between p-4 sticky top-0 bg-deep-space/90 backdrop-blur-md z-30 border-b border-white/5">
                <div className="flex items-center gap-3">
                    <button onClick={() => onNavigate('dashboard')} className="text-text-secondary hover:text-white transition-colors p-1 -ml-1 cursor-pointer active:scale-95">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-bg-surface rounded-lg flex items-center justify-center border border-brand-primary/30 text-brand-primary">
                            {currentSubjectDetails && renderIcon(currentSubjectDetails.icon, "w-4 h-4")}
                        </div>
                        {currentSubjectDetails && <span className="font-black text-lg text-white">{currentSubjectDetails.name}</span>}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {/* Bell icon removed */}
                </div>
            </header>

            <div className="p-4 md:p-8 max-w-5xl mx-auto w-full flex-1">
                {/* Back Button outside Hero - Removed because nav bar already has back button */}

                {/* Subject Hero Section */}
                {currentSubjectDetails && (
                    <Card variant="gamified" className="mb-6 p-4 sm:p-6 md:p-8 flex flex-col relative overflow-hidden group">
                        <div className="relative z-10 w-full flex flex-col gap-5 md:gap-8">
                            <div className="flex items-center gap-3 sm:gap-5 w-full">
                                <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 shrink-0 rounded-[1rem] md:rounded-[1.25rem] bg-brand-primary/5 flex items-center justify-center border border-brand-primary/20 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] relative overflow-hidden transition-colors">
                                    <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/10 to-transparent opacity-50"></div>
                                    <div className="text-brand-primary relative z-10">
                                        {renderIcon(currentSubjectDetails.icon, "w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10")}
                                    </div>
                                </div>
                                <div className="min-w-0 flex-1">
                                    {user?.curriculum_code && (
                                        <div className="flex items-center gap-2 mb-1 sm:mb-2">
                                            <Badge variant="outline" className="text-[10px] uppercase tracking-widest shadow-inner border-yellow-600/30">
                                                {user.curriculum_code.split('_').join(' - ')}
                                            </Badge>
                                        </div>
                                    )}
                                    <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-orange-300 tracking-tight leading-tight truncate whitespace-normal drop-shadow-sm">{currentSubjectDetails.name}</h2>
                                    {currentSubjectDetails.curriculum_medium?.toLowerCase() !== 'english' && (
                                        <span className="block text-text-secondary text-sm sm:text-base font-bold mt-1">
                                            {currentSubjectDetails.name_translations?.[currentSubjectDetails.curriculum_medium?.toLowerCase() === 'hindi' ? 'hi' : currentSubjectDetails.curriculum_medium?.toLowerCase().substring(0, 2) || 'hi'] || currentSubjectDetails.name_translations?.hi}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 md:flex md:flex-row gap-2 sm:gap-3 md:gap-4 w-full">
                                <div className="bg-black/20 backdrop-blur-sm border border-white/5 rounded-xl px-2 py-3 md:px-5 md:py-4 flex-1 min-w-0 text-center">
                                    <div className="text-white font-black text-xl sm:text-2xl md:text-3xl leading-none mb-1.5">{availableModules.length}</div>
                                    <div className="text-[10px] sm:text-xs font-semibold tracking-wider text-text-secondary uppercase">Total Modules</div>
                                </div>
                                <div className="bg-black/20 backdrop-blur-sm border border-white/5 rounded-xl px-2 py-3 md:px-5 md:py-4 flex-1 min-w-0 text-center relative overflow-hidden group/accuracy">
                                <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-brand-primary/20 to-orange-500/20 border-r-2 border-orange-500/50 transition-all duration-1000" style={{ width: `${Math.round(currentSubjectDetails?.progress || 0)}%` }}></div>
                                    <div className="text-brand-primary font-black text-xl sm:text-2xl md:text-3xl leading-none mb-1.5 relative z-10">{Math.round(currentSubjectDetails?.progress || 0)}%</div>
                                    <div className="text-[10px] sm:text-xs font-semibold tracking-wider text-text-secondary uppercase relative z-10">Subject Mastery</div>
                                </div>
                                <div className="col-span-2 md:col-span-1 bg-black/20 backdrop-blur-sm border border-white/5 rounded-xl px-2 py-3 md:px-5 md:py-4 flex-1 min-w-0 text-center">
                                    <div className="text-white font-black text-xl sm:text-2xl md:text-3xl leading-none mb-1.5">{user?.xp || 0}</div>
                                    <div className="text-[10px] sm:text-xs font-semibold tracking-wider text-text-secondary uppercase">Total XP Earned</div>
                                </div>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Loading State */}
                {fetchError ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-gray-800/30 rounded-3xl border border-gray-800 border-dashed text-gray-500">
                        <AlertOctagon className="w-12 h-12 text-semantic-error mb-4" />
                        <p className="font-bold text-red-400">{fetchError}</p>
                    </div>
                ) : isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                        <Loader2 className="animate-spin w-10 h-10 text-brand-primary mb-4" />
                        <p className="font-medium">Loading syllabus from backend...</p>
                    </div>
                ) : (
                    <>
                        {/* Module Filters Dropdown */}
                        {availableModules.length > 0 && (
                            <div className="mb-10 relative z-[100] isolate mt-2" ref={dropdownRef}>
                                <button
                                    onClick={() => setIsModuleDropdownOpen(!isModuleDropdownOpen)}
                                    className="w-full md:w-[320px] min-h-[44px] flex justify-between items-center bg-bg-surface border-2 border-border-subtle/50 text-white px-5 py-3 md:py-2 rounded-xl hover:border-brand-primary/50 hover:bg-bg-surface transition-all focus:outline-none shadow-inner"
                                >
                                    <div className="flex flex-col items-start leading-tight pr-4 text-left overflow-hidden">
                                        <span className="font-bold text-xs text-text-secondary uppercase tracking-widest">
                                            {activeModule === 'all' ? 'All Modules' : 'Selected Module'}
                                        </span>
                                        <span className="text-sm font-black truncate w-full mt-1 text-brand-primary">
                                            {activeModule === 'all' ? 'Showing Entire Curriculum' : activeModule}
                                        </span>
                                    </div>
                                    <div className={`w-8 h-8 rounded-full bg-bg-surface-elevated flex items-center justify-center transition-transform duration-300 ${isModuleDropdownOpen ? 'rotate-180 bg-brand-primary/20' : ''}`}>
                                        <ChevronDown className={`w-4 h-4 ${isModuleDropdownOpen ? 'text-brand-primary' : 'text-text-secondary'}`} />
                                    </div>
                                </button>

                                <AnimatePresence>
                                    {isModuleDropdownOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10, scale: 0.98 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: -10, scale: 0.98 }}
                                            transition={{ duration: 0.15, ease: 'easeOut' }}
                                            className="absolute top-full left-0 mt-3 w-full md:w-[380px] bg-bg-surface border-2 border-border-subtle/50 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden z-[100]"
                                        >
                                            <div className="max-h-80 overflow-y-auto overscroll-contain scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent py-2">
                                                <button
                                                    onClick={() => {
                                                        setActiveModule('all');
                                                        setIsModuleDropdownOpen(false);
                                                    }}
                                                    className={`w-full text-left px-5 py-3 transition-colors ${activeModule === 'all'
                                                            ? 'bg-brand-primary/10 border-l-4 border-brand-primary'
                                                            : 'hover:bg-bg-surface-elevated/50 border-l-4 border-transparent'
                                                        }`}
                                                >
                                                    <span className={`font-black text-sm block ${activeModule === 'all' ? 'text-brand-primary' : 'text-text-primary'}`}>All Modules</span>
                                                    <span className="text-[10px] text-text-secondary font-bold uppercase tracking-widest block mt-0.5">Show all chapters</span>
                                                </button>
                                                {availableModules.map(([mod, modHi]) => (
                                                    <button
                                                        key={mod}
                                                        onClick={() => {
                                                            setActiveModule(mod);
                                                            setIsModuleDropdownOpen(false);
                                                        }}
                                                        className={`w-full text-left px-5 py-3 transition-colors group ${activeModule === mod
                                                                ? 'bg-brand-primary/10 border-l-4 border-brand-primary'
                                                                : 'hover:bg-gray-800/50 border-l-4 border-transparent'
                                                            }`}
                                                    >
                                                        <span className={`font-bold text-sm block leading-snug group-hover:text-white transition-colors ${activeModule === mod ? 'text-brand-primary' : 'text-gray-300'}`}>{mod}</span>
                                                        {modHi && <span className={`text-[11px] font-medium block mt-0.5 ${activeModule === mod ? 'text-brand-primary/70' : 'text-gray-500'}`}>{modHi}</span>}
                                                    </button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}

                        {/* Chapters Level */}
                        <Card variant="default" className="mb-10 p-6 md:p-8 flex flex-col relative overflow-hidden group">
                            <div className="mb-6">
                                <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-2 mb-1"><MapIcon className="w-6 h-6 text-brand-primary" /> Curriculum Chapters</h3>
                                <p className="text-sm text-text-secondary font-bold">Select a chapter to view its concepts and begin practicing.</p>
                            </div>
                            {filteredChapters.length > 0 ? (
                                <div className="space-y-4 relative z-10">
                                    {filteredChapters.map((chapter, cIndex) => (
                                        <Card
                                            variant="interactive"
                                            key={chapter.id}
                                            onClick={() => {
                                                if (onViewChapter) {
                                                    onViewChapter({ ...chapter, curriculum_medium: currentSubjectDetails?.curriculum_medium });
                                                }
                                            }}
                                            className="w-full flex flex-col gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-app"
                                        >
                                            <div className="flex flex-row items-start justify-between w-full gap-2">
                                                <div className="flex-1 min-w-0 pr-2 sm:pr-4">
                                                    <div className="flex items-start sm:items-center gap-2 sm:gap-3 mb-1">
                                                        <div className={`shrink-0 w-6 h-6 sm:w-8 sm:h-8 mt-0.5 sm:mt-0 rounded-md sm:rounded-lg font-black flex items-center justify-center text-xs sm:text-sm border shadow-inner ${chapter.status === 'proficient'
                                                                ? 'bg-semantic-success/10 text-semantic-success border-semantic-success/30'
                                                                : 'bg-brand-primary/10 text-brand-primary border-brand-primary/30'
                                                            }`}>
                                                            {flatChapters.findIndex(c => c.id === chapter.id) + 1}
                                                        </div>
                                                        <h4 className="font-black text-base sm:text-lg text-white group-hover:text-brand-primary transition-colors leading-tight break-words">
                                                            {chapter.title}
                                                        </h4>
                                                        {chapter.status === 'proficient' && <Medal className="w-4 h-4 sm:w-5 sm:h-5 text-semantic-success fill-semantic-success shrink-0 mt-0.5 sm:mt-0" />}
                                                    </div>
                                                    {secondaryLangCode && chapter.title_translations && (chapter.title_translations[secondaryLangCode] || chapter.title_translations.hi) && (
                                                        <span className="text-xs sm:text-sm font-bold text-text-secondary mt-0.5 block pl-8 sm:pl-11">
                                                            {chapter.title_translations[secondaryLangCode] || chapter.title_translations.hi}
                                                        </span>
                                                    )}
                                                    {chapter.description && (
                                                        <p className="hidden sm:block text-xs text-gray-400 mt-1.5 leading-snug line-clamp-2 pl-11">
                                                            {chapter.description}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-bg-surface border-2 border-brand-primary text-brand-primary rounded-lg sm:rounded-xl group-hover:bg-brand-primary group-hover:text-black transition-colors flex items-center justify-center mt-0.5 sm:mt-0">
                                                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 ml-0.5" />
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 pt-3 border-t border-white/5">
                                                {(() => {
                                                    const acc = chapter.accuracy || 0;
                                                    let variant: 'active' | 'info' | 'default' = 'default';
                                                    let struggleMessage = "Not Started";
                                                    
                                                    if (chapter.status === 'proficient' || acc >= 70) {
                                                        variant = 'active';
                                                        struggleMessage = "Mastered";
                                                    } else if (chapter.attempts && chapter.attempts > 0 && acc < 70) {
                                                        variant = 'info';
                                                        struggleMessage = "Keep Improving";
                                                    }
                                                    
                                                    return (
                                                        <Badge variant={variant as any} className="!text-[10px]">
                                                            {struggleMessage}
                                                        </Badge>
                                                    );
                                                })()}
                                                <div className="flex items-center gap-3 text-xs font-semibold text-text-secondary uppercase tracking-wider ml-auto">
                                                    <span>Mastery: {chapter.status === 'calibrating' ? (
                                                        <span className="text-brand-primary animate-pulse">Calibrating</span>
                                                    ) : (
                                                        <span className={
                                                            (chapter.accuracy || 0) >= 70 ? 'text-semantic-success' :
                                                                (chapter.accuracy || 0) >= 40 ? 'text-brand-primary' :
                                                                    ((chapter.accuracy || 0) === 0 && (chapter.attempts || 0) === 0) ? 'text-text-secondary' :
                                                                        'text-semantic-error'
                                                        }>{Math.round(chapter.accuracy || 0)}%</span>
                                                    )}</span>
                                                    <span>•</span>
                                                    <span>Attempts: {chapter.attempts || 0}</span>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-20 flex flex-col items-center justify-center text-center bg-bg-surface rounded-[3rem] border-2 border-border-subtle/50 border-dashed relative overflow-hidden shadow-[inset_0_0_50px_rgba(0,0,0,0.5)]">
                                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800/30 via-transparent to-transparent pointer-events-none"></div>
                                    <div className="w-28 h-28 mb-8 relative">
                                        <div className="absolute inset-0 bg-brand-primary/20 rounded-full blur-3xl animate-pulse"></div>
                                        <div className="w-full h-full bg-bg-surface border-[4px] border-border-subtle/80 rounded-[2rem] flex items-center justify-center shadow-2xl -rotate-6 hover:rotate-6 hover:scale-110 transition-transform duration-500 relative z-10 group cursor-default">
                                            <Stars className="w-12 h-12 text-brand-primary group-hover:scale-125 transition-transform duration-500 delay-100" />
                                        </div>
                                    </div>
                                    <h3 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 mb-4 tracking-tight">Curriculum <span className="text-brand-primary">Coming Soon!</span> 🚀</h3>
                                    <p className="text-text-secondary font-bold max-w-lg text-sm md:text-base leading-relaxed px-6 uppercase tracking-wider">
                                        Our master scholars are currently forging the ultimate learning experience for this subject.
                                    </p>
                                </div>
                            )}
                        </Card>
                    </>
                )}
            </div>
        </div>
    );
}

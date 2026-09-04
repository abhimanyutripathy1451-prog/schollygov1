import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
    ArrowLeft, Bell, Medal, Lock, ChevronRight, RotateCcw, Info, Loader2, Coins, AlertOctagon,
    Calculator, FlaskConical, Globe, Book, BookOpen, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Chapter {
    id: string | number;
    module: string;
    moduleHi?: string;
    title: string;
    hindiTitle?: string;
    status: 'proficient' | 'practicing' | 'untested';
    accuracy: number;
    easy_accuracy?: number;
    medium_accuracy?: number;
    hard_accuracy?: number;
    attempts: number;
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
    hindiName?: string;
    icon: string;
}

interface ChapterViewProps {
    userSession?: any;
    coins?: number;
    initialSubject?: string | number;
    apiBase?: string;
    chaptersCache?: Record<string, any[]>;
    setChaptersCache?: (cache: React.SetStateAction<Record<string, any[]>>) => void;
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
    userSession = {}, 
    coins = 0, 
    initialSubject = 'math', 
    apiBase = import.meta.env.VITE_API_URL || '',
    chaptersCache,
    setChaptersCache,
    onLogout,
    onNavigate,
    onViewChapter
}: ChapterViewProps) {
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
    
    const [localChaptersRecord, setLocalChaptersRecord] = useState<Record<string | number, Unit[]>>({});
    const chaptersRecord = chaptersCache || localChaptersRecord;
    const updateChaptersRecord = setChaptersCache || setLocalChaptersRecord;
    
    const loadingSubjects = useRef(new Set<string | number>());

    const getAuthHeaders = () => {
        const token = userSession?.token || localStorage.getItem('access_token') || '';
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
            const board = userSession?.board;
            const grade = userSession?.grade;

            if (!board || !grade) {
                setFetchError('Board or Grade is missing in your profile. Please update it.');
                setIsLoading(false);
                return;
            }

            const res = await fetch(`${apiBase}/curriculum/subjects?board=${encodeURIComponent(board)}&grade=${encodeURIComponent(grade)}`, {
                headers: getAuthHeaders()
            });

            if (res.status === 401) {
                console.warn('Session expired or unauthorized.');
                onLogout();
                return;
            }

            if (!res.ok) throw new Error('Failed to load subjects');

            const data = await res.json();

            const parsedSubjects = data.map((s: any) => ({
                id: s.subject_id || s.id,
                name: s.name || s.title,
                hindiName: s.name_hi || '',
                icon: s.icon || s.icon_class || getDefaultIcon(s.name || s.title)
            }));
            
            setSubjects(parsedSubjects);
            if (parsedSubjects.length === 0) {
                setIsLoading(false);
            } else {
                resolveActiveSubject(initialSubject, parsedSubjects);
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
            resolveActiveSubject(initialSubject, subjects);
        }
    }, [initialSubject, subjects]);

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
            
            const formattedChapters: Chapter[] = chaptersData.map((ch: any) => ({
                id: ch.id,
                module: ch.module || 'General',
                moduleHi: ch.module_hi || '',
                title: ch.title || ch.name,
                hindiTitle: ch.title_hi || '',
                status: ch.status || 'untested',
                accuracy: ch.accuracy || 0,
                easy_accuracy: ch.easy_accuracy || 0,
                medium_accuracy: ch.medium_accuracy || 0,
                hard_accuracy: ch.hard_accuracy || 0,
                attempts: ch.attempts || 0
            }));

            updateChaptersRecord(prev => ({ ...prev, [subjectId]: formattedChapters }));
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
            loadChapters(activeSubjectId);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeSubjectId]);

    const currentSubjectDetails = useMemo(() => {
        return subjects.find(s => s.id === activeSubjectId) || subjects[0];
    }, [subjects, activeSubjectId]);

    const flatChapters = useMemo(() => {
        if (!activeSubjectId) return [];
        return chaptersRecord[activeSubjectId] || [];
    }, [chaptersRecord, activeSubjectId]);

    const availableModules = useMemo(() => {
        const modulesMap = new Map<string, string>(); // module -> moduleHi mapping
        flatChapters.forEach(ch => {
            if (ch.module) modulesMap.set(ch.module, ch.moduleHi || '');
        });
        return Array.from(modulesMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    }, [flatChapters]);

    const filteredChapters = useMemo(() => {
        if (activeModule === 'all') return flatChapters;
        return flatChapters.filter(ch => ch.module === activeModule);
    }, [flatChapters, activeModule]);

    return (
        <div className="flex flex-col w-full min-h-full font-sans text-off-white relative z-10 bg-deep-space">

            {/* Mobile Header */}
            <header className="md:hidden flex items-center justify-between p-4 sticky top-0 bg-deep-space/90 backdrop-blur-md z-30 border-b border-white/5">
                <div className="flex items-center gap-3">
                    <button onClick={() => onNavigate('dashboard')} className="text-gray-400 hover:text-white transition-colors p-1 -ml-1 cursor-pointer active:scale-95">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-graphite rounded-lg flex items-center justify-center border border-voltage-yellow/30 text-voltage-yellow">
                            {currentSubjectDetails && renderIcon(currentSubjectDetails.icon, "w-4 h-4")}
                        </div>
                        {currentSubjectDetails && <span className="font-bold text-lg text-white">{currentSubjectDetails.name}</span>}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative cursor-pointer active:scale-95">
                        <Bell className="w-6 h-6 text-gray-400" />
                        <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-error-red rounded-full border-2 border-deep-space"></span>
                    </div>
                </div>
            </header>

            <div className="p-4 md:p-8 max-w-5xl mx-auto w-full flex-1">
                {/* Back Button outside Hero */}
                {currentSubjectDetails && (
                    <button onClick={() => onNavigate('dashboard')} className="flex items-center gap-2 text-gray-400 hover:text-voltage-yellow text-sm font-medium uppercase tracking-wider mb-6 transition-colors cursor-pointer active:scale-95 group">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Basecamp
                    </button>
                )}

                {/* Subject Hero Section */}
                {currentSubjectDetails && (
                    <div className="bg-graphite border border-white/5 rounded-3xl p-6 md:p-8 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-2xl shadow-black/40">
                        <div className="absolute -right-20 -top-20 w-64 h-64 bg-voltage-yellow/5 rounded-full blur-3xl pointer-events-none"></div>
                        <div className="relative z-10 w-full flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div className="flex items-center gap-5">
                                <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-deep-space flex items-center justify-center border border-white/5 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] relative overflow-hidden group-hover:border-voltage-yellow/30 transition-colors">
                                    <div className="absolute inset-0 bg-gradient-to-br from-voltage-yellow/10 to-transparent opacity-50"></div>
                                    <div className="text-voltage-yellow relative z-10">
                                        {renderIcon(currentSubjectDetails.icon, "w-8 h-8 md:w-10 md:h-10")}
                                    </div>
                                </div>
                                <div>
                                    <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-1">{currentSubjectDetails.name}</h2>
                                    {currentSubjectDetails.hindiName && <span className="block text-gray-400 font-semibold">{currentSubjectDetails.hindiName}</span>}
                                </div>
                            </div>

                            <div className="flex gap-3 md:gap-4 w-full md:w-auto mt-2 md:mt-0">
                                <div className="bg-deep-space/80 backdrop-blur-sm border border-gray-800 rounded-2xl px-5 py-4 flex-1 md:flex-none text-center min-w-[130px] shadow-inner">
                                    <div className="text-white font-black text-2xl md:text-3xl leading-none mb-1.5">{availableModules.length}</div>
                                    <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Total Modules</div>
                                </div>
                                <div className="bg-deep-space/80 backdrop-blur-sm border border-gray-800 rounded-2xl px-5 py-4 flex-1 md:flex-none text-center min-w-[130px] shadow-inner">
                                    <div className="text-white font-black text-2xl md:text-3xl leading-none mb-1.5">{flatChapters.length}</div>
                                    <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Total Chapters</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Loading State */}
                {fetchError ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-gray-800/30 rounded-3xl border border-gray-800 border-dashed text-gray-500">
                        <AlertOctagon className="w-12 h-12 text-error-red mb-4" />
                        <p className="font-bold text-red-400">{fetchError}</p>
                    </div>
                ) : isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                        <Loader2 className="animate-spin w-10 h-10 text-voltage-yellow mb-4" />
                        <p className="font-medium">Loading syllabus from backend...</p>
                    </div>
                ) : (
                    <>
                        {/* Module Filters Dropdown */}
                        {availableModules.length > 0 && (
                            <div className="mb-10 relative z-[100] isolate mt-2" ref={dropdownRef}>
                                <button
                                    onClick={() => setIsModuleDropdownOpen(!isModuleDropdownOpen)}
                                    className="w-full md:w-[320px] flex justify-between items-center bg-gray-900 border border-white/10 text-white px-5 py-4 rounded-2xl hover:border-voltage-yellow/50 hover:bg-gray-800 transition-all focus:outline-none shadow-md hover:shadow-lg"
                                >
                                    <div className="flex flex-col items-start leading-tight pr-4 text-left overflow-hidden">
                                        <span className="font-bold text-sm text-gray-200">
                                            {activeModule === 'all' ? 'All Modules' : 'Selected Module'}
                                        </span>
                                        <span className="text-sm font-semibold truncate w-full mt-1 text-voltage-yellow">
                                            {activeModule === 'all' ? 'Showing Entire Curriculum' : activeModule}
                                        </span>
                                    </div>
                                    <div className={`w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center transition-transform duration-300 ${isModuleDropdownOpen ? 'rotate-180 bg-voltage-yellow/20' : ''}`}>
                                        <ChevronDown className={`w-4 h-4 ${isModuleDropdownOpen ? 'text-voltage-yellow' : 'text-gray-400'}`} />
                                    </div>
                                </button>
                                
                                <AnimatePresence>
                                    {isModuleDropdownOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10, scale: 0.98 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: -10, scale: 0.98 }}
                                            transition={{ duration: 0.15, ease: 'easeOut' }}
                                            className="absolute top-full left-0 mt-3 w-full md:w-[380px] bg-gray-900 border border-white/10 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden z-[100]"
                                        >
                                            <div className="max-h-80 overflow-y-auto overscroll-contain scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent py-2">
                                                <button
                                                    onClick={() => {
                                                        setActiveModule('all');
                                                        setIsModuleDropdownOpen(false);
                                                    }}
                                                    className={`w-full text-left px-5 py-3 transition-colors ${
                                                        activeModule === 'all'
                                                            ? 'bg-voltage-yellow/10 border-l-4 border-voltage-yellow'
                                                            : 'hover:bg-gray-800/50 border-l-4 border-transparent'
                                                    }`}
                                                >
                                                    <span className={`font-bold text-sm block ${activeModule === 'all' ? 'text-voltage-yellow' : 'text-gray-300'}`}>All Modules</span>
                                                    <span className="text-[11px] text-gray-500 font-medium block mt-0.5">Show all chapters</span>
                                                </button>
                                                {availableModules.map(([mod, modHi]) => (
                                                    <button
                                                        key={mod}
                                                        onClick={() => {
                                                            setActiveModule(mod);
                                                            setIsModuleDropdownOpen(false);
                                                        }}
                                                        className={`w-full text-left px-5 py-3 transition-colors group ${
                                                            activeModule === mod
                                                                ? 'bg-voltage-yellow/10 border-l-4 border-voltage-yellow'
                                                                : 'hover:bg-gray-800/50 border-l-4 border-transparent'
                                                        }`}
                                                    >
                                                        <span className={`font-bold text-sm block leading-snug group-hover:text-white transition-colors ${activeModule === mod ? 'text-voltage-yellow' : 'text-gray-300'}`}>{mod}</span>
                                                        {modHi && <span className={`text-[11px] font-medium block mt-0.5 ${activeModule === mod ? 'text-voltage-yellow/70' : 'text-gray-500'}`}>{modHi}</span>}
                                                    </button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}

                        {/* Chapters Level */}
                        <div className="mb-10">
                            <div className="space-y-4">
                                {filteredChapters.map((chapter, cIndex) => (
                                    <div 
                                        key={chapter.id}
                                        onClick={() => {
                                            if (onViewChapter) {
                                                onViewChapter(chapter);
                                            }
                                        }}
                                            className={`relative z-0 p-5 md:p-6 rounded-3xl border transition-all duration-300 overflow-hidden flex flex-col md:flex-row md:items-center gap-5 group ${
                                                chapter.status === 'practicing'
                                                    ? 'bg-graphite border-voltage-yellow/50 shadow-lg shadow-voltage-yellow/5 cursor-pointer active:scale-95 hover:-translate-y-1 hover:shadow-xl hover:shadow-voltage-yellow/10'
                                                    : chapter.status === 'proficient'
                                                        ? 'bg-graphite border-white/5 shadow-md shadow-black/20 cursor-pointer active:scale-95 hover:-translate-y-1 hover:shadow-lg hover:border-success-green/30'
                                                        : 'bg-graphite border-white/5 shadow-md shadow-black/20 cursor-pointer active:scale-95 hover:-translate-y-1 hover:border-white/20 hover:shadow-lg'
                                            }`}
                                        >
                                            {chapter.status === 'practicing' && <div className="absolute -right-10 -top-10 w-32 h-32 bg-voltage-yellow/10 rounded-full blur-2xl pointer-events-none"></div>}
                                            {chapter.status === 'proficient' && <div className="absolute -right-10 -top-10 w-32 h-32 bg-success-green/5 rounded-full blur-2xl pointer-events-none"></div>}

                                            <div className="flex items-center gap-4 relative z-10">
                                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shrink-0 transition-all border-2 ${
                                                    chapter.status === 'practicing'
                                                        ? 'bg-voltage-yellow text-black border-voltage-yellow shadow-[0_0_15px_rgba(255,215,0,0.4)] custom-animate-pulse-glow'
                                                        : chapter.status === 'proficient'
                                                            ? 'bg-success-green/20 text-success-green border-success-green'
                                                            : 'bg-gray-800 text-gray-400 border-gray-600'
                                                }`}>
                                                    <span>{cIndex + 1}</span>
                                                </div>
                                            </div>

                                            <div className="flex-1 w-full relative z-10">
                                                <div className="flex flex-col xl:flex-row xl:items-center justify-between w-full gap-3 xl:gap-4">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-1">
                                                            <h4 className={`text-lg md:text-xl font-bold leading-tight text-white`}>{chapter.title}</h4>
                                                            {chapter.status === 'proficient' && <Medal className="w-5 h-5 text-success-green fill-success-green shrink-0" />}
                                                        </div>
                                                        {chapter.hindiTitle && <p className={`text-sm md:text-[15px] font-medium leading-snug text-gray-400`}>{chapter.hindiTitle}</p>}
                                                    </div>

                                                    <div className="flex items-center gap-4 justify-between xl:justify-end w-full xl:w-auto mt-2 xl:mt-0">
                                                        <div className="flex items-center gap-3 bg-deep-space/40 px-3 py-2 rounded-xl border border-white/5 shadow-inner">
                                                            <div className="relative w-11 h-11 flex items-center justify-center shrink-0 drop-shadow-[0_0_8px_rgba(255,215,0,0.1)]">
                                                                <svg className="w-11 h-11 transform -rotate-90">
                                                                    <circle cx="22" cy="22" r="18" stroke="currentColor" strokeWidth="3.5" fill="transparent" className="text-deep-space stroke-gray-800/80" />
                                                                    <circle cx="22" cy="22" r="18" stroke="currentColor" strokeWidth="3.5" fill="transparent"
                                                                        strokeDasharray={2 * Math.PI * 18}
                                                                        strokeDashoffset={(2 * Math.PI * 18) - ((chapter.accuracy || 0) / 100) * (2 * Math.PI * 18)}
                                                                        className={chapter.status === 'proficient' ? 'text-success-green transition-all duration-1000' : (chapter.accuracy || 0) > 0 ? 'text-voltage-yellow transition-all duration-1000' : 'text-gray-600 transition-all duration-1000'}
                                                                        strokeLinecap="round" />
                                                                </svg>
                                                                <div className="absolute inset-0 flex items-center justify-center">
                                                                    <span className={`text-[10px] font-black ${chapter.status === 'proficient' ? 'text-success-green' : (chapter.accuracy || 0) > 0 ? 'text-voltage-yellow' : 'text-gray-500'}`}>
                                                                        {Math.round(chapter.accuracy || 0)}%
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="text-left py-0.5">
                                                                <div className="text-[10px] font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                                                                    <Medal className={`w-3 h-3 ${chapter.status === 'proficient' ? 'text-success-green' : (chapter.accuracy || 0) > 0 ? 'text-voltage-yellow' : 'text-gray-600'}`} />
                                                                    Accuracy
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className={`hidden sm:flex transition-colors pl-2 text-gray-600 group-hover:text-voltage-yellow`}>
                                                            <ChevronRight className="w-6 h-6" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                    </>
                )}
            </div>
        </div>
    );
}

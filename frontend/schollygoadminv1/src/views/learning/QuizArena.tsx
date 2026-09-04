import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
    ArrowLeft, Sword, Star, AlertCircle, ShieldCheck, Flame, Skull, 
    DownloadCloud, ClipboardList, Play, Timer, Check, X, TrendingUp, Trophy,
    RotateCcw, Home, Loader2, AlertTriangle
} from 'lucide-react';

interface QuizOption {
    text: string | null;
    image_url: string | null;
}

interface QuizQuestion {
    id: number;
    base_xp: number;
    q: string;
    question_image_url: string | null;
    options: QuizOption[];
    ans: number;
}

interface QuizArenaProps {
    chapter: any;
    userSession?: any;
    apiBase?: string;
    onBack: () => void;
    onNavigate: (route: string) => void;
    onQuizComplete: (result: any) => void;
    predefinedDifficulty?: 'easy' | 'medium' | 'hard';
    quizType?: 'practice' | 'assignment';
}

type Screen = 'setup' | 'summary' | 'quiz' | 'result';
type DifficultyLevel = 'easy' | 'medium' | 'hard';

export default function QuizArena({
    chapter,
    userSession = {},
    apiBase = import.meta.env.VITE_API_URL || '',
    onBack,
    onNavigate,
    onQuizComplete,
    predefinedDifficulty,
    quizType = 'practice'
}: QuizArenaProps) {
    const [userTotalXP, setUserTotalXP] = useState(Number(userSession?.total_xp) || 0);

    const [currentScreen, setCurrentScreen] = useState<Screen>(predefinedDifficulty ? 'summary' : 'setup');
    const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>(predefinedDifficulty || 'medium');
    const [currentMultiplier, setCurrentMultiplier] = useState<number>(2);

    const [activeQuestions, setActiveQuestions] = useState<QuizQuestion[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
    const [score, setScore] = useState<number>(0);

    const [localVisualXpEarned, setLocalVisualXpEarned] = useState<number>(0);
    const [backendVerifiedXp, setBackendVerifiedXp] = useState<number>(0);
    const [didLevelUp, setDidLevelUp] = useState<boolean>(false);
    const [newLevel, setNewLevel] = useState<number>(0);

    const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
    const timerInterval = useRef<ReturnType<typeof setInterval> | null>(null);

    const [isAnswered, setIsAnswered] = useState<boolean>(false);
    const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
    const [xpGainAnim, setXpGainAnim] = useState<boolean>(false);

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [reportIssueType, setReportIssueType] = useState('wrong_answer');
    const [reportComment, setReportComment] = useState('');
    const [isSubmittingReport, setIsSubmittingReport] = useState(false);
    const [reportSuccess, setReportSuccess] = useState(false);

    const currentQuestion = activeQuestions[currentQuestionIndex] || null;

    const quizProgress = useMemo(() => {
        if (activeQuestions.length === 0) return 0;
        if (currentScreen === 'result') return 100;
        return (currentQuestionIndex / activeQuestions.length) * 100;
    }, [activeQuestions.length, currentScreen, currentQuestionIndex]);

    const accuracy = useMemo(() => {
        if (activeQuestions.length === 0) return 0;
        return Math.round((score / activeQuestions.length) * 100);
    }, [score, activeQuestions.length]);

    const potentialXp = useMemo(() => {
        return activeQuestions.reduce((sum, q) => sum + (q.base_xp || 10), 0) * currentMultiplier;
    }, [activeQuestions, currentMultiplier]);

    const formattedTime = useMemo(() => {
        const m = Math.floor(elapsedSeconds / 60).toString().padStart(2, '0');
        const s = (elapsedSeconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    }, [elapsedSeconds]);

    const selectDifficulty = (level: DifficultyLevel, multiplier: number) => {
        setSelectedDifficulty(level);
        setCurrentMultiplier(multiplier);
    };

    const startTimer = () => {
        setElapsedSeconds(0);
        if (timerInterval.current) clearInterval(timerInterval.current);
        timerInterval.current = setInterval(() => {
            setElapsedSeconds(prev => prev + 1);
        }, 1000);
    };

    const stopTimer = () => {
        if (timerInterval.current) {
            clearInterval(timerInterval.current);
            timerInterval.current = null;
        }
    };

    useEffect(() => {
        if (predefinedDifficulty) {
            let mult = 1;
            if (predefinedDifficulty === 'easy') mult = 1;
            else if (predefinedDifficulty === 'medium') mult = 2;
            else if (predefinedDifficulty === 'hard') mult = 5;
            setCurrentMultiplier(mult);
            fetchQuizData(predefinedDifficulty);
        }
        return () => stopTimer();
    }, []);

    const fetchQuizData = async (overrideDifficulty?: DifficultyLevel) => {
        setIsLoading(true);
        setFetchError(null);

        const diffToUse = (typeof overrideDifficulty === 'string') ? overrideDifficulty : selectedDifficulty;

        try {
            const token = userSession?.token || localStorage.getItem('access_token') || '';
            const res = await fetch(`${apiBase}/quiz/chapters/${chapter.id}/questions?difficulty=${diffToUse}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) {
                const errText = await res.text();
                throw new Error(errText || 'Failed to fetch questions');
            }

            const data = await res.json();

            if (!data || data.length === 0) {
                setFetchError("No questions found for this difficulty tier in the databank.");
                setIsLoading(false);
                return;
            }

            setActiveQuestions(data.slice(0, 10));
            setCurrentQuestionIndex(0);
            setScore(0);
            setLocalVisualXpEarned(0);
            setBackendVerifiedXp(0);
            setDidLevelUp(false);
            setIsAnswered(false);
            setSelectedOptionIndex(null);

            setCurrentScreen('summary');
            setIsLoading(false);

        } catch (err: any) {
            console.error('Quiz fetch error', err);
            setFetchError(err.message || 'Unable to connect to the quiz server.');
            setIsLoading(false);
        }
    };

    const confirmStart = () => {
        startTimer();
        setCurrentScreen('quiz');
    };

    const handleAnswer = (index: number) => {
        if (isAnswered || !currentQuestion || isSubmitting) return;

        setIsAnswered(true);
        setSelectedOptionIndex(index);

        const isCorrect = index === currentQuestion.ans;

        if (isCorrect) {
            setScore(prev => prev + 1);
            setLocalVisualXpEarned(prev => prev + ((currentQuestion.base_xp || 10) * currentMultiplier));

            setXpGainAnim(true);
            setTimeout(() => setXpGainAnim(false), 300);
        }

        setTimeout(() => {
            setIsReportModalOpen(false);
            setReportSuccess(false);
            setReportComment('');
            
            if (currentQuestionIndex + 1 < activeQuestions.length) {
                setCurrentQuestionIndex(prev => prev + 1);
                setIsAnswered(false);
                setSelectedOptionIndex(null);
            } else {
                endQuiz();
            }
        }, 1500);
    };

    const endQuiz = async () => {
        setIsSubmitting(true);
        stopTimer();

        let syncResult: any = null;

        try {
            const token = userSession?.token || localStorage.getItem('access_token') || '';
            const res = await fetch(`${apiBase}/quiz/attempts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    chapter_id: chapter.id,
                    difficulty_chosen: selectedDifficulty,
                    score: score + (selectedOptionIndex === currentQuestion?.ans ? 1 : 0), // handle latest question score since state update might be queued
                    total_questions: activeQuestions.length,
                    time_taken_seconds: elapsedSeconds
                })
            });

            if (!res.ok) {
                const errText = await res.text();
                throw new Error(`Failed to sync progress: ${errText}`);
            }

            syncResult = await res.json();

            setBackendVerifiedXp(syncResult.earned_xp);
            setDidLevelUp(syncResult.leveled_up);
            setNewLevel(syncResult.new_level);

            setIsSubmitting(false);
            const finalXp = syncResult.earned_xp;
            setUserTotalXP(prev => prev + finalXp);
            onQuizComplete({ ...syncResult, earned_xp: finalXp, accuracy: accuracy });
            setCurrentScreen('result');

        } catch (err: any) {
            console.error('Quiz submission error', err);
            setFetchError(err.message || "Unable to sync your progress to the server. Please check your connection.");
            setIsSubmitting(false);
            // Optionally, we could let them retry submitting the score, but for now we'll just show the error state in place.
        }
    };

    const resetToSetup = () => {
        if (quizType === 'assignment') {
            onBack();
            return;
        }
        stopTimer();
        setElapsedSeconds(0);
        setCurrentScreen('setup');
        setFetchError(null);
    };

    const submitReport = async () => {
        if (!currentQuestion) return;
        setIsSubmittingReport(true);
        try {
            const token = userSession?.token || localStorage.getItem('access_token') || '';
            const res = await fetch(`${apiBase}/quiz/reports`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    question_id: currentQuestion.id,
                    issue_type: reportIssueType,
                    comment: reportComment
                })
            });
            if (res.ok) {
                setReportSuccess(true);
                setTimeout(() => {
                    setIsReportModalOpen(false);
                    setReportSuccess(false);
                    setReportComment('');
                }, 2000);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsSubmittingReport(false);
        }
    };

    const getOptionClass = (index: number) => {
        const baseClass = "w-full text-left rounded-2xl p-4 md:p-5 font-semibold text-lg flex items-center justify-between group transition-all duration-200 border";

        if (!isAnswered) {
            return `${baseClass} bg-deep-space border-gray-700 text-white hover:-translate-y-1 hover:border-voltage-yellow hover:shadow-[0_4px_12px_rgba(255,215,0,0.1)] cursor-pointer active:scale-95`;
        }

        const isCorrectAns = index === currentQuestion?.ans;
        const isSelected = index === selectedOptionIndex;

        if (isCorrectAns) {
            return `${baseClass} bg-success-green/20 border-success-green text-success-green opacity-100`;
        }

        if (isSelected && !isCorrectAns) {
            return `${baseClass} bg-error-red/20 border-error-red text-error-red opacity-100`;
        }

        return `${baseClass} bg-deep-space border-gray-700 text-white opacity-50 cursor-not-allowed`;
    };

    return (
        <div className="flex flex-col w-full min-h-screen bg-deep-space font-sans text-off-white relative z-10">

            {/* Mobile Header */}
            <header className="md:hidden flex items-center justify-between p-4 sticky top-0 bg-deep-space/90 backdrop-blur-md z-30 border-b border-gray-800">
                <div className="flex items-center gap-3">
                    <button 
                        className="text-gray-400 hover:text-white transition-colors p-1 -ml-1 cursor-pointer active:scale-95" 
                        onClick={() => currentScreen !== 'setup' ? resetToSetup() : onBack()}
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-lg text-white">
                            {quizType === 'assignment' ? 'Assignment' : 'Quiz Arena'}
                        </span>
                    </div>
                </div>
            </header>

            <div className="p-4 md:p-8 max-w-4xl mx-auto w-full flex-1 flex flex-col relative z-10 pb-20">

                {/* Desktop Top Bar */}
                <div className="hidden md:flex justify-between items-end mb-8">
                    <div>
                        <button 
                            onClick={() => currentScreen !== 'setup' ? resetToSetup() : onBack()} 
                            className="flex items-center gap-2 text-gray-400 hover:text-voltage-yellow text-sm font-medium uppercase tracking-wider mb-3 transition-colors cursor-pointer active:scale-95 group"
                        >
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Retreat
                        </button>
                        <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                            <Sword className="w-8 h-8 text-voltage-yellow fill-voltage-yellow" /> 
                            {quizType === 'assignment' ? 'Assignment' : 'Quiz Arena'}
                        </h2>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className={`bg-graphite border border-gray-800 rounded-xl px-4 py-2 flex items-center gap-2 transition-all ${xpGainAnim ? 'scale-105 border-voltage-yellow text-voltage-yellow' : ''}`}>
                            <Star className={`w-5 h-5 ${xpGainAnim ? 'text-voltage-yellow fill-voltage-yellow' : 'text-voltage-yellow fill-voltage-yellow'}`} />
                            <span className="font-bold text-white">{userTotalXP} XP</span>
                        </div>
                    </div>
                </div>

                {/* Views */}
                {isLoading ? (
                    <div className="flex-1 flex flex-col items-center justify-center">
                        <Loader2 className="animate-spin w-12 h-12 text-voltage-yellow mb-6" />
                        <p className="font-bold text-white text-xl">Initializing Databank...</p>
                        <p className="text-gray-400 text-sm mt-2">Retrieving mission parameters</p>
                    </div>
                ) : isSubmitting ? (
                    <div className="flex-1 flex flex-col items-center justify-center">
                        <Loader2 className="animate-spin w-12 h-12 text-voltage-yellow mb-6" />
                        <p className="font-bold text-white text-xl">Syncing Mastery Data...</p>
                        <p className="text-gray-400 text-sm mt-2">Uploading combat logs</p>
                    </div>
                ) : fetchError ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                        <div className="w-20 h-20 bg-error-red/10 border border-error-red/30 rounded-full flex items-center justify-center mb-6 shadow-inner">
                            <AlertCircle className="w-10 h-10 text-error-red fill-error-red" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-3">Connection Severed</h3>
                        <p className="text-gray-400 mb-8 max-w-md">{fetchError}</p>
                        <button onClick={resetToSetup} className="bg-graphite border border-gray-700 text-white px-8 py-4 rounded-xl font-bold hover:border-gray-500 transition-all shadow-md cursor-pointer active:scale-95 text-sm">
                            Return to Setup
                        </button>
                    </div>
                ) : currentScreen === 'setup' ? (
                    <div className="flex-1 flex flex-col justify-center">
                        <div className="text-center mb-10 mt-6">
                            <h3 className="text-2xl md:text-3xl font-black text-white mb-2">Select Your Challenge</h3>
                            <p className="text-gray-400 font-medium">Higher difficulty yields greater XP multipliers. Choose wisely.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
                            {/* Easy */}
                            <div onClick={() => selectDifficulty('easy', 1)}
                                className={`cursor-pointer active:scale-95 rounded-3xl p-6 transition-all hover:-translate-y-1 relative overflow-hidden group border-2 ${
                                    selectedDifficulty === 'easy' ? 'bg-graphite border-voltage-yellow shadow-[0_0_20px_rgba(255,215,0,0.15)]' : 'bg-graphite border-gray-800 hover:border-gray-600'
                                }`}>
                                <div className="absolute top-0 left-0 w-full h-1 bg-success-green opacity-50"></div>
                                {selectedDifficulty === 'easy' && <div className="absolute -right-5 -top-5 w-24 h-24 bg-success-green/10 rounded-full blur-[20px] pointer-events-none"></div>}
                                <div className={`w-14 h-14 rounded-2xl bg-success-green/10 text-success-green flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${selectedDifficulty === 'easy' ? 'custom-animate-pulse-glow' : ''}`}>
                                    <ShieldCheck className="w-8 h-8 fill-success-green/20" />
                                </div>
                                <h4 className="text-xl font-bold text-white mb-1">Recruit</h4>
                                <p className="text-sm text-gray-400 mb-4">Standard practice. Good for warmups.</p>
                                <div className="inline-block px-3 py-1 bg-gray-800 rounded-lg text-xs font-bold text-success-green">1x XP Multiplier</div>
                            </div>

                            {/* Medium */}
                            <div onClick={() => selectDifficulty('medium', 2)}
                                className={`cursor-pointer active:scale-95 rounded-3xl p-6 transition-all hover:-translate-y-1 relative overflow-hidden group border-2 ${
                                    selectedDifficulty === 'medium' ? 'bg-graphite border-voltage-yellow shadow-[0_0_20px_rgba(255,215,0,0.15)]' : 'bg-graphite border-gray-800 hover:border-gray-600'
                                }`}>
                                <div className="absolute top-0 left-0 w-full h-1 bg-voltage-yellow"></div>
                                {selectedDifficulty === 'medium' && <div className="absolute -right-5 -top-5 w-24 h-24 bg-voltage-yellow/10 rounded-full blur-[20px] pointer-events-none"></div>}
                                <div className={`w-14 h-14 rounded-2xl bg-voltage-yellow/20 text-voltage-yellow flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${selectedDifficulty === 'medium' ? 'custom-animate-pulse-glow' : ''}`}>
                                    <Flame className="w-8 h-8 fill-voltage-yellow/20" />
                                </div>
                                <h4 className="text-xl font-bold text-white mb-1">Warrior</h4>
                                <p className="text-sm text-gray-400 mb-4">Test your limits. Recommended.</p>
                                <div className="inline-block px-3 py-1 bg-voltage-yellow/10 border border-voltage-yellow/30 rounded-lg text-xs font-bold text-voltage-yellow">2x XP Multiplier</div>
                            </div>

                            {/* Hard */}
                            <div onClick={() => selectDifficulty('hard', 5)}
                                className={`cursor-pointer active:scale-95 rounded-3xl p-6 transition-all hover:-translate-y-1 relative overflow-hidden group border-2 ${
                                    selectedDifficulty === 'hard' ? 'bg-graphite border-voltage-yellow shadow-[0_0_20px_rgba(255,215,0,0.15)]' : 'bg-graphite border-gray-800 hover:border-gray-600'
                                }`}>
                                <div className="absolute top-0 left-0 w-full h-1 bg-error-red opacity-50"></div>
                                {selectedDifficulty === 'hard' && <div className="absolute -right-5 -top-5 w-24 h-24 bg-error-red/10 rounded-full blur-[20px] pointer-events-none"></div>}
                                <div className={`w-14 h-14 rounded-2xl bg-error-red/10 text-error-red flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${selectedDifficulty === 'hard' ? 'custom-animate-pulse-glow' : ''}`}>
                                    <Skull className="w-8 h-8 fill-error-red/20" />
                                </div>
                                <h4 className="text-xl font-bold text-white mb-1">Legend</h4>
                                <p className="text-sm text-gray-400 mb-4">Brutal difficulty. High risk, high reward.</p>
                                <div className="inline-block px-3 py-1 bg-gray-800 rounded-lg text-xs font-bold text-error-red">5x XP Multiplier</div>
                            </div>
                        </div>

                        <div className="flex flex-col items-center justify-center">
                            {fetchError && (
                                <div className="mb-6 p-4 bg-gray-800/50 border border-red-500/30 rounded-xl max-w-lg text-center flex flex-col items-center">
                                    <AlertTriangle className="w-8 h-8 text-red-400 mb-2" />
                                    <p className="text-red-400 font-bold text-sm">{fetchError}</p>
                                </div>
                            )}

                            <button onClick={() => fetchQuizData()} disabled={isLoading} className="bg-voltage-yellow text-black px-10 py-4 rounded-2xl font-black text-lg hover:bg-yellow-400 transition-all transform hover:-translate-y-1 flex items-center gap-2 cursor-pointer active:scale-95 relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed">
                                <div className="absolute inset-0 bg-white/20 blur-[10px] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                {isLoading ? "FETCHING..." : "FETCH DATABANK"} <DownloadCloud className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                ) : currentScreen === 'summary' ? (
                    <div className="flex-1 flex flex-col justify-center items-center">
                        <div className="relative mb-6 mt-10">
                            <div className="absolute inset-0 bg-voltage-yellow rounded-full blur-[40px] opacity-10"></div>
                            <div className="w-24 h-24 bg-graphite border-2 border-voltage-yellow rounded-full flex items-center justify-center relative z-10 shadow-[0_0_20px_rgba(255,215,0,0.15)]">
                                <ClipboardList className="w-12 h-12 text-voltage-yellow" />
                            </div>
                        </div>

                        <h2 className="text-3xl md:text-4xl font-black text-white mb-2 text-center">Mission Briefing</h2>
                        <p className="text-gray-400 font-medium mb-8 text-center max-w-sm">Review the arena parameters before initiating the combat sequence.</p>

                        <div className="bg-graphite border border-gray-800 rounded-3xl p-6 w-full max-w-md shadow-lg mb-8">
                            <div className="flex justify-between items-center py-3 border-b border-gray-800">
                                <span className="text-gray-400 font-bold uppercase text-sm tracking-wider">Quiz Type</span>
                                <span className="text-lg font-black text-white capitalize">{quizType}</span>
                            </div>
                            <div className="flex justify-between items-center py-3 border-b border-gray-800">
                                <span className="text-gray-400 font-bold uppercase text-sm tracking-wider">Difficulty</span>
                                <span className={`text-lg font-black capitalize ${
                                    selectedDifficulty === 'easy' ? 'text-success-green' : 
                                    selectedDifficulty === 'medium' ? 'text-voltage-yellow' : 'text-error-red'
                                }`}>{selectedDifficulty}</span>
                            </div>
                            <div className="flex justify-between items-center py-3 border-b border-gray-800">
                                <span className="text-gray-400 font-bold uppercase text-sm tracking-wider">Total Questions</span>
                                <span className="text-lg font-black text-white">{activeQuestions.length} (Max 10)</span>
                            </div>
                            <div className="flex justify-between items-center py-3">
                                <span className="text-gray-400 font-bold uppercase text-sm tracking-wider">Potential XP</span>
                                <div className="text-right">
                                    <span className="text-xl font-black text-voltage-yellow">{potentialXp} XP</span>
                                    <div className="text-[10px] text-gray-500 font-bold">Includes <span>{currentMultiplier}</span>x Multiplier</div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                            {quizType !== 'assignment' && (
                                <button onClick={resetToSetup} className="flex-1 bg-deep-space text-white border border-gray-700 px-6 py-4 rounded-xl font-bold text-sm hover:bg-gray-800 hover:border-gray-500 transition-all text-center cursor-pointer active:scale-95 shadow-md">
                                    CHANGE SETTINGS
                                </button>
                            )}
                            <button onClick={confirmStart} className="flex-1 bg-voltage-yellow text-black px-6 py-4 rounded-xl font-bold text-sm hover:bg-yellow-400 transition-all transform hover:-translate-y-1 shadow-[0_5px_15px_rgba(255,215,0,0.2)] text-center flex justify-center items-center gap-2 cursor-pointer active:scale-95">
                                <Play className="w-5 h-5 fill-black" /> INITIATE
                            </button>
                        </div>
                    </div>
                ) : currentScreen === 'quiz' && currentQuestion ? (
                    <div className="flex-1 flex flex-col relative w-full pt-4">
                        {/* HUD */}
                        <div className="flex items-center justify-between bg-graphite border border-gray-800 rounded-2xl p-4 md:px-6 mb-6 shadow-lg relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-voltage-yellow/5 to-transparent opacity-50"></div>
                            <div className="relative z-10 flex flex-col">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Question</span>
                                <div className="text-xl font-black text-white"><span className="text-voltage-yellow">{currentQuestionIndex + 1}</span> <span className="text-gray-600">/</span> <span>{activeQuestions.length}</span></div>
                            </div>
                            <div className="relative z-10 flex flex-col items-center">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Timer</span>
                                <div className={`text-xl font-black text-white flex items-center gap-2 ${elapsedSeconds > 300 ? 'text-error-red' : ''}`}>
                                    <Timer className={`w-5 h-5 ${elapsedSeconds > 300 ? 'text-error-red' : 'text-voltage-yellow'}`} /> {formattedTime}
                                </div>
                            </div>
                            <div className="relative z-10 flex flex-col items-end">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Earned XP</span>
                                <div className="text-xl font-black text-voltage-yellow flex items-center gap-1">
                                    <span className={`transition-all duration-300 inline-block ${xpGainAnim ? 'scale-125 text-white' : ''}`}>+{localVisualXpEarned}</span>
                                    <span className="hidden md:inline text-xs text-gray-400 ml-1 font-bold">(x{currentMultiplier} Mult)</span>
                                </div>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full h-1.5 bg-graphite rounded-full mb-8 overflow-hidden">
                            <div className="h-full bg-voltage-yellow rounded-full transition-all duration-300" style={{ width: `${quizProgress}%` }}></div>
                        </div>

                        {/* Question Area */}
                        <div className="flex-1 pb-10 w-full">
                            {currentQuestion.question_image_url && (
                                <div className="mb-6 w-full rounded-2xl overflow-hidden border border-gray-800 bg-black/40 flex justify-center p-4">
                                    <img src={currentQuestion.question_image_url} alt="Question visual reference" className="max-h-64 object-contain rounded-lg drop-shadow-xl" />
                                </div>
                            )}

                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
                                <h3 className="text-2xl md:text-3xl font-bold text-white leading-tight flex-1">
                                    {currentQuestion.q}
                                </h3>
                                <button 
                                    onClick={() => setIsReportModalOpen(true)}
                                    className="shrink-0 flex items-center gap-2 text-gray-400 bg-gray-800 hover:bg-red-900/30 hover:text-red-400 hover:border-red-500/50 transition-colors cursor-pointer px-4 py-2 rounded-xl border border-gray-700 shadow-sm"
                                    title="Report an issue with this question"
                                >
                                    <AlertTriangle className="w-4 h-4" />
                                    <span className="text-xs font-bold uppercase tracking-wider">Report</span>
                                </button>
                            </div>

                            <div className="space-y-4">
                                {currentQuestion.options.map((opt, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handleAnswer(index)}
                                        disabled={isAnswered}
                                        className={getOptionClass(index)}
                                    >
                                        <div className="flex-1 flex flex-col md:flex-row items-center md:items-start gap-4 mr-4">
                                            {opt.image_url && (
                                                <div className="bg-black/40 p-2 rounded-xl border border-gray-800 shadow-inner">
                                                    <img src={opt.image_url} className="max-h-24 md:max-h-32 object-contain rounded" />
                                                </div>
                                            )}
                                            {opt.text && <span className="mt-2 md:mt-0 md:self-center">{opt.text}</span>}
                                        </div>

                                        {!isAnswered ? (
                                            <div className="w-6 h-6 shrink-0 rounded-full border-2 border-gray-600 group-hover:border-voltage-yellow flex items-center justify-center transition-colors"></div>
                                        ) : index === currentQuestion.ans ? (
                                            <div className="w-6 h-6 shrink-0 rounded-full border-2 border-success-green flex items-center justify-center">
                                                <Check className="w-4 h-4 text-success-green stroke-[3]" />
                                            </div>
                                        ) : index === selectedOptionIndex && index !== currentQuestion.ans ? (
                                            <div className="w-6 h-6 shrink-0 rounded-full border-2 border-error-red flex items-center justify-center">
                                                <X className="w-4 h-4 text-error-red stroke-[3]" />
                                            </div>
                                        ) : (
                                            <div className="w-6 h-6 shrink-0 rounded-full border-2 border-gray-600 opacity-50 flex items-center justify-center"></div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : currentScreen === 'result' ? (
                    <div className="flex-1 flex flex-col justify-center items-center pt-8 fade-enter-active">
                        {didLevelUp && (
                            <div className="mb-6 animate-[float_3s_ease-in-out_infinite]">
                                <div className="bg-gradient-to-r from-voltage-yellow to-orange-400 px-6 py-2 rounded-full shadow-[0_0_20px_rgba(255,215,0,0.4)] flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-black stroke-[3]" />
                                    <span className="text-black font-black uppercase tracking-wider text-sm">Level Up: {newLevel}!</span>
                                </div>
                            </div>
                        )}

                        <div className="relative mb-8 mt-2">
                            <div className="absolute inset-0 bg-voltage-yellow rounded-full blur-[50px] opacity-20 custom-animate-pulse-glow"></div>
                            <div className="w-32 h-32 bg-graphite border-4 border-voltage-yellow rounded-full flex items-center justify-center relative z-10 shadow-2xl">
                                <Trophy className="w-16 h-16 text-voltage-yellow fill-voltage-yellow" />
                            </div>
                        </div>

                        <h2 className="text-4xl font-black text-white mb-2">Arena Conquered!</h2>
                        <p className="text-gray-400 font-medium mb-8">You successfully survived the <span className="text-voltage-yellow capitalize">{selectedDifficulty}</span> difficulty.</p>

                        <div className="bg-graphite border border-gray-800 rounded-3xl p-6 w-full max-w-md shadow-lg mb-8">
                            <div className="flex justify-between items-center py-3 border-b border-gray-800">
                                <span className="text-gray-400 font-bold uppercase text-sm">Accuracy</span>
                                <span className="text-xl font-black text-white">{accuracy}%</span>
                            </div>
                            <div className="flex justify-between items-center py-3 border-b border-gray-800">
                                <span className="text-gray-400 font-bold uppercase text-sm">Correct Answers</span>
                                <span className="text-xl font-black text-white"><span className="text-success-green">{score}</span> / {activeQuestions.length}</span>
                            </div>
                            <div className="flex justify-between items-center py-3 border-b border-gray-800">
                                <span className="text-gray-400 font-bold uppercase text-sm">Time Taken</span>
                                <span className="text-xl font-black text-white flex items-center gap-2"><Timer className="w-5 h-5 text-voltage-yellow" /> {formattedTime}</span>
                            </div>
                            <div className="flex justify-between items-center py-3">
                                <span className="text-gray-400 font-bold uppercase text-sm">Total XP Gained</span>
                                <div className="text-right">
                                    <span className="text-2xl font-black text-voltage-yellow">+{backendVerifiedXp} XP</span>
                                    <div className="text-[10px] text-gray-500 font-bold mt-1">Includes Time & Perfection Bonuses</div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md mt-4">
                            <button onClick={resetToSetup} className="flex-1 bg-gray-800 text-white border border-gray-700 px-6 py-4 rounded-xl font-bold text-sm hover:bg-gray-700 transition-all flex justify-center items-center gap-2 cursor-pointer active:scale-95 shadow-md">
                                <RotateCcw className="w-5 h-5" /> PLAY AGAIN
                            </button>
                            <button onClick={() => onNavigate('dashboard')} className="flex-1 bg-voltage-yellow text-black px-6 py-4 rounded-xl font-bold text-sm hover:bg-yellow-400 transition-all transform hover:-translate-y-1 shadow-[0_5px_15px_rgba(255,215,0,0.2)] flex justify-center items-center gap-2 cursor-pointer active:scale-95">
                                <Home className="w-5 h-5 fill-black" /> BASECAMP
                            </button>
                        </div>
                    </div>
                ) : null}
            </div>

            {/* Report Modal */}
            {isReportModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center p-4 z-[60]">
                    <div className="bg-graphite border border-gray-700 p-6 md:p-8 rounded-2xl w-full max-w-md shadow-2xl text-white">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold flex items-center gap-2 text-voltage-yellow">
                                <AlertTriangle className="w-6 h-6" />
                                Report Question
                            </h3>
                            <button onClick={() => setIsReportModalOpen(false)} className="text-gray-400 hover:text-white transition-colors cursor-pointer">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        
                        {reportSuccess ? (
                            <div className="bg-success-green/20 text-success-green p-4 rounded-lg flex items-center gap-3 mb-2">
                                <Check className="w-5 h-5 shrink-0" />
                                <p className="font-semibold">Thank you! Your report has been submitted for review.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-400 mb-2">Issue Type</label>
                                    <select 
                                        value={reportIssueType}
                                        onChange={(e) => setReportIssueType(e.target.value)}
                                        className="w-full bg-deep-space border border-gray-700 rounded-lg p-3 text-white outline-none focus:border-voltage-yellow transition-colors"
                                    >
                                        <option value="wrong_answer">Wrong Answer</option>
                                        <option value="incomplete_question">Incomplete Question</option>
                                        <option value="unclear">Unclear or Confusing</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-semibold text-gray-400 mb-2">Additional Details (Optional)</label>
                                    <textarea 
                                        value={reportComment}
                                        onChange={(e) => setReportComment(e.target.value)}
                                        placeholder="Please provide any extra details to help us fix the issue..."
                                        className="w-full bg-deep-space border border-gray-700 rounded-lg p-3 text-white outline-none focus:border-voltage-yellow transition-colors resize-none h-24"
                                    />
                                </div>
                                
                                <button 
                                    onClick={submitReport}
                                    disabled={isSubmittingReport}
                                    className="w-full bg-error-red text-white font-bold py-3 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    {isSubmittingReport ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Submitting...
                                        </>
                                    ) : 'Submit Report'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

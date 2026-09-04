import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
    ArrowLeft, ArrowRight, Sword, Star, AlertCircle, ShieldCheck, Flame, Skull, 
    DownloadCloud, ClipboardList, Play, Timer, Check, X, TrendingUp, Trophy,
    RotateCcw, Home, Loader2, AlertTriangle, Menu, Flag, ChevronLeft, ChevronRight, Grid
} from 'lucide-react';
import { useAuthStore } from '../../stores/auth';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

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
    ans: number[];
    question_type?: 'mcq' | 'msq' | 'true_false';
    explanation?: string | null;
    tags?: any;
    difficulty?: string;
    question_translations?: any;
    options_translations?: any;
    explanation_translations?: any;
}

interface QuizArenaProps {
    chapter: any;
    topic?: any;
    apiBase?: string;
    onBack: () => void;
    onNavigate: (route: string) => void;
    onQuizComplete: (result: any) => void;
    predefinedDifficulty?: 'easy' | 'medium' | 'hard' | 'adaptive';
    quizType?: 'practice' | 'mistakes';
    onNextWarmup?: () => void;
    onStartAdaptive?: () => void;
}

type Screen = 'setup' | 'quiz' | 'review' | 'result' | 'review_answers';
type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'adaptive';

export default function QuizArena({
    chapter,
    topic,
    apiBase = import.meta.env.VITE_API_URL || '',
    onBack,
    onNavigate,
    onQuizComplete,
    predefinedDifficulty,
    quizType = 'practice',
    onNextWarmup,
    onStartAdaptive
}: QuizArenaProps) {
    const { user, updateUser } = useAuthStore();
    const [userTotalXP, setUserTotalXP] = useState(Number(user?.xp) || 0);

    const [currentScreen, setCurrentScreen] = useState<Screen>('setup');
    const [setupCountdown, setSetupCountdown] = useState<number>(3);
    const [idempotencyKey] = useState<string>(() => crypto.randomUUID());
    const [checkedQuestions, setCheckedQuestions] = useState<Record<number, boolean>>({});
    const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>(predefinedDifficulty || 'adaptive');
    const [currentMultiplier, setCurrentMultiplier] = useState<number>(2);

    const [activeQuestions, setActiveQuestions] = useState<QuizQuestion[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);

    const [backendVerifiedXp, setBackendVerifiedXp] = useState<number>(0);
    const [backendVerifiedAccuracy, setBackendVerifiedAccuracy] = useState<number | null>(null);
    const [didLevelUp, setDidLevelUp] = useState<boolean>(false);
    const [newLevel, setNewLevel] = useState<number | null>(null);
    const [hasRankedUp, setHasRankedUp] = useState<boolean>(false);
    const [newRankTitle, setNewRankTitle] = useState<string | null>(null);
    const [streakFreezesAwarded, setStreakFreezesAwarded] = useState<number>(0);
    const [oldChapterMastery, setOldChapterMastery] = useState<number | null>(null);
    const [newChapterMastery, setNewChapterMastery] = useState<number | null>(null);

    const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
    const timerInterval = useRef<ReturnType<typeof setInterval> | null>(null);

    const [answers, setAnswers] = useState<Record<number, number[]>>({});
    const [timeSpentMap, setTimeSpentMap] = useState<Record<number, number>>({});
    const currentQuestionIndexRef = useRef(currentQuestionIndex);
    useEffect(() => {
        currentQuestionIndexRef.current = currentQuestionIndex;
    }, [currentQuestionIndex]);
    const [xpGainAnim, setXpGainAnim] = useState<boolean>(false);

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [reportIssueType, setReportIssueType] = useState('wrong_answer');
    const [reportComment, setReportComment] = useState('');
    const [isSubmittingReport, setIsSubmittingReport] = useState(false);
    const [reportSuccess, setReportSuccess] = useState(false);
    const [reportError, setReportError] = useState<string | null>(null);

    const currentQuestion = activeQuestions[currentQuestionIndex] || null;

    const quizProgress = useMemo(() => {
        if (activeQuestions.length === 0) return 0;
        if (currentScreen === 'result' || currentScreen === 'review') return 100;
        return (Object.keys(answers).length / activeQuestions.length) * 100;
    }, [activeQuestions.length, currentScreen, answers]);

    const calculatedScore = useMemo(() => {
        return activeQuestions.reduce((sum, q, idx) => {
            const userAns = answers[idx] || [];
            const correctAns = q.ans || [];
            const isCorrect = userAns.length === correctAns.length && userAns.every(val => correctAns.includes(val));
            return isCorrect ? sum + 1 : sum;
        }, 0);
    }, [answers, activeQuestions]);

    const accuracy = useMemo(() => {
        if (activeQuestions.length === 0) return 0;
        return Math.round((calculatedScore / activeQuestions.length) * 100);
    }, [calculatedScore, activeQuestions.length]);

    const calculatedEarnedXp = useMemo(() => {
        let qXP = activeQuestions.reduce((sum, q, idx) => {
            const userAns = answers[idx] || [];
            const correctAns = q.ans || [];
            const isCorrect = userAns.length === correctAns.length && userAns.every(val => correctAns.includes(val));
            if (!isCorrect) return sum; // Incorrect answer = 0 XP
            
            let diff = q.difficulty || selectedDifficulty;
            if (diff === 'easy') return sum + 1;
            if (diff === 'hard') return sum + 3;
            return sum + 2; // medium or adaptive
        }, 0);
        
        let bonus = 0;
        if (selectedDifficulty === 'easy') bonus = 10;
        else if (selectedDifficulty === 'adaptive' || selectedDifficulty === 'medium') bonus = 20;
        
        return qXP + bonus;
    }, [activeQuestions, answers, selectedDifficulty]);

    const potentialXp = useMemo(() => {
        let maxQXP = activeQuestions.reduce((sum, q) => {
            let diff = q.difficulty || selectedDifficulty;
            if (diff === 'easy') return sum + 1;
            if (diff === 'hard') return sum + 3;
            return sum + 2; 
        }, 0);
        
        let bonus = 0;
        if (selectedDifficulty === 'easy') bonus = 10;
        else if (selectedDifficulty === 'adaptive' || selectedDifficulty === 'medium') bonus = 20;
        
        return maxQXP + bonus;
    }, [activeQuestions, selectedDifficulty]);

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
        setTimeSpentMap({});
        if (timerInterval.current) clearInterval(timerInterval.current);
        timerInterval.current = setInterval(() => {
            setElapsedSeconds(prev => prev + 1);
            setTimeSpentMap(prev => ({
                ...prev,
                [currentQuestionIndexRef.current]: (prev[currentQuestionIndexRef.current] || 0) + 1
            }));
        }, 1000);
    };

    const stopTimer = () => {
        if (timerInterval.current) {
            clearInterval(timerInterval.current);
            timerInterval.current = null;
        }
    };

    useEffect(() => {
        if (currentScreen === 'setup' && setupCountdown > 0) {
            const timer = setTimeout(() => setSetupCountdown(prev => prev - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [currentScreen, setupCountdown]);

    useEffect(() => {
        const difficulty = predefinedDifficulty || 'adaptive';
        let mult = 1;
        if (difficulty === 'easy') mult = 1;
        else if (difficulty === 'medium') mult = 2;
        else if (difficulty === 'hard') mult = 5;
        setCurrentMultiplier(mult);
        fetchQuizData(difficulty);
        return () => stopTimer();
    }, []);

    const fetchQuizData = async (overrideDifficulty?: DifficultyLevel) => {
        setIsLoading(true);
        setFetchError(null);

        const diffToUse = (typeof overrideDifficulty === 'string') ? overrideDifficulty : selectedDifficulty;

        try {
            const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || localStorage.getItem('token') || sessionStorage.getItem('token') || '';
            const fetchUrl = quizType === 'mistakes' 
                ? `${apiBase}/quiz/chapters/${chapter?.id}/mistakes`
                : topic 
                    ? `${apiBase}/quiz/topics/${topic.id}/questions?difficulty=${diffToUse}`
                    : `${apiBase}/quiz/chapters/${chapter?.id}/questions/adaptive`;
            const res = await fetch(fetchUrl, {
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

            // Shuffle options and update the correct answer index
            const shuffledData = data.map((q: any) => {
                const originalOptions = [...q.options];
                const originalCorrectIndices = Array.isArray(q.ans) ? q.ans : (typeof q.ans === 'number' ? [q.ans] : []);
                const correctOptions = originalCorrectIndices.map(idx => originalOptions[idx]);
                
                // Shuffle using simple sort
                const shuffledOptions = [...originalOptions].sort(() => Math.random() - 0.5);
                
                const newAnsIndices = correctOptions.map(opt => shuffledOptions.findIndex(o => o === opt)).filter(idx => idx !== -1);
                
                return {
                    ...q,
                    options: shuffledOptions,
                    ans: newAnsIndices
                };
            });

            setActiveQuestions(shuffledData.slice(0, 10));
            setCurrentQuestionIndex(0);
            setAnswers({});
            setBackendVerifiedXp(0);
            setDidLevelUp(false);
            setSetupCountdown(3);

            setIsLoading(false);
            setCurrentScreen('setup');

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
        if (!currentQuestion || isSubmitting) return;
        if (!!topic && checkedQuestions[currentQuestionIndex]) return;
        
        setAnswers(prev => {
            const currentAns = prev[currentQuestionIndex] || [];
            if (currentQuestion.question_type === 'msq') {
                if (currentAns.includes(index)) {
                    return { ...prev, [currentQuestionIndex]: currentAns.filter(i => i !== index) };
                } else {
                    return { ...prev, [currentQuestionIndex]: [...currentAns, index] };
                }
            } else {
                if (!!topic) {
                    // Instant Strike for practice mode
                    setCheckedQuestions(checkedPrev => ({ ...checkedPrev, [currentQuestionIndex]: true }));
                }
                return { ...prev, [currentQuestionIndex]: [index] };
            }
        });
    };

    const nextQuestion = () => {
        if (currentQuestionIndex + 1 < activeQuestions.length) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            endQuiz();
        }
    };

    const prevQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    const isSubmittingRef = useRef(false);

    const endQuiz = async () => {
        if (isSubmittingRef.current) return;
        isSubmittingRef.current = true;
        setIsSubmitting(true);
        stopTimer();

        let syncResult: any = null;
        
        const compiledResults = activeQuestions.map((q, idx) => {
            const userAns = answers[idx] || [];
            const correctAns = q.ans || [];
            const isCorrect = userAns.length === correctAns.length && userAns.every(val => correctAns.includes(val));
            return {
                question_id: q.id,
                is_correct: isCorrect,
                time_spent: timeSpentMap[idx] || 0
            };
        });

        try {
            const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || localStorage.getItem('token') || sessionStorage.getItem('token') || '';
            const res = await fetch(`${apiBase}/quiz/attempts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    idempotency_key: idempotencyKey,
                    chapter_id: chapter?.id || -1,
                    topic_id: topic ? topic.id : -1,
                    is_topic_quiz: !!topic,
                    difficulty_chosen: selectedDifficulty,
                    score: calculatedScore,
                    total_questions: activeQuestions.length,
                    time_taken_seconds: elapsedSeconds,
                    question_results: compiledResults
                })
            });

            if (!res.ok) {
                const errText = await res.text();
                throw new Error(`Failed to sync progress: ${errText}`);
            }

            syncResult = await res.json();


            // Overwrite backend xp with our new frontend logic
            const finalXp = calculatedEarnedXp;
            setBackendVerifiedXp(finalXp);
            setDidLevelUp(syncResult.leveled_up);
            setNewLevel(syncResult.new_level);
            setHasRankedUp(syncResult.has_ranked_up);
            setNewRankTitle(syncResult.new_rank_title);
            setStreakFreezesAwarded(syncResult.streak_freezes_awarded || 0);
            setOldChapterMastery(syncResult.old_chapter_mastery !== undefined ? syncResult.old_chapter_mastery : null);
            setNewChapterMastery(syncResult.new_chapter_mastery !== undefined ? syncResult.new_chapter_mastery : null);
            setBackendVerifiedAccuracy(syncResult.new_accuracy !== undefined ? syncResult.new_accuracy : null);

            setIsSubmitting(false);
            setUserTotalXP(prev => prev + finalXp);
            
            if (user) {
                updateUser({ xp: (user.xp || 0) + finalXp });
            }

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
        stopTimer();
        onBack();
    };

    const submitReport = async () => {
        if (!currentQuestion) return;
        
        setReportError(null);
        if (reportIssueType === 'other' && reportComment.trim().length < 5) {
            setReportError("Please provide a comment describing the issue.");
            return;
        }

        setIsSubmittingReport(true);
        try {
            const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || localStorage.getItem('token') || sessionStorage.getItem('token') || '';
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
            } else {
                setReportError("Failed to submit report. Please try again.");
            }
        } catch (e) {
            console.error(e);
            setReportError("Failed to submit report. Please check your connection.");
        } finally {
            setIsSubmittingReport(false);
        }
    };

    const getOptionClass = (index: number) => {
        const baseClass = "w-full text-left rounded-[1.5rem] p-4 md:p-5 font-bold text-lg flex items-center justify-start gap-4 group transition-all duration-200 ease-in-out border-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-app";
        const currentAns = answers[currentQuestionIndex] || [];
        const isSelected = currentAns.includes(index);
        
        if (!!topic && checkedQuestions[currentQuestionIndex] && currentQuestion) {
            const isCorrectAns = (currentQuestion.ans || []).includes(index);
            if (isCorrectAns) {
                return `${baseClass} bg-semantic-success/10 border-semantic-success text-semantic-success opacity-100 cursor-default`;
            } else if (isSelected) {
                return `${baseClass} bg-semantic-error/10 border-semantic-error text-semantic-error opacity-100 cursor-default`;
            }
            return `${baseClass} bg-bg-surface border-border-subtle/50 text-gray-500 opacity-50 pointer-events-none`;
        }

        if (isSelected) {
            return `${baseClass} bg-brand-primary/10 border-brand-primary text-white opacity-100 border-b-[6px] shadow-[0_5px_15px_rgba(250,204,21,0.15)]`;
        }

        return `${baseClass} bg-bg-surface border-border-subtle/50 text-white hover:bg-white/5 cursor-pointer active:scale-[0.98] shadow-inner`;
    };

    return (
        <div className="flex flex-col w-full min-h-screen bg-bg-app font-sans text-white relative z-10">

            <div className="p-4 md:p-8 max-w-4xl mx-auto w-full flex-1 flex flex-col relative z-10 pb-20">

                {/* Views */}
                {isLoading ? (
                    <div className="flex-1 flex flex-col items-center justify-center">
                        <Loader2 className="animate-spin w-12 h-12 text-brand-primary mb-6" />
                        <p className="font-bold text-white text-xl">Initializing Databank...</p>
                        <p className="text-gray-400 text-sm mt-2">Retrieving mission parameters</p>
                    </div>
                ) : isSubmitting ? (
                    <div className="flex-1 flex flex-col items-center justify-center">
                        <Loader2 className="animate-spin w-12 h-12 text-brand-primary mb-6" />
                        <p className="font-bold text-white text-xl">Syncing Mastery Data...</p>
                        <p className="text-gray-400 text-sm mt-2">Uploading combat logs</p>
                    </div>
                ) : fetchError ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                        <div className="w-20 h-20 bg-semantic-error/10 border-2 border-semantic-error/30 rounded-full flex items-center justify-center mb-6 shadow-inner">
                            <AlertCircle className="w-10 h-10 text-semantic-error fill-semantic-error" />
                        </div>
                        <h3 className="text-2xl font-black text-white mb-3">Connection Severed</h3>
                        <p className="text-text-secondary mb-8 max-w-md font-bold">{fetchError}</p>
                        <button onClick={resetToSetup} className="bg-bg-surface border-2 border-border-subtle/50 border-b-[4px] text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest hover:border-slate-500 transition-all shadow-md cursor-pointer hover:-translate-y-1 active:translate-y-0 text-sm">
                            Return
                        </button>
                    </div>
                ) : currentScreen === 'setup' ? (
                    <div className="flex-1 flex flex-col items-center justify-center fade-enter-active">
                        <Card variant="gamified" className="w-full max-w-md p-6 md:p-8 flex flex-col items-center text-center">
                            <>
                                <div className="w-16 h-16 md:w-20 md:h-20 bg-bg-surface border-2 border-border-subtle rounded-full flex items-center justify-center mb-4 md:mb-6 shadow-[0_0_20px_rgba(250,204,21,0.2)]">
                                    <Play className="w-8 h-8 md:w-10 md:h-10 text-brand-primary ml-1" />
                                </div>
                                <h2 className="text-2xl md:text-3xl font-black text-white mb-4 md:mb-6 tracking-tight leading-tight capitalize px-2 md:px-6 w-full line-clamp-2">
                                    {topic ? topic.title || topic.name : chapter?.title || chapter?.name || 'Quiz Arena'}
                                </h2>
                                {!!topic ? (
                                    <div className="flex flex-col items-center gap-2 md:gap-3 w-full mb-6 md:mb-8">
                                        <Badge variant="default" className="bg-transparent border-white/20 text-white shadow-sm mb-1">
                                            Warm-up Mode
                                        </Badge>
                                        <div className="flex flex-col gap-0.5 md:gap-1 text-xs md:text-sm font-bold text-text-secondary">
                                            <span>Practice / No XP</span>
                                            <span>Immediate Feedback</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-2 md:gap-3 w-full mb-6 md:mb-8">
                                        <Badge variant="active" className="mb-1">
                                            Adaptive Mode
                                        </Badge>
                                        <div className="flex flex-col gap-0.5 md:gap-1 text-xs md:text-sm font-bold text-text-secondary">
                                            <span className="flex items-center justify-center gap-1.5"><Star className="w-3 h-3 md:w-4 md:h-4 text-brand-primary" /> Earn XP & Level Up</span>
                                            <span className="flex items-center justify-center gap-1.5"><Flame className="w-3 h-3 md:w-4 md:h-4 text-orange-500" /> Maintain Daily Streak</span>
                                        </div>
                                    </div>
                                )}
                                <div className="w-full px-1 md:px-2">
                                    <Button 
                                        variant="primary"
                                        size="lg"
                                        onClick={confirmStart} 
                                        disabled={setupCountdown > 0}
                                        className="w-full uppercase tracking-widest text-sm"
                                    >
                                        {setupCountdown > 0 ? (
                                            <>STARTING IN {setupCountdown}...</>
                                        ) : (
                                            <><Play className="w-5 h-5 fill-black" /> START {!!topic ? 'PRACTICE' : 'ADAPTIVE'}</>
                                        )}
                                    </Button>
                                </div>
                            </>
                        </Card>
                    </div>
                ) : currentScreen === 'quiz' && currentQuestion ? (
                    <div className="flex-1 flex flex-col relative w-full pt-4 gap-6">

                        {/* Main Quiz Area */}
                        <div className="flex-1 flex flex-col relative w-full">
                        {/* HUD & Progress */}
                        <div className="flex flex-col mb-8 w-full mt-4">
                            <div className="flex items-center justify-between w-full">
                                <span className="text-sm font-bold text-text-secondary uppercase tracking-wider">
                                    Question {currentQuestionIndex + 1} <span className="text-text-muted">/ {activeQuestions.length}</span>
                                </span>
                                
                                <div className="flex items-center gap-6">
                                    {!topic && (
                                        <div className={`text-sm font-bold flex items-center gap-1.5 uppercase tracking-wider ${elapsedSeconds > 300 ? 'text-semantic-error' : 'text-text-secondary'}`}>
                                            <Timer className={`w-4 h-4 ${elapsedSeconds > 300 ? 'text-semantic-error' : 'text-brand-primary'}`} /> {formattedTime}
                                        </div>
                                    )}
                                    <button 
                                        onClick={() => setIsReportModalOpen(true)}
                                        className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-brand-primary rounded"
                                        title="Report an issue with this question"
                                    >
                                        <AlertTriangle className="w-3.5 h-3.5" />
                                        <span className="font-bold uppercase tracking-widest">Report</span>
                                    </button>
                                </div>
                            </div>
                            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mt-3">
                                <div className="h-full bg-brand-primary rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(250,204,21,0.5)]" style={{ width: `${quizProgress}%` }}></div>
                            </div>
                        </div>

                        {/* Question Area */}
                        <div className="flex-1 pb-10 w-full">
                            {currentQuestion.question_image_url && (
                                <div className="mb-6 w-full rounded-2xl overflow-hidden border border-gray-800 bg-black/40 flex justify-center p-4">
                                    <img src={currentQuestion.question_image_url} alt="Question visual reference" className="max-h-64 object-contain rounded-lg drop-shadow-xl" />
                                </div>
                            )}

                            <div className="flex flex-col mb-8">
                                <h3 className="text-2xl md:text-3xl font-black text-white leading-tight tracking-tight">
                                    {currentQuestion.q}
                                </h3>
                                {currentQuestion.question_type === 'msq' && (
                                    <p className="text-sm font-bold text-brand-primary mt-2 uppercase tracking-widest">Select all that apply</p>
                                )}
                            </div>

                            <div className="space-y-4">
                                {currentQuestion.options.map((opt, index) => {
                                    if (!opt.text && !opt.image_url) return null;
                                    return (
                                        <button
                                            key={index}
                                            onClick={() => handleAnswer(index)}
                                            className={getOptionClass(index)}
                                        >
                                            {(() => {
                                                const isEvaluated = !!topic && checkedQuestions[currentQuestionIndex];
                                                const isSelected = (answers[currentQuestionIndex] || []).includes(index);
                                                const isCorrectAns = (currentQuestion.ans || []).includes(index);
                                                
                                                if (isEvaluated) {
                                                    if (isCorrectAns) {
                                                        return (
                                                            <div className="w-6 h-6 shrink-0 border-2 border-semantic-success flex items-center justify-center bg-semantic-success rounded-full">
                                                                <Check className="w-4 h-4 text-black font-black" strokeWidth={4} />
                                                            </div>
                                                        );
                                                    } else if (isSelected) {
                                                        return (
                                                            <div className="w-6 h-6 shrink-0 border-2 border-semantic-error flex items-center justify-center bg-semantic-error rounded-full">
                                                                <X className="w-4 h-4 text-black font-black" strokeWidth={4} />
                                                            </div>
                                                        );
                                                    }
                                                    return (
                                                        <div className={`w-6 h-6 shrink-0 border-2 border-gray-600 flex items-center justify-center transition-colors ${currentQuestion.question_type === 'msq' ? 'rounded-md' : 'rounded-full'}`}></div>
                                                    );
                                                }

                                                if (isSelected) {
                                                    return (
                                                        <div className={`w-6 h-6 shrink-0 border-2 border-brand-primary flex items-center justify-center bg-brand-primary ${currentQuestion.question_type === 'msq' ? 'rounded-md' : 'rounded-full'}`}>
                                                            {currentQuestion.question_type === 'msq' ? (
                                                                <Check className="w-4 h-4 text-black font-black" strokeWidth={4} />
                                                            ) : (
                                                                <div className="w-2 h-2 bg-black rounded-full"></div>
                                                            )}
                                                        </div>
                                                    );
                                                }
                                                return (
                                                    <div className={`w-6 h-6 shrink-0 border-2 border-gray-600 flex items-center justify-center transition-colors ${currentQuestion.question_type === 'msq' ? 'rounded-md' : 'rounded-full'}`}></div>
                                                );
                                            })()}
                                            <div className="flex-1 flex flex-col md:flex-row items-center md:items-start gap-4">
                                                {opt.image_url && (
                                                    <div className="bg-black/40 p-2 rounded-xl border border-gray-800 shadow-inner">
                                                        <img src={opt.image_url} className="max-h-24 md:max-h-32 object-contain rounded" />
                                                    </div>
                                                )}
                                                {opt.text && (
                                                    <div className="flex flex-col mt-2 md:mt-0 md:self-center">
                                                        <span>{opt.text}</span>
                                                        {chapter?.curriculum_medium && chapter.curriculum_medium !== 'english' && currentQuestion.options_translations && (
                                                            <span className="text-sm text-gray-400 mt-1">
                                                                {typeof currentQuestion.options_translations === 'string'
                                                                    ? ((JSON.parse(currentQuestion.options_translations)[chapter.curriculum_medium === 'hindi' ? 'hi' : chapter.curriculum_medium.substring(0, 2)] || [])[index] || (JSON.parse(currentQuestion.options_translations).hi || [])[index])
                                                                    : ((currentQuestion.options_translations[chapter.curriculum_medium === 'hindi' ? 'hi' : chapter.curriculum_medium.substring(0, 2)] || [])[index] || (currentQuestion.options_translations.hi || [])[index])}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </button>
                                )})}
                            </div>

                            {!!topic && checkedQuestions[currentQuestionIndex] && currentQuestion.explanation && (
                                <div className="mt-8 bg-bg-surface border-2 border-brand-primary/30 border-b-[4px] rounded-2xl p-6">
                                    <h3 className="text-brand-primary font-black uppercase tracking-widest text-xs mb-2 flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4" /> Explanation
                                    </h3>
                                    <p className="text-gray-300 text-sm leading-relaxed">{currentQuestion.explanation}</p>
                                </div>
                            )}

                            {(() => {
                                const isEvaluated = !topic || checkedQuestions[currentQuestionIndex];
                                const isAnswered = answers[currentQuestionIndex] && answers[currentQuestionIndex].length > 0;

                                if (topic && currentQuestion.question_type === 'msq' && !isEvaluated) {
                                    return (
                                        <div className="mt-8">
                                            <Button
                                                variant="primary"
                                                onClick={() => setCheckedQuestions(prev => ({ ...prev, [currentQuestionIndex]: true }))}
                                                disabled={!isAnswered}
                                                className="w-full uppercase tracking-widest font-black"
                                            >
                                                Check Answer
                                            </Button>
                                        </div>
                                    );
                                }

                                if (isEvaluated) {
                                    return (
                                        <div className="mt-8">
                                            <Button
                                                variant="primary"
                                                onClick={nextQuestion}
                                                className="w-full uppercase tracking-widest font-black"
                                                autoFocus
                                            >
                                                {currentQuestionIndex + 1 === activeQuestions.length ? 'Submit ➔' : 'Next Question ➔'}
                                            </Button>
                                        </div>
                                    );
                                }

                                return null;
                            })()}
                        </div>
                        </div>
                    </div>
                ) : currentScreen === 'review' ? (
                    <div className="flex-1 flex flex-col justify-center items-center pt-8">
                        <div className="relative mb-6">
                            <div className="w-24 h-24 bg-bg-surface border-2 border-border-subtle rounded-full flex items-center justify-center relative z-10">
                                <ClipboardList className="w-12 h-12 text-white" />
                            </div>
                        </div>

                        <h2 className="text-3xl font-black text-white mb-2 text-center">Review Submission</h2>
                        <p className="text-text-secondary font-bold mb-8 text-center max-w-sm">Please review your progress before confirming your final submission.</p>

                        <div className="bg-bg-surface border-2 border-b-[6px] border-border-subtle/50 rounded-[2rem] p-6 w-full max-w-md shadow-lg mb-8 space-y-4">
                            <div className="flex justify-between items-center py-3 border-b border-border-subtle">
                                <span className="text-text-secondary font-black uppercase text-xs tracking-widest flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-brand-primary"></div> Answered
                                </span>
                                <span className="text-xl font-black text-white">{Object.keys(answers).length}</span>
                            </div>
                            <div className="flex justify-between items-center py-3">
                                <span className="text-text-secondary font-black uppercase text-xs tracking-widest flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-gray-500"></div> Unanswered
                                </span>
                                <span className="text-xl font-black text-white">{activeQuestions.length - Object.keys(answers).length}</span>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                            <button onClick={() => setCurrentScreen('quiz')} className="flex-1 bg-bg-surface text-white border-2 border-border-subtle/50 px-6 py-4 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-bg-surface hover:border-slate-500 transition-all text-center cursor-pointer active:scale-95 shadow-inner border-b-[4px]">
                                RETURN TO TEST
                            </button>
                            <button onClick={endQuiz} disabled={isSubmitting} className="flex-1 bg-semantic-success text-black px-6 py-4 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-emerald-400 transition-all transform hover:-translate-y-1 shadow-[0_5px_15px_rgba(0,255,163,0.3)] text-center flex justify-center items-center gap-2 cursor-pointer active:translate-y-0 border-2 border-emerald-600 border-b-[4px] disabled:opacity-50 disabled:cursor-not-allowed">
                                <Check className="w-5 h-5" /> SUBMIT TEST
                            </button>
                        </div>
                    </div>
                ) : currentScreen === 'result' ? (
                    <div className="flex-1 flex flex-col justify-center items-center pt-8 fade-enter-active">
                        {hasRankedUp && (
                            <div className="bg-brand-primary text-black font-black uppercase tracking-widest text-sm p-4 rounded-xl text-center mb-6 animate-bounce shadow-[0_0_20px_rgba(250,204,21,0.5)]">
                                Level Up! You reached {newRankTitle} and earned {streakFreezesAwarded} Freeze(s)!
                            </div>
                        )}
                        <div className="relative mb-6">
                            {!topic && (
                                <div className="w-24 h-24 bg-semantic-success border-2 border-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(0,255,163,0.3)]">
                                    <Trophy className="w-12 h-12 text-white" />
                                </div>
                            )}
                        </div>
                        {!!topic ? (
                            <>
                                <h2 className="text-4xl md:text-5xl font-black mb-2 tracking-tight text-center drop-shadow-lg">
                                    {(() => {
                                        const acc = backendVerifiedAccuracy || 0;
                                        if (acc >= 90) return <span className="text-semantic-success">Outstanding! Concept Mastered.</span>;
                                        if (acc >= 50) return <span className="text-brand-primary">Great Effort! You're Almost There.</span>;
                                        return <span className="text-white">Keep Going! Practice Makes Perfect.</span>;
                                    })()}
                                </h2>
                                <h3 className="text-sm font-semibold tracking-widest text-text-secondary uppercase mb-8 text-center">{topic.title || topic.name}</h3>
                            </>
                        ) : (
                            <h2 className="text-4xl md:text-5xl font-black text-white mb-8 tracking-tight text-center drop-shadow-lg">
                                Adaptive Practice <span className="text-brand-primary">Complete!</span>
                            </h2>
                        )}

                        {!!topic ? (
                            <div className="bg-bg-surface border border-white/5 rounded-[2rem] p-6 w-full max-w-md shadow-2xl mb-8">
                                <h3 className="text-center font-black text-white text-xl mb-6">Topic Mastery</h3>
                                <div className="flex flex-col gap-4">
                                    <div className="text-xs font-black uppercase tracking-widest text-text-secondary text-center">
                                        Accuracy: {activeQuestions.reduce((count, q, idx) => {
                                            const userAns = answers[idx] || [];
                                            const correctAns = q.ans || [];
                                            const isCorrect = userAns.length === correctAns.length && userAns.every(val => correctAns.includes(val));
                                            return count + (isCorrect ? 1 : 0);
                                        }, 0)} / {activeQuestions.length} Correct
                                    </div>
                                    <div className="w-full h-4 bg-white/10 rounded-full overflow-hidden relative">
                                        <div className="absolute top-0 left-0 h-full bg-brand-primary transition-all duration-[2000ms] shadow-[0_0_15px_rgba(250,204,21,0.8)]" style={{ width: `${backendVerifiedAccuracy || 0}%` }}></div>
                                    </div>
                                    <div className="text-center font-bold text-white text-sm">
                                        {Math.round(backendVerifiedAccuracy || 0)}% Mastery Achieved
                                    </div>
                                </div>
                                <p className="text-center text-xs mt-4 text-gray-400">Keep practicing this warm-up to reach 90% mastery!</p>
                            </div>
                        ) : (
                            <>
                                {/* Unified Adaptive Summary Card */}
                                <Card variant="gamified" className="w-full max-w-md shadow-2xl mb-8 flex flex-col gap-6 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-br from-transparent to-brand-primary/10 opacity-30"></div>
                                    <div className="relative z-10">
                                        
                                        {/* XP Bar */}
                                        <div className="w-full relative mb-6">
                                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-text-secondary mb-2">
                                                <span>Level {newLevel || 1}</span>
                                                <span>Level {(newLevel || 1) + 1}</span>
                                            </div>
                                            <div className="h-3 bg-white/10 border border-border-subtle rounded-full overflow-hidden shadow-inner relative">
                                                <div className="absolute top-0 left-0 h-full bg-slate-600 w-[40%]"></div>
                                                <div className="absolute top-0 left-[40%] h-full bg-brand-primary transition-all duration-[2000ms] ease-out shadow-[0_0_15px_rgba(250,204,21,0.8)]" style={{ width: '25%' }}></div>
                                            </div>
                                            <div className="text-center mt-2 text-xs font-bold text-brand-primary animate-pulse">
                                                +{backendVerifiedXp} XP closer to next level!
                                            </div>
                                        </div>

                                        {/* Breakdown */}
                                        <div className="space-y-3 mb-6 border-b border-border-subtle pb-6">
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-semantic-success/20 flex items-center justify-center border border-semantic-success/30">
                                                        <Check className="w-3 h-3 text-semantic-success" />
                                                    </div>
                                                    <span className="text-white font-black uppercase text-xs tracking-widest">Correct</span>
                                                </div>
                                                <span className="text-sm font-black text-white">+{Math.max(0, backendVerifiedXp - 20)} XP</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                                                        <TrendingUp className="w-3 h-3 text-blue-400" />
                                                    </div>
                                                    <span className="text-white font-black uppercase text-xs tracking-widest">Bonus</span>
                                                </div>
                                                <span className="text-sm font-black text-white">+20 XP</span>
                                            </div>
                                            <div className="flex justify-between items-center pt-3 border-t border-border-subtle/50">
                                                <span className="text-text-secondary font-black uppercase text-xs tracking-widest">Total</span>
                                                <span className="text-xl font-black text-brand-primary drop-shadow-[0_0_10px_rgba(250,204,21,0.3)]">
                                                    {backendVerifiedXp} XP
                                                </span>
                                            </div>
                                        </div>

                                        {/* Chapter Impact */}
                                        {oldChapterMastery !== null && newChapterMastery !== null && (
                                            <div className="text-center">
                                                <h3 className="text-text-secondary font-black uppercase text-[10px] tracking-widest mb-3">Chapter Impact</h3>
                                                <div className="flex items-center justify-center gap-3 mb-3">
                                                    <div className="text-xl sm:text-2xl font-black text-text-muted">
                                                        {Math.round(oldChapterMastery)}%
                                                    </div>
                                                    <ArrowRight className="w-5 h-5 text-text-secondary" />
                                                    <div className="text-3xl sm:text-4xl md:text-5xl font-black text-brand-primary drop-shadow-[0_0_15px_rgba(250,204,21,0.6)]">
                                                        {Math.round(newChapterMastery)}%
                                                    </div>
                                                </div>
                                                <div className="text-sm text-text-secondary leading-relaxed">
                                                    {newChapterMastery > oldChapterMastery ? (
                                                        <span>Great job! You cleared out old mistakes and proved you can handle Medium-difficulty questions.</span>
                                                    ) : newChapterMastery < oldChapterMastery ? (
                                                        <span>Your score dipped slightly. The engine tested you on Hard questions, which means you're close to the top. Time to review those mistakes!</span>
                                                    ) : (
                                                        <span>Holding steady! You need to conquer Hard questions to push past this plateau.</span>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            </>
                        )}

                        {!!topic ? (
                            <div className="flex flex-col gap-4 w-full max-w-md">
                                {(backendVerifiedAccuracy || 0) < 70 ? (
                                    <Button onClick={resetToSetup} variant="primary" className="w-full flex items-center justify-center gap-2">
                                        <RotateCcw className="w-5 h-5" /> PLAY AGAIN
                                    </Button>
                                ) : (
                                    <Button 
                                        onClick={() => {
                                            if (onNextWarmup) onNextWarmup();
                                            else if (onStartAdaptive) onStartAdaptive();
                                            else onBack();
                                        }}
                                        variant="primary"
                                        className="w-full flex items-center justify-center gap-2"
                                    >
                                        {onNextWarmup ? <><Play className="w-5 h-5 fill-black" /> NEXT WARM-UP</> : <><Sword className="w-5 h-5 fill-black" /> TAKE ADAPTIVE QUIZ</>}
                                    </Button>
                                )}
                                <Button onClick={() => { setCurrentScreen('review_answers'); setCurrentQuestionIndex(0); }} variant="outline" className="w-full flex items-center justify-center gap-2 bg-transparent border border-white/10 px-4 py-2 rounded-lg text-text-secondary hover:text-white transition-colors">
                                    <ClipboardList className="w-5 h-5" /> REVIEW ANSWERS
                                </Button>
                                <Button onClick={onBack} variant="ghost" className="w-full flex items-center justify-center gap-2 bg-transparent border-transparent text-text-muted hover:text-white hover:bg-white/5">
                                    <Home className="w-5 h-5" /> BACK TO CHAPTER
                                </Button>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-4 w-full max-w-md">
                                <Button onClick={resetToSetup} variant="primary" className="w-full flex items-center justify-center gap-2">
                                    <RotateCcw className="w-5 h-5" /> PLAY AGAIN
                                </Button>
                                <Button onClick={() => { setCurrentScreen('review_answers'); setCurrentQuestionIndex(0); }} variant="outline" className="w-full flex items-center justify-center gap-2 bg-transparent border border-white/10 px-4 py-2 rounded-lg text-text-secondary hover:text-white transition-colors">
                                    <ClipboardList className="w-5 h-5" /> REVIEW ANSWERS
                                </Button>
                                <Button onClick={onBack} variant="ghost" className="w-full flex items-center justify-center gap-2 bg-transparent border-transparent text-text-muted hover:text-white hover:bg-white/5">
                                    <Home className="w-5 h-5" /> BACK TO CHAPTER
                                </Button>
                            </div>
                        )}
                    </div>
                ) : currentScreen === 'review_answers' && currentQuestion ? (
                    <div className="flex-1 flex flex-col relative w-full pt-4 gap-6">

                        {/* Main Review Area */}
                        <div className="flex-1 flex flex-col relative w-full">
                            <div className="flex justify-between items-start mb-4 sm:mb-8">
                                <div>
                                    <div className="flex items-center gap-2 text-text-secondary text-xs sm:text-sm font-black uppercase tracking-widest mb-2">
                                        Question {currentQuestionIndex + 1} OF {activeQuestions.length}
                                        <span className="text-brand-primary ml-2">{timeSpentMap[currentQuestionIndex] || 0}s spent</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border ${(answers[currentQuestionIndex] || []).length === (currentQuestion.ans || []).length && (answers[currentQuestionIndex] || []).every(a => (currentQuestion.ans || []).includes(a)) ? 'bg-semantic-success/20 text-semantic-success border-semantic-success' : 'bg-semantic-error/20 text-semantic-error border-semantic-error'}`}>
                                            {(answers[currentQuestionIndex] || []).length === (currentQuestion.ans || []).length && (answers[currentQuestionIndex] || []).every(a => (currentQuestion.ans || []).includes(a)) ? 'CORRECT' : !(answers[currentQuestionIndex] || []).length ? 'UNANSWERED' : 'INCORRECT'}
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => setCurrentScreen('result')} className="text-text-secondary hover:text-white transition-colors cursor-pointer p-2 bg-bg-surface border-2 border-border-subtle/50 rounded-xl active:scale-95 shadow-inner">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex-1 pb-10 w-full">
                                {currentQuestion.question_image_url && (
                                    <div className="mb-6 rounded-2xl overflow-hidden border-2 border-border-subtle/50 bg-bg-surface-elevated/50 p-2">
                                        <img src={currentQuestion.question_image_url} alt="Question Reference" className="w-full max-h-[300px] object-contain rounded-xl" />
                                    </div>
                                )}

                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
                                    <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white leading-tight font-sans tracking-tight">
                                        {currentQuestion.q}
                                    </h2>
                                </div>

                                <div className="space-y-4">
                                    {currentQuestion.options.map((opt, idx) => {
                                        const isCorrectAns = (currentQuestion.ans || []).includes(idx);
                                        const isUserAns = (answers[currentQuestionIndex] || []).includes(idx);
                                        
                                        let baseClass = "relative w-full text-left p-4 sm:p-5 rounded-2xl border-2 transition-all flex flex-col gap-3 font-bold text-sm sm:text-base";
                                        if (isCorrectAns) {
                                            baseClass += " bg-semantic-success/10 border-semantic-success text-white border-b-[6px]";
                                        } else if (isUserAns && !isCorrectAns) {
                                            baseClass += " bg-semantic-error/10 border-semantic-error text-white border-b-[6px]";
                                        } else {
                                            baseClass += " bg-bg-surface border-border-subtle/50 text-gray-500 opacity-50";
                                        }

                                        return (
                                            <div key={idx} className={baseClass}>
                                                <div className="flex items-start gap-4">
                                                    <div className={`
                                                        w-6 h-6 sm:w-8 sm:h-8 shrink-0 rounded-full border-2 flex items-center justify-center font-black text-xs sm:text-sm transition-colors
                                                        ${isCorrectAns ? 'bg-semantic-success border-semantic-success text-black' : isUserAns ? 'bg-semantic-error border-semantic-error text-white' : 'border-border-subtle text-gray-500'}
                                                    `}>
                                                        {isCorrectAns ? <Check className="w-4 h-4" /> : isUserAns ? <X className="w-4 h-4" /> : String.fromCharCode(65 + idx)}
                                                    </div>
                                                    <div className="pt-0.5 sm:pt-1 flex-1">
                                                        <span>{opt.text}</span>
                                                    </div>
                                                </div>
                                                {opt.image_url && (
                                                    <div className="mt-3 ml-0 sm:mt-2 sm:ml-12 rounded-xl overflow-hidden border-2 border-border-subtle/30">
                                                        <img src={opt.image_url} alt={`Option ${idx + 1}`} className="w-full max-h-[150px] object-contain bg-bg-surface-elevated/50" />
                                                    </div>
                                                )}
                                                {isUserAns && !isCorrectAns && (
                                                     <div className="absolute top-2 right-4 text-[10px] uppercase font-black tracking-widest text-semantic-error">Your Answer</div>
                                                )}
                                                {isCorrectAns && (
                                                     <div className="absolute top-2 right-4 text-[10px] uppercase font-black tracking-widest text-semantic-success">Correct Answer</div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                                
                                {currentQuestion.explanation && (
                                    <div className="mt-8 bg-bg-surface border-2 border-brand-primary/30 border-b-[4px] rounded-2xl p-6">
                                        <h3 className="text-brand-primary font-black uppercase tracking-widest text-xs mb-2 flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4" /> Explanation
                                        </h3>
                                        <p className="text-gray-300 text-sm leading-relaxed">{currentQuestion.explanation}</p>
                                    </div>
                                )}

                                <div className="flex items-center justify-between mt-8 gap-3 sm:gap-4">
                                    <button 
                                        onClick={prevQuestion}
                                        disabled={currentQuestionIndex === 0}
                                        className="flex items-center justify-center gap-2 px-4 sm:px-6 py-4 rounded-xl bg-bg-surface text-white border-2 border-border-subtle/50 hover:bg-bg-surface-elevated transition-colors font-black uppercase text-xs sm:text-sm border-b-[4px] disabled:opacity-50 flex-1 max-w-[160px]"
                                    >
                                        <ChevronLeft className="w-5 h-5" /> Prev
                                    </button>

                                    <button 
                                        onClick={() => {
                                            if (currentQuestionIndex + 1 < activeQuestions.length) {
                                                setCurrentQuestionIndex(prev => prev + 1);
                                            } else {
                                                setCurrentScreen('result');
                                            }
                                        }}
                                        className="flex items-center justify-center gap-2 px-4 sm:px-6 py-4 rounded-xl bg-brand-primary text-black border-2 border-yellow-600 hover:bg-yellow-400 transition-colors font-black uppercase text-xs sm:text-sm border-b-[4px] flex-1 max-w-[160px]"
                                    >
                                        {currentQuestionIndex + 1 === activeQuestions.length ? 'Finish' : 'Next'} <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>

            {/* Report Modal */}
            {isReportModalOpen && (
                <div className="fixed inset-0 bg-bg-app/90 backdrop-blur-sm flex justify-center items-center p-4 z-[60]">
                    <div className="bg-bg-surface border-2 border-border-subtle/50 border-b-[6px] p-6 md:p-8 rounded-[2rem] w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl text-white">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black flex items-center gap-2 text-brand-primary">
                                <AlertTriangle className="w-6 h-6" />
                                Report Question
                            </h3>
                            <button onClick={() => setIsReportModalOpen(false)} className="text-text-secondary hover:text-white transition-colors cursor-pointer">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        
                        {reportSuccess ? (
                            <div className="bg-semantic-success/20 text-semantic-success p-4 rounded-lg flex items-center gap-3 mb-2">
                                <Check className="w-5 h-5 shrink-0" />
                                <p className="font-semibold">Thank you! Your report has been submitted for review.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {reportError && (
                                    <div className="bg-semantic-error/20 text-semantic-error p-3 rounded-lg text-sm font-semibold flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4 shrink-0" />
                                        {reportError}
                                    </div>
                                )}
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest text-text-secondary mb-2">Issue Type</label>
                                    <select 
                                        value={reportIssueType}
                                        onChange={(e) => setReportIssueType(e.target.value)}
                                        className="w-full bg-bg-surface border-2 border-border-subtle/50 rounded-xl p-3 text-white outline-none focus:border-brand-primary transition-colors shadow-inner"
                                    >
                                        <option value="wrong_answer">Wrong Answer</option>
                                        <option value="incomplete_question">Incomplete Question</option>
                                        <option value="unclear">Unclear or Confusing</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest text-text-secondary mb-2">
                                        Additional Details {reportIssueType !== 'other' && '(Optional)'}
                                    </label>
                                    <textarea 
                                        value={reportComment}
                                        onChange={(e) => setReportComment(e.target.value)}
                                        placeholder="Please provide any extra details to help us fix the issue..."
                                        className="w-full bg-bg-surface border-2 border-border-subtle/50 rounded-xl p-3 text-white outline-none focus:border-brand-primary transition-colors resize-none h-24 shadow-inner"
                                    />
                                </div>
                                
                                <button 
                                    onClick={submitReport}
                                    disabled={isSubmittingReport}
                                    className="w-full bg-semantic-error text-white font-black uppercase tracking-widest py-3 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer shadow-md border-2 border-red-800 border-b-[4px] active:translate-y-0 hover:-translate-y-1"
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

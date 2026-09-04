import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ScrollText, CheckCircle2, ChevronRight, Loader2, AlertTriangle, Target, Calendar, Clock, ArrowLeft } from 'lucide-react';

interface Assignment {
    id: number;
    title: string;
    icon_class: string;
    xp_reward: number;
    target_total: number;
    chapter_id?: number | null;
    difficulty: 'easy' | 'medium' | 'hard';
    due_date: string | null;
    current_progress: number;
    is_completed: boolean;
}

interface AssignmentsViewProps {
    apiBase?: string;
    userSession?: any;
    onNavigate: (route: string) => void;
    onStartQuiz?: (chapterId: number, difficulty: 'easy' | 'medium' | 'hard', type: 'practice' | 'assignment') => void;
}

export default function AssignmentsView({ apiBase = import.meta.env.VITE_API_URL || '', userSession, onNavigate, onStartQuiz }: AssignmentsViewProps) {
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);

    const loadAssignments = async () => {
        setIsLoading(true);
        setFetchError(null);
        try {
            const token = userSession?.token || localStorage.getItem('access_token') || '';
            const res = await fetch(`${apiBase}/assignments`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.detail || 'Failed to fetch assignments');
            }

            const data = await res.json();
            setAssignments(data);
        } catch (err: any) {
            console.error(err);
            setFetchError(err.message || 'Unable to connect to the server at this moment.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadAssignments();
    }, [apiBase]);

    const handleProgressClick = async (assignmentId: number) => {
        try {
            const token = userSession?.token || localStorage.getItem('access_token') || '';
            const res = await fetch(`${apiBase}/assignments/${assignmentId}/progress`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                // simple reload
                loadAssignments();
            }
        } catch (err) {
            console.error('Failed to update progress', err);
        }
    };

    const activeAssignments = assignments.filter(a => !a.is_completed);
    const completedAssignments = assignments.filter(a => a.is_completed);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500 h-full">
                <Loader2 className="animate-spin w-10 h-10 text-voltage-yellow mb-4" />
                <p className="font-medium">Loading assignments...</p>
            </div>
        );
    }

    if (fetchError) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-gray-800/30 rounded-3xl border border-gray-800 border-dashed text-gray-500 h-full mx-4 my-8">
                <AlertTriangle className="w-12 h-12 text-error-red mb-4" />
                <p className="font-bold text-red-400">{fetchError}</p>
                <button onClick={loadAssignments} className="mt-4 px-6 py-2 bg-gray-800 rounded-lg text-white hover:bg-gray-700 transition">Retry</button>
            </div>
        );
    }

    return (
        <div className="px-4 py-8 max-w-5xl mx-auto pb-32 flex-1 w-full">
            <button onClick={() => onNavigate('dashboard')} className="flex items-center gap-2 text-gray-400 hover:text-voltage-yellow text-sm font-medium uppercase tracking-wider mb-6 transition-colors cursor-pointer active:scale-95 group">
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Basecamp
            </button>

            <div className="bg-graphite border border-white/5 rounded-3xl p-6 md:p-8 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-2xl shadow-black/40">
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-voltage-yellow/5 rounded-full blur-3xl pointer-events-none"></div>
                <div className="relative z-10 w-full flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-deep-space flex items-center justify-center border border-white/5 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] relative overflow-hidden group-hover:border-voltage-yellow/30 transition-colors">
                            <div className="absolute inset-0 bg-gradient-to-br from-voltage-yellow/10 to-transparent opacity-50"></div>
                            <div className="text-voltage-yellow relative z-10">
                                <ScrollText className="w-8 h-8 md:w-10 md:h-10" />
                            </div>
                        </div>
                        <div>
                            <div className="flex flex-wrap items-center gap-2 mb-1.5 md:mb-2">
                                <span className="bg-deep-space text-xs font-bold px-3 py-1 rounded-full border border-gray-700 text-gray-300">
                                    {assignments.length} Total
                                </span>
                            </div>
                            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-2 md:mb-1">
                                Assignments
                            </h1>
                            <p className="text-gray-400 text-sm md:text-base font-medium max-w-xl">
                                Complete tasks to earn XP and rewards.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {assignments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-graphite/50 rounded-3xl border border-gray-800 border-dashed text-gray-500">
                    <ScrollText className="w-12 h-12 mb-4 text-gray-600" />
                    <p className="font-bold text-lg">No active assignments</p>
                    <p className="text-sm">You're all caught up! Check back later.</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {activeAssignments.length > 0 && (
                        <div>
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <Target className="w-5 h-5 text-voltage-yellow" /> 
                                Active Quests
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {activeAssignments.map(assignment => (
                                    <AssignmentCard key={assignment.id} assignment={assignment} onProgressClick={handleProgressClick} onStartQuiz={onStartQuiz} />
                                ))}
                            </div>
                        </div>
                    )}

                    {completedAssignments.length > 0 && (
                        <div>
                            <h3 className="text-xl font-bold text-gray-400 mb-4 flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5" /> 
                                Completed
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {completedAssignments.map(assignment => (
                                    <AssignmentCard key={assignment.id} assignment={assignment} onStartQuiz={onStartQuiz} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

const AssignmentCard: React.FC<{ assignment: Assignment; onProgressClick?: (id: number) => void; onStartQuiz?: (chapterId: number, difficulty: 'easy' | 'medium' | 'hard', type: 'practice' | 'assignment') => void }> = ({ assignment, onProgressClick, onStartQuiz }) => {
    const renderIcon = () => {
        if (assignment.is_completed) return <CheckCircle2 className="w-6 h-6 text-success-green" />;
        if (assignment.icon_class && assignment.icon_class.includes('ph-')) {
            return <i className={`${assignment.icon_class} text-2xl`}></i>;
        }
        return <ScrollText className="w-6 h-6" />;
    };

    return (
        <motion.div 
            onClick={() => {
                if (assignment.chapter_id != null && onStartQuiz && !assignment.is_completed) {
                    onStartQuiz(assignment.chapter_id, assignment.difficulty || 'medium', 'assignment');
                }
            }}
            whileHover={!assignment.is_completed ? { y: -2 } : {}}
            className={`text-left p-5 rounded-2xl border ${assignment.is_completed ? 'bg-gray-900/50 border-white/5 cursor-default' : 'bg-graphite border-white/5 shadow-lg shadow-black/20 hover:shadow-[0_8px_30px_rgb(255,215,0,0.15)] hover:border-voltage-yellow/50 cursor-pointer'} flex flex-col justify-between transition-all duration-300`}
        >
            <div className="flex justify-between items-start mb-4">
                <div className="flex gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${assignment.is_completed ? 'bg-gray-800 text-gray-500' : 'bg-gray-800/80 text-voltage-yellow'}`}>
                        {renderIcon()}
                    </div>
                    <div>
                        <h4 className={`font-bold ${assignment.is_completed ? 'text-gray-400 line-through' : 'text-white'}`}>{assignment.title}</h4>
                        <div className="flex items-center gap-3 mt-1">
                            <div className="flex items-center gap-1 text-xs text-gray-400 font-medium capitalize">
                                <Target className="w-3 h-3" />
                                {assignment.difficulty || 'Medium'}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col items-end shrink-0 ml-2">
                    <span className="text-xl font-black text-voltage-yellow">+{assignment.xp_reward} <span className="text-xs text-gray-500 font-bold tracking-widest uppercase">XP</span></span>
                </div>
            </div>

            <div className="mt-2 pt-4 border-t border-gray-800 flex justify-between items-end w-full">
                <div className="flex flex-col gap-1 text-xs text-gray-500 font-medium">
                    <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Assigned: {(assignment as any).created_at ? new Date((assignment as any).created_at).toLocaleDateString() : 'Recently'}</span>
                    </div>
                    {assignment.due_date && (
                        <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-voltage-yellow" />
                            <span className="text-voltage-yellow">Due: {new Date(assignment.due_date).toLocaleDateString()}</span>
                        </div>
                    )}
                </div>
                <div className="flex gap-2">
                    {assignment.chapter_id != null && onStartQuiz && (
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                onStartQuiz(assignment.chapter_id!, assignment.difficulty || 'medium', 'assignment');
                            }}
                            className="bg-voltage-yellow/10 hover:bg-voltage-yellow/20 text-voltage-yellow px-4 py-2 rounded-xl border border-voltage-yellow/30 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 transition-colors active:scale-95"
                        >
                            Take Quiz
                            <ChevronRight className="w-3 h-3" />
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

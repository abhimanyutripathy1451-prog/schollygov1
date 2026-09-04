import React, { useState, useMemo } from 'react';
import { 
    ArrowLeft, Plus, Trash2, BookOpen, ScrollText, 
    ChevronDown, Target, Clock, Filter, Save, X
} from 'lucide-react';

interface ManageAssignmentsViewProps {
    onNavigate: (route: string) => void;
}

// --- MOCK DATA ---
const MOCK_BOARDS = ['CBSE', 'ICSE', 'State Board'];
const MOCK_GRADES = ['9th', '10th', '11th', '12th'];
const MOCK_SUBJECTS = ['Mathematics', 'Science', 'English', 'Social Studies'];
const MOCK_CHAPTERS: Record<string, string[]> = {
    'Mathematics': ['Algebra', 'Geometry', 'Trigonometry', 'Calculus'],
    'Science': ['Physics', 'Chemistry', 'Biology', 'Environmental Science'],
    'English': ['Grammar', 'Literature', 'Writing Skills'],
    'Social Studies': ['History', 'Geography', 'Civics', 'Economics']
};

interface Assignment {
    id: number;
    title: string;
    board: string;
    grade: string;
    subject: string;
    chapter: string;
    difficulty: string;
    xp_reward: number;
    due_date: string;
}

const INITIAL_ASSIGNMENTS: Assignment[] = [
    { id: 1, title: 'Algebra Practice Set 1', board: 'CBSE', grade: '10th', subject: 'Mathematics', chapter: 'Algebra', difficulty: 'Medium', xp_reward: 150, due_date: '2026-08-01' },
    { id: 2, title: 'Physics Laws Quiz', board: 'CBSE', grade: '10th', subject: 'Science', chapter: 'Physics', difficulty: 'Hard', xp_reward: 300, due_date: '2026-08-10' },
];

export default function ManageAssignmentsView({ onNavigate }: ManageAssignmentsViewProps) {
    // Selection States
    const [selectedBoard, setSelectedBoard] = useState('');
    const [selectedGrade, setSelectedGrade] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [selectedChapter, setSelectedChapter] = useState('');

    // Assignments State
    const [assignments, setAssignments] = useState<Assignment[]>(INITIAL_ASSIGNMENTS);

    // Modal State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newAssignment, setNewAssignment] = useState<Partial<Assignment>>({
        difficulty: 'Medium',
        xp_reward: 100,
        due_date: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split('T')[0] // default 7 days from now
    });

    // Derived Data
    const filteredAssignments = useMemo(() => {
        return assignments.filter(a => {
            if (selectedBoard && a.board !== selectedBoard) return false;
            if (selectedGrade && a.grade !== selectedGrade) return false;
            if (selectedSubject && a.subject !== selectedSubject) return false;
            if (selectedChapter && a.chapter !== selectedChapter) return false;
            return true;
        });
    }, [assignments, selectedBoard, selectedGrade, selectedSubject, selectedChapter]);

    const availableChapters = selectedSubject ? MOCK_CHAPTERS[selectedSubject] || [] : [];

    // Handlers
    const handleDelete = (id: number) => {
        if (confirm("Are you sure you want to delete this assignment?")) {
            setAssignments(prev => prev.filter(a => a.id !== id));
        }
    };

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validation check
        if (!newAssignment.title || !selectedBoard || !selectedGrade || !selectedSubject || !selectedChapter) {
            alert("Please complete the hierarchy selection and provide a title.");
            return;
        }

        const assignment: Assignment = {
            id: Date.now(),
            title: newAssignment.title!,
            board: selectedBoard,
            grade: selectedGrade,
            subject: selectedSubject,
            chapter: selectedChapter,
            difficulty: newAssignment.difficulty || 'Medium',
            xp_reward: Number(newAssignment.xp_reward) || 100,
            due_date: newAssignment.due_date!
        };

        setAssignments(prev => [assignment, ...prev]);
        setIsCreateModalOpen(false);
        setNewAssignment({ difficulty: 'Medium', xp_reward: 100, due_date: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split('T')[0] });
    };

    return (
        <div className="w-full min-h-screen bg-deep-space font-sans text-off-white flex flex-col relative pb-32">
            <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 w-full flex-1">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <button onClick={() => onNavigate('dashboard')} className="flex items-center gap-2 text-gray-400 hover:text-voltage-yellow text-sm font-medium uppercase tracking-wider mb-2 transition-colors cursor-pointer group">
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
                        </button>
                        <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
                            <ScrollText className="w-8 h-8 text-voltage-yellow" fill="currentColor" /> Manage Assignments
                        </h1>
                    </div>
                    
                    <button 
                        onClick={() => setIsCreateModalOpen(true)}
                        className="bg-voltage-yellow text-black font-extrabold px-6 py-3 rounded-full hover:bg-[#FFE033] hover:shadow-[0_0_20px_rgba(255,215,0,0.4)] transition-all active:scale-95 flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" /> Create Assignment
                    </button>
                </div>

                {/* Filter Hierarchy */}
                <div className="bg-graphite rounded-3xl p-6 border border-white/5 shadow-2xl mb-8 relative z-10">
                    <div className="flex items-center gap-2 text-gray-400 font-bold uppercase tracking-wider text-sm mb-4">
                        <Filter className="w-4 h-4" /> Filter by Hierarchy
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Board */}
                        <div className="relative">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Board</label>
                            <div className="relative">
                                <select 
                                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white appearance-none focus:outline-none focus:border-voltage-yellow transition-colors font-medium cursor-pointer"
                                    value={selectedBoard}
                                    onChange={(e) => { setSelectedBoard(e.target.value); setSelectedGrade(''); setSelectedSubject(''); setSelectedChapter(''); }}
                                >
                                    <option value="">All Boards</option>
                                    {MOCK_BOARDS.map(b => <option key={b} value={b}>{b}</option>)}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* Grade */}
                        <div className="relative">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Grade</label>
                            <div className="relative">
                                <select 
                                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white appearance-none focus:outline-none focus:border-voltage-yellow transition-colors font-medium cursor-pointer disabled:opacity-50"
                                    value={selectedGrade}
                                    onChange={(e) => { setSelectedGrade(e.target.value); setSelectedSubject(''); setSelectedChapter(''); }}
                                    disabled={!selectedBoard}
                                >
                                    <option value="">All Grades</option>
                                    {MOCK_GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* Subject */}
                        <div className="relative">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Subject</label>
                            <div className="relative">
                                <select 
                                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white appearance-none focus:outline-none focus:border-voltage-yellow transition-colors font-medium cursor-pointer disabled:opacity-50"
                                    value={selectedSubject}
                                    onChange={(e) => { setSelectedSubject(e.target.value); setSelectedChapter(''); }}
                                    disabled={!selectedGrade}
                                >
                                    <option value="">All Subjects</option>
                                    {MOCK_SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* Chapter */}
                        <div className="relative">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Chapter</label>
                            <div className="relative">
                                <select 
                                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white appearance-none focus:outline-none focus:border-voltage-yellow transition-colors font-medium cursor-pointer disabled:opacity-50"
                                    value={selectedChapter}
                                    onChange={(e) => setSelectedChapter(e.target.value)}
                                    disabled={!selectedSubject || availableChapters.length === 0}
                                >
                                    <option value="">All Chapters</option>
                                    {availableChapters.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Assignment List */}
                <div className="space-y-4">
                    {filteredAssignments.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 font-medium bg-graphite rounded-3xl border border-white/5 shadow-2xl">
                            No assignments found for the current selection.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredAssignments.map((assignment) => (
                                <div key={assignment.id} className="bg-graphite rounded-3xl p-6 border border-white/5 shadow-2xl hover:border-voltage-yellow/30 hover:shadow-[0_8px_30px_rgb(255,215,0,0.15)] transition-all flex flex-col justify-between gap-4 relative group">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-deep-space border border-white/5 text-voltage-yellow flex items-center justify-center shrink-0">
                                                <ScrollText className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-white text-lg leading-tight mb-1">{assignment.title}</h4>
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-xs font-bold text-gray-300">{assignment.board} • {assignment.grade}</span>
                                                    <span className="text-[10px] text-gray-500 uppercase tracking-widest">{assignment.subject} / {assignment.chapter}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleDelete(assignment.id)}
                                            className="p-2 text-gray-500 hover:text-error-red hover:bg-red-500/10 rounded-lg transition-colors shrink-0 absolute top-4 right-4 md:opacity-0 md:group-hover:opacity-100"
                                            title="Delete Assignment"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3 mt-2 pt-4 border-t border-gray-800/50">
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 bg-deep-space px-3 py-1.5 rounded-lg border border-white/5">
                                            <Target className="w-3.5 h-3.5 text-voltage-yellow" /> {assignment.difficulty}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-voltage-yellow bg-voltage-yellow/10 px-3 py-1.5 rounded-lg">
                                            {assignment.xp_reward} XP
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 bg-deep-space px-3 py-1.5 rounded-lg border border-white/5">
                                            <Clock className="w-3.5 h-3.5" /> {new Date(assignment.due_date).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Create Assignment Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-graphite w-full max-w-lg rounded-3xl border border-white/5 shadow-2xl overflow-hidden animate-fade-in-up">
                        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-white">Create New Assignment</h3>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleCreate} className="p-6 space-y-4">
                            {(!selectedBoard || !selectedGrade || !selectedSubject || !selectedChapter) && (
                                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-error-red text-sm font-medium mb-4">
                                    Please select Board, Grade, Subject, and Chapter in the background filter before creating an assignment.
                                </div>
                            )}

                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Assignment Title</label>
                                <input 
                                    type="text" 
                                    required
                                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-voltage-yellow transition-colors"
                                    placeholder="e.g. Chapter 1 Quiz"
                                    value={newAssignment.title || ''}
                                    onChange={(e) => setNewAssignment({...newAssignment, title: e.target.value})}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Difficulty</label>
                                    <select 
                                        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white appearance-none focus:outline-none focus:border-voltage-yellow transition-colors cursor-pointer"
                                        value={newAssignment.difficulty}
                                        onChange={(e) => setNewAssignment({...newAssignment, difficulty: e.target.value})}
                                    >
                                        <option value="Easy">Easy</option>
                                        <option value="Medium">Medium</option>
                                        <option value="Hard">Hard</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">XP Reward</label>
                                    <input 
                                        type="number" 
                                        required
                                        min="10"
                                        step="10"
                                        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-voltage-yellow transition-colors"
                                        value={newAssignment.xp_reward || ''}
                                        onChange={(e) => setNewAssignment({...newAssignment, xp_reward: Number(e.target.value)})}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Due Date</label>
                                <input 
                                    type="date" 
                                    required
                                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-voltage-yellow transition-colors"
                                    value={newAssignment.due_date || ''}
                                    onChange={(e) => setNewAssignment({...newAssignment, due_date: e.target.value})}
                                />
                            </div>

                            <div className="pt-6 mt-6 border-t border-gray-800 flex justify-end gap-3">
                                <button 
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-6 py-3 font-bold text-gray-400 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    disabled={!selectedBoard || !selectedGrade || !selectedSubject || !selectedChapter}
                                    className="bg-voltage-yellow text-black font-extrabold px-8 py-3 rounded-full hover:bg-[#FFE033] hover:shadow-[0_0_20px_rgba(255,215,0,0.4)] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    <Save className="w-5 h-5" /> Save Assignment
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            
            <style>{`
            .animate-fade-in-up { animation: fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
            @keyframes fadeInUp {
                0% { opacity: 0; transform: translateY(10px); }
                100% { opacity: 1; transform: translateY(0); }
            }
            `}</style>
        </div>
    );
}

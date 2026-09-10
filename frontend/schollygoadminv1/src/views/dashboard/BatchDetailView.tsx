import React from 'react';
import { ArrowLeft, BookOpen, Calculator, Beaker, Globe, Atom, Book, Languages } from 'lucide-react';

interface Batch {
    id: number;
    board: string;
    grade: string;
    students: number;
}

interface BatchDetailViewProps {
    batch: Batch | null;
    onNavigate: (route: string, data?: any) => void;
}

// Mock mapping of subjects, chapters, and enrollments
const MOCK_SUBJECTS = [
    { id: 1, name: 'Mathematics', icon: Calculator, chapters: 15, students: 120, color: 'text-blue-400' },
    { id: 2, name: 'Physics', icon: Atom, chapters: 12, students: 115, color: 'text-purple-400' },
    { id: 3, name: 'Chemistry', icon: Beaker, chapters: 14, students: 110, color: 'text-emerald-400' },
    { id: 4, name: 'English', icon: Languages, chapters: 20, students: 120, color: 'text-rose-400' },
    { id: 5, name: 'Social Studies', icon: Globe, chapters: 18, students: 95, color: 'text-amber-400' },
];

export default function BatchDetailView({ batch, onNavigate }: BatchDetailViewProps) {
    
    // If no batch is passed, show fallback or redirect
    if (!batch) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-deep-space">
                <p className="text-gray-400 mb-4">No batch selected.</p>
                <button onClick={() => onNavigate('dashboard')} className="text-voltage-yellow font-bold uppercase hover:underline">
                    Return to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen bg-deep-space font-sans text-off-white flex flex-col relative pb-32">
            <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 w-full flex-1">
                
                {/* Header Section */}
                <div className="flex flex-col gap-2 mb-8">
                    <button onClick={() => onNavigate('dashboard')} className="flex items-center gap-2 text-gray-400 hover:text-voltage-yellow text-sm font-medium uppercase tracking-wider mb-2 transition-colors cursor-pointer group w-fit">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
                    </button>
                    
                    <div className="flex items-center gap-3 mt-2">
                        <span className="bg-gray-800 text-gray-300 text-xs font-bold px-3 py-1 rounded-sm tracking-widest uppercase">
                            {batch.board}
                        </span>
                        <span className="bg-voltage-yellow/10 text-voltage-yellow text-xs font-bold px-3 py-1 rounded-sm tracking-widest uppercase border border-voltage-yellow/20">
                            {batch.students} Enrolled
                        </span>
                    </div>
                    
                    <h1 className="text-4xl font-black text-white flex items-center gap-3 mt-2">
                         {batch.board} - {batch.grade}
                    </h1>
                    <p className="text-gray-400 font-medium">Manage and view subjects for this batch.</p>
                </div>

                {/* Subjects Grid */}
                <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
                        <BookOpen className="w-6 h-6 text-voltage-yellow" /> Active Subjects
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {MOCK_SUBJECTS.map((subject) => {
                            const Icon = subject.icon;
                            return (
                                <button 
                                    key={subject.id} 
                                    onClick={() => onNavigate('subject_detail', { batch, subject })}
                                    className="bg-graphite border border-white/5 shadow-lg shadow-black/20 hover:border-voltage-yellow/50 hover:shadow-[0_8px_30px_rgb(255,215,0,0.15)] rounded-3xl p-6 flex flex-col items-center justify-center text-center group cursor-pointer active:scale-95 transition-all duration-300 relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-voltage-yellow"
                                >
                                    <div className="w-16 h-16 rounded-2xl bg-deep-space border border-white/5 flex items-center justify-center group-hover:border-voltage-yellow/30 group-hover:bg-voltage-yellow/10 group-hover:scale-110 transition-all duration-300 mb-4 shadow-inner">
                                        <Icon className={`w-8 h-8 ${subject.color} group-hover:text-voltage-yellow transition-colors`} />
                                    </div>
                                    <h4 className="text-lg font-extrabold text-white group-hover:text-voltage-yellow transition-colors tracking-tight mb-2">
                                        {subject.name}
                                    </h4>
                                    
                                    <div className="flex items-center justify-center gap-3 text-xs font-bold text-gray-500 w-full mt-auto pt-4 border-t border-gray-800/50">
                                        <span>{subject.chapters} Chapters</span>
                                        <span className="w-1 h-1 rounded-full bg-gray-700"></span>
                                        <span>{subject.students} Students</span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

            </div>
        </div>
    );
}

import React, { useState } from 'react';
import { ArrowLeft, BookOpen, Lock, Unlock, UploadCloud, ScrollText, CheckCircle2 } from 'lucide-react';

interface SubjectPayload {
    batch: { id: number; board: string; grade: string; students: number };
    subject: { id: number; name: string; chapters: number; students: number; color: string; icon?: any };
}

interface SubjectDetailViewProps {
    payload: SubjectPayload | null;
    onNavigate: (route: string, data?: any) => void;
}

// Mock chapters data
const MOCK_CHAPTERS = [
    { id: 1, name: 'Real Numbers', isLocked: false, contentCount: 5, assignments: 2 },
    { id: 2, name: 'Polynomials', isLocked: false, contentCount: 4, assignments: 1 },
    { id: 3, name: 'Linear Equations', isLocked: true, contentCount: 0, assignments: 0 },
    { id: 4, name: 'Quadratic Equations', isLocked: true, contentCount: 0, assignments: 0 },
    { id: 5, name: 'Arithmetic Progressions', isLocked: true, contentCount: 0, assignments: 0 },
    { id: 6, name: 'Triangles', isLocked: true, contentCount: 0, assignments: 0 },
];

export default function SubjectDetailView({ payload, onNavigate }: SubjectDetailViewProps) {
    const [chapters, setChapters] = useState(MOCK_CHAPTERS);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // If no payload is passed, show fallback
    if (!payload || !payload.subject || !payload.batch) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-deep-space">
                <p className="text-gray-400 mb-4">No subject selected.</p>
                <button onClick={() => onNavigate('dashboard')} className="text-voltage-yellow font-bold uppercase hover:underline">
                    Return to Dashboard
                </button>
            </div>
        );
    }

    const { batch, subject } = payload;

    const toggleLock = (chapterCode: string) => {
        setChapters(prev => prev.map(ch => 
            ch.id === chapterCode ? { ...ch, isLocked: !ch.isLocked } : ch
        ));
    };

    const handleReleaseAssignment = () => {
        // Mock routing to assignment manager with this context
        onNavigate('manage_assignments');
    };

    return (
        <div className="w-full min-h-screen bg-deep-space font-sans text-off-white flex flex-col relative pb-32">
            
            {/* Toast Notification (Mock UI) */}
            {toastMessage && (
                <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 bg-gray-800 border border-gray-700 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-fade-in-up">
                    <CheckCircle2 className="w-5 h-5 text-voltage-yellow" />
                    <span className="font-medium text-sm">{toastMessage}</span>
                </div>
            )}

            <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 w-full flex-1">
                
                {/* Header Section */}
                <div className="flex flex-col gap-2 mb-8">
                    <button 
                        onClick={() => onNavigate('batch_detail', batch)} 
                        className="flex items-center gap-2 text-gray-400 hover:text-voltage-yellow text-sm font-medium uppercase tracking-wider mb-2 transition-colors cursor-pointer group w-fit"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to {batch.grade} Subjects
                    </button>
                    
                    <div className="flex items-center gap-3 mt-2">
                        <span className="bg-gray-800 text-gray-300 text-xs font-bold px-3 py-1 rounded-sm tracking-widest uppercase">
                            {batch.board} - {batch.grade}
                        </span>
                        <span className={`bg-gray-800 ${subject.color} text-xs font-bold px-3 py-1 rounded-sm tracking-widest uppercase`}>
                            {subject.name}
                        </span>
                    </div>
                    
                    <h1 className="text-4xl font-black text-white flex items-center gap-3 mt-2">
                         {subject.name} Chapters
                    </h1>
                    <p className="text-gray-400 font-medium">Manage content availability and assignments for each chapter.</p>
                </div>

                {/* Chapters List */}
                <div className="space-y-4">
                    {chapters.map((chapter) => (
                        <div key={chapter.id} className={`bg-graphite rounded-3xl p-5 md:p-6 border border-white/5 shadow-2xl hover:border-voltage-yellow/30 hover:shadow-[0_8px_30px_rgb(255,215,0,0.15)] transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 relative group ${chapter.isLocked ? 'opacity-70 grayscale-[30%]' : ''}`}>
                            <div className="flex items-start md:items-center gap-4">
                                <button 
                                    onClick={() => toggleLock(chapter.id)}
                                    className={`p-3 rounded-2xl transition-all shrink-0 border ${chapter.isLocked ? 'bg-gray-800 text-gray-500 hover:bg-gray-700 border-gray-700' : 'bg-voltage-yellow/10 text-voltage-yellow hover:bg-voltage-yellow/20 border-voltage-yellow/20'}`}
                                    title={chapter.isLocked ? "Unlock Chapter" : "Lock Chapter"}
                                >
                                    {chapter.isLocked ? <Lock className="w-6 h-6" /> : <Unlock className="w-6 h-6" />}
                                </button>
                                <div>
                                    <h4 className="font-bold text-white text-lg leading-tight mb-2">{chapter.name}</h4>
                                    <div className="flex flex-wrap items-center gap-3 md:gap-4">
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 bg-deep-space px-2.5 py-1 rounded-md border border-white/5">
                                            <BookOpen className="w-3.5 h-3.5 text-gray-500" /> {chapter.contentCount} Modules
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 bg-deep-space px-2.5 py-1 rounded-md border border-white/5">
                                            <ScrollText className="w-3.5 h-3.5 text-gray-500" /> {chapter.assignments} Assignments
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-3 mt-4 md:mt-0 pt-4 md:pt-0 border-t border-gray-800/50 md:border-t-0">
                                <button 
                                    onClick={() => onNavigate('upload_content', { batch, subject, chapter })}
                                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold rounded-xl transition-colors border border-gray-700 shadow-inner"
                                >
                                    <UploadCloud className="w-4 h-4 text-emerald-400" /> Upload
                                </button>
                                <button 
                                    onClick={handleReleaseAssignment}
                                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold rounded-xl transition-colors border border-gray-700 shadow-inner"
                                >
                                    <ScrollText className="w-4 h-4 text-voltage-yellow" /> Assignments
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

            </div>
            
            <style>{`
            .animate-fade-in-up { animation: fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
            @keyframes fadeInUp {
                0% { opacity: 0; transform: translateY(10px) translateX(-50%); }
                100% { opacity: 1; transform: translateY(0) translateX(-50%); }
            }
            `}</style>
        </div>
    );
}

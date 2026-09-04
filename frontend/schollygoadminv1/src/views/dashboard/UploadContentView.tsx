import React, { useState } from 'react';
import { ArrowLeft, UploadCloud, Link as LinkIcon, FileText, Youtube, CheckCircle2, Trash2, Clock, ChevronRight } from 'lucide-react';

interface UploadPayload {
    batch: { id: number; board: string; grade: string; students: number };
    subject: { id: number; name: string; color: string };
    chapter: { id: number; name: string; isLocked: boolean };
}

interface UploadContentViewProps {
    payload: UploadPayload | null;
    onNavigate: (route: string, data?: any) => void;
}

// Mock uploaded content data
const MOCK_UPLOADED_CONTENT = [
    { id: 1, type: 'study_material', title: 'Chapter Summary & Formulas.pdf', date: '2023-10-15', size: '2.4 MB' },
    { id: 2, type: 'pyq', title: 'CBSE 2022 Question Paper.pdf', date: '2023-10-16', size: '4.1 MB' },
    { id: 3, type: 'youtube', title: 'Introduction to Real Numbers', date: '2023-10-18', url: 'https://youtube.com/watch?v=123' },
];

export default function UploadContentView({ payload, onNavigate }: UploadContentViewProps) {
    const [uploadedContent, setUploadedContent] = useState(MOCK_UPLOADED_CONTENT);
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // If no payload is passed, show fallback
    if (!payload || !payload.chapter) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-deep-space">
                <p className="text-gray-400 mb-4">No context selected.</p>
                <button onClick={() => onNavigate('dashboard')} className="text-voltage-yellow font-bold uppercase hover:underline">
                    Return to Dashboard
                </button>
            </div>
        );
    }

    const { batch, subject, chapter } = payload;

    const showToast = (message: string) => {
        setToastMessage(message);
        setTimeout(() => setToastMessage(null), 3000);
    };

    const handleMockUpload = (type: string) => {
        showToast(`Mock upload initiated for ${type}.`);
    };

    const handleAddYoutube = (e: React.FormEvent) => {
        e.preventDefault();
        if (!youtubeUrl) return;
        
        setUploadedContent([{
            id: Date.now(),
            type: 'youtube',
            title: 'New Video Link',
            date: new Date().toISOString().split('T')[0],
            url: youtubeUrl
        }, ...uploadedContent]);
        
        setYoutubeUrl('');
        showToast('YouTube link added successfully.');
    };

    const handleDelete = (id: number) => {
        setUploadedContent(uploadedContent.filter(c => c.id !== id));
        showToast('Content deleted.');
    };

    return (
        <div className="w-full min-h-screen bg-deep-space font-sans text-off-white flex flex-col relative pb-32">
            
            {/* Toast Notification */}
            {toastMessage && (
                <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 bg-gray-800 border border-gray-700 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-fade-in-up">
                    <CheckCircle2 className="w-5 h-5 text-voltage-yellow" />
                    <span className="font-medium text-sm">{toastMessage}</span>
                </div>
            )}

            <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 w-full flex-1">
                
                {/* Header Section */}
                <div className="flex flex-col gap-2 mb-4">
                    <button 
                        onClick={() => onNavigate('subject_detail', { batch, subject })} 
                        className="flex items-center gap-2 text-gray-400 hover:text-voltage-yellow text-sm font-medium uppercase tracking-wider mb-2 transition-colors cursor-pointer group w-fit"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Chapters
                    </button>
                    
                    <div className="flex flex-wrap items-center gap-2 mt-2 text-xs font-bold uppercase tracking-widest text-gray-400">
                        <span className="bg-gray-800 text-gray-300 px-3 py-1 rounded-sm">{batch.board} - {batch.grade}</span>
                        <ChevronRight className="w-4 h-4" />
                        <span className={`bg-gray-800 ${subject.color} px-3 py-1 rounded-sm`}>{subject.name}</span>
                        <ChevronRight className="w-4 h-4" />
                        <span className="bg-voltage-yellow/10 text-voltage-yellow px-3 py-1 rounded-sm border border-voltage-yellow/20">{chapter.name}</span>
                    </div>
                    
                    <h1 className="text-4xl font-black text-white mt-4">
                         Upload Content
                    </h1>
                    <p className="text-gray-400 font-medium">Add study materials, previous year questions, or YouTube links for {chapter.name}.</p>
                </div>

                {/* Upload Controls Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* Study Materials */}
                    <div className="bg-graphite rounded-3xl p-6 border border-white/5 shadow-2xl flex flex-col gap-4 group">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                                <FileText className="w-5 h-5 text-blue-400" />
                            </div>
                            <h3 className="font-bold text-lg text-white">Study Materials</h3>
                        </div>
                        <p className="text-sm text-gray-400 flex-1">Upload PDF notes, formula sheets, or document summaries.</p>
                        <button 
                            onClick={() => handleMockUpload('Study Materials')}
                            className="w-full py-4 rounded-xl border-2 border-dashed border-gray-700 hover:border-blue-400 hover:bg-blue-400/5 text-gray-400 hover:text-blue-400 transition-colors flex flex-col items-center justify-center gap-2 group-hover:border-blue-400/50"
                        >
                            <UploadCloud className="w-6 h-6" />
                            <span className="text-xs font-bold uppercase tracking-wider">Click to Upload PDF</span>
                        </button>
                    </div>

                    {/* PYQs */}
                    <div className="bg-graphite rounded-3xl p-6 border border-white/5 shadow-2xl flex flex-col gap-4 group">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
                                <FileText className="w-5 h-5 text-purple-400" />
                            </div>
                            <h3 className="font-bold text-lg text-white">PYQs</h3>
                        </div>
                        <p className="text-sm text-gray-400 flex-1">Upload Previous Year Questions or sample test papers.</p>
                        <button 
                            onClick={() => handleMockUpload('PYQs')}
                            className="w-full py-4 rounded-xl border-2 border-dashed border-gray-700 hover:border-purple-400 hover:bg-purple-400/5 text-gray-400 hover:text-purple-400 transition-colors flex flex-col items-center justify-center gap-2 group-hover:border-purple-400/50"
                        >
                            <UploadCloud className="w-6 h-6" />
                            <span className="text-xs font-bold uppercase tracking-wider">Click to Upload PDF</span>
                        </button>
                    </div>

                    {/* YouTube Links */}
                    <div className="bg-graphite rounded-3xl p-6 border border-white/5 shadow-2xl flex flex-col gap-4 group">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                                <Youtube className="w-5 h-5 text-red-400" />
                            </div>
                            <h3 className="font-bold text-lg text-white">YouTube Link</h3>
                        </div>
                        <p className="text-sm text-gray-400 flex-1">Embed a public YouTube video as part of the curriculum.</p>
                        <form onSubmit={handleAddYoutube} className="mt-auto">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <LinkIcon className="w-4 h-4 text-gray-500" />
                                </div>
                                <input 
                                    type="url"
                                    required
                                    placeholder="https://youtube.com/..."
                                    className="w-full bg-deep-space border border-gray-700 text-white text-sm rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-red-400 transition-colors mb-3 placeholder-gray-600"
                                    value={youtubeUrl}
                                    onChange={(e) => setYoutubeUrl(e.target.value)}
                                />
                            </div>
                            <button 
                                type="submit"
                                className="w-full py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold uppercase tracking-wider transition-colors border border-gray-700"
                            >
                                Add Link
                            </button>
                        </form>
                    </div>
                    
                </div>

                {/* Uploaded Content List */}
                <div className="mt-12">
                    <h3 className="text-xl font-bold text-white mb-6">Currently Uploaded ({uploadedContent.length})</h3>
                    
                    <div className="space-y-3">
                        {uploadedContent.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 font-medium bg-graphite rounded-3xl border border-white/5">
                                No content uploaded yet.
                            </div>
                        ) : (
                            uploadedContent.map((item) => (
                                <div key={item.id} className="bg-graphite rounded-2xl p-4 border border-white/5 flex items-center justify-between gap-4 group hover:bg-gray-800/50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                            item.type === 'study_material' ? 'bg-blue-500/10 text-blue-400' :
                                            item.type === 'pyq' ? 'bg-purple-500/10 text-purple-400' :
                                            'bg-red-500/10 text-red-400'
                                        }`}>
                                            {item.type === 'youtube' ? <Youtube className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white text-sm md:text-base leading-tight mb-1">{item.title}</h4>
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-1 text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                    <Clock className="w-3.5 h-3.5" /> {item.date}
                                                </div>
                                                {item.size && (
                                                    <div className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                        • {item.size}
                                                    </div>
                                                )}
                                                {item.url && (
                                                    <a href={item.url} target="_blank" rel="noreferrer" className="text-[10px] md:text-xs font-bold text-voltage-yellow uppercase tracking-wider hover:underline flex items-center gap-1">
                                                        • Open Link <LinkIcon className="w-3 h-3" />
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleDelete(item.id)}
                                        className="p-2 text-gray-500 hover:text-error-red hover:bg-red-500/10 rounded-lg transition-colors shrink-0"
                                        title="Delete Content"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
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

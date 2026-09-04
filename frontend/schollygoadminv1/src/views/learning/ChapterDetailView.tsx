import React, { useState, useEffect } from 'react';
import { 
    ArrowLeft, Coins, Sword, AlertOctagon, Loader2, FolderOpen, Play, 
    ExternalLink, Download, FileText, FileDown, File
} from 'lucide-react';

interface Chapter {
    id: string | number;
    title: string;
    hindiTitle?: string;
    status: string;
    accuracy: number;
    easy_accuracy?: number;
    medium_accuracy?: number;
    hard_accuracy?: number;
    attempts: number;
    name?: string;
}

interface ChapterDetailViewProps {
    subject?: string;
    chapter?: Chapter | null;
    userSession?: any;
    coins?: number;
    apiBase?: string;
    onBack: () => void;
    onStartQuiz: () => void;
}

export default function ChapterDetailView({
    subject = '',
    chapter,
    userSession = {},
    coins = 0,
    apiBase = import.meta.env.VITE_API_URL || '',
    onBack,
    onStartQuiz
}: ChapterDetailViewProps) {
    const [videos, setVideos] = useState<any[]>([]);
    const [materials, setMaterials] = useState<any[]>([]);
    const [pyqs, setPyqs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);

    const openResource = (url?: string) => {
        if (url) window.open(url, '_blank', 'noopener,noreferrer');
    };

    const downloadResource = (url?: string, title?: string) => {
        if (!url) return;
        const a = document.createElement('a');
        a.href = url;
        a.download = title || 'download';
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    useEffect(() => {
        const fetchChapterData = async () => {
            if (!chapter?.id) return;
            setIsLoading(true);
            setFetchError(null);
            
            const headers = {
                'Authorization': `Bearer ${userSession?.token || localStorage.getItem('access_token') || ''}`
            };
            try {
                // Adjust endpoint based on API structure
                const response = await fetch(`${apiBase}/curriculum/chapters/${chapter.id}/resources`, { headers });
                if (!response.ok) throw new Error('Failed to sync resources');
                const data = await response.json();
                
                let vids: any[] = [];
                let mats: any[] = [];
                let pyqList: any[] = [];

                if (Array.isArray(data)) {
                    vids = data.filter((r: any) => r.resource_type === 'video');
                    mats = data.filter((r: any) => r.resource_type === 'material' || r.resource_type === 'document' || r.resource_type === 'pdf');
                    pyqList = data.filter((r: any) => r.resource_type === 'pyq');
                } else {
                    vids = data.videos || (data.data?.videos) || [];
                    mats = data.materials || (data.data?.materials) || [];
                    pyqList = data.pyqs || (data.data?.pyqs) || [];
                }

                // If actual data arrays are found, use them
                setVideos(vids);
                setMaterials(mats);
                setPyqs(pyqList);
                
                setIsLoading(false);
            } catch (err: any) {
                setFetchError(err.message || 'Unable to connect to the server.');
                setIsLoading(false);
            }
        };

        fetchChapterData();
    }, [chapter?.id, apiBase]);

    return (
        <div className="min-h-screen bg-deep-space text-white pb-20 w-full relative z-10">
            {/* Mobile Header */}
            <header className="md:hidden flex items-center justify-between p-4 sticky top-0 bg-deep-space/90 backdrop-blur-md z-30 border-b border-gray-800">
                <div className="flex items-center gap-3 w-full">
                    <button onClick={onBack} className="text-gray-400 hover:text-white transition-colors p-1 -ml-1 cursor-pointer active:scale-95">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div className="flex items-center gap-2 truncate">
                        <span className="font-bold text-lg text-white truncate">{chapter?.title || chapter?.name || 'Chapter Details'}</span>
                    </div>
                </div>
            </header>

            <div className="p-4 md:p-8 max-w-5xl mx-auto w-full flex-1">
                {/* Back Button outside Hero */}
                <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-voltage-yellow text-sm font-medium uppercase tracking-wider mb-6 transition-colors cursor-pointer active:scale-95 group">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Curriculum
                </button>

                {/* Chapter Hero Section */}
                <div className="bg-graphite border border-white/5 rounded-3xl p-6 md:p-8 mb-8 flex flex-col relative overflow-hidden shadow-2xl shadow-black/40">
                    <div className="absolute -right-20 -top-20 w-64 h-64 bg-voltage-yellow/5 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="relative z-10 w-full flex flex-col gap-8">
                        <div className="flex items-center gap-5 w-full">
                            <div className="w-16 h-16 md:w-20 md:h-20 shrink-0 rounded-2xl bg-deep-space flex items-center justify-center border border-white/5 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] relative overflow-hidden transition-colors">
                                <div className="absolute inset-0 bg-gradient-to-br from-voltage-yellow/10 to-transparent opacity-50"></div>
                                <div className="text-voltage-yellow relative z-10">
                                    <FileText className="w-8 h-8 md:w-10 md:h-10" />
                                </div>
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                    <span className="px-2 py-0.5 bg-voltage-yellow/10 text-voltage-yellow text-[10px] font-bold rounded-md border border-transparent uppercase tracking-wider">
                                        {subject}
                                    </span>
                                    <span className="px-2 py-0.5 bg-gray-800 text-gray-400 text-[10px] font-bold rounded-md border border-transparent uppercase tracking-wider">
                                        Module #{chapter?.id || '-'}
                                    </span>
                                </div>
                                <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-tight truncate whitespace-normal">{chapter?.title || chapter?.name || 'Chapter Details'}</h2>
                                {chapter?.hindiTitle && <span className="block text-gray-400 font-semibold mt-1">{chapter.hindiTitle}</span>}
                            </div>
                        </div>

                        <div className="flex flex-row flex-wrap md:flex-nowrap gap-3 md:gap-4 w-full">
                            <div className="bg-deep-space/80 backdrop-blur-sm border border-gray-800 rounded-2xl px-5 py-4 flex-1 min-w-[110px] text-center shadow-inner">
                                <div className="text-white font-black text-2xl md:text-3xl leading-none mb-1.5">{chapter?.attempts || 0}</div>
                                <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Total Attempts</div>
                            </div>
                            <div className="bg-deep-space/80 backdrop-blur-sm border border-gray-800 rounded-2xl px-5 py-4 flex-1 min-w-[110px] text-center shadow-inner">
                                <div className="text-white font-black text-2xl md:text-3xl leading-none mb-1.5">0m</div>
                                <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Time Spent</div>
                            </div>
                            <div className="bg-deep-space/80 backdrop-blur-sm border border-gray-800 rounded-2xl px-5 py-4 flex-1 min-w-[110px] text-center shadow-inner relative overflow-hidden">
                                <div className="absolute inset-0 bg-voltage-yellow/10" style={{ width: `${chapter?.accuracy || 0}%` }}></div>
                                <div className="text-voltage-yellow font-black text-2xl md:text-3xl leading-none mb-1.5 relative z-10">{chapter?.accuracy || 0}%</div>
                                <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider relative z-10">Avg Accuracy</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Enter Arena CTA */}
                <div className="mb-10 p-6 md:p-8 bg-graphite border border-voltage-yellow/40 rounded-3xl shadow-[0_5px_20px_rgba(255,215,0,0.1)] flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden group">
                    <div className="absolute -right-10 -top-10 w-32 h-32 bg-voltage-yellow/10 rounded-full blur-2xl pointer-events-none"></div>
                    <div className="relative z-10 text-center md:text-left">
                        <h3 className="text-2xl font-bold text-white mb-1">Enter the Arena</h3>
                        <p className="text-gray-400 font-medium text-sm">Test your mastery of this chapter and earn XP.</p>
                    </div>
                    <button onClick={onStartQuiz} className="w-full md:w-auto relative z-10 bg-voltage-yellow text-black px-8 py-4 rounded-xl font-bold text-sm hover:bg-yellow-400 transition-all transform hover:-translate-y-1 active:translate-y-0 shadow-[0_5px_15px_rgba(255,215,0,0.2)] flex items-center justify-center gap-2 cursor-pointer active:scale-95">
                        <Sword className="fill-black w-5 h-5" /> START QUIZ
                    </button>
                </div>

                {fetchError && (
                    <div className="py-6 px-8 mb-8 text-center bg-gray-800/30 rounded-2xl border border-gray-800 border-dashed transition-all duration-300">
                        <AlertOctagon className="w-8 h-8 text-error-red mb-3 mx-auto" />
                        <p className="text-red-400 font-bold">{fetchError}</p>
                    </div>
                )}

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                        <Loader2 className="animate-spin w-10 h-10 text-voltage-yellow mb-4" />
                        <p className="font-medium">Syncing databanks...</p>
                    </div>
                ) : (
                    <>
                        {/* EMPTY STATE MESSAGE */}
                        {videos.length === 0 && materials.length === 0 && pyqs.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-graphite border border-gray-800 border-dashed rounded-3xl mb-10 shadow-inner">
                                <div className="w-20 h-20 bg-deep-space rounded-full flex items-center justify-center mb-5 border border-gray-700 shadow-[0_0_15px_rgba(0,0,0,0.3)]">
                                    <FolderOpen className="w-10 h-10 text-gray-500 fill-gray-500" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2">No Resources Found</h3>
                                <p className="text-gray-400 max-w-md font-medium">Your Coaching Center hasn't uploaded any videos, study materials, or practice papers for this module yet. Check back soon!</p>
                            </div>
                        )}

                        {videos.length > 0 && (
                            <div className="mb-10">
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="w-2 h-10 bg-voltage-yellow rounded-full"></div>
                                    <h3 className="text-2xl font-bold text-white">Video Lectures</h3>
                                </div>
                                <div className="space-y-4">
                                    {videos.map((video) => (
                                        <div key={video.id} className="relative p-5 md:p-6 rounded-3xl border transition-all duration-300 overflow-hidden flex flex-col md:flex-row md:items-center gap-5 group bg-graphite border-white/5 shadow-md shadow-black/20 hover:border-voltage-yellow/30 hover:shadow-lg hover:shadow-voltage-yellow/5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shrink-0 transition-all border bg-gray-800 text-gray-400 border-white/5 group-hover:text-voltage-yellow group-hover:border-voltage-yellow/30 shadow-inner">
                                                    <Play className="w-6 h-6 fill-current" />
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-lg md:text-xl font-bold text-white group-hover:text-voltage-yellow transition-colors">{video.title}</h4>
                                                <p className="text-sm font-medium text-gray-500 mt-1">{video.instructor} • {video.duration}</p>
                                            </div>
                                            <div className="mt-4 md:mt-0 w-full md:w-auto">
                                                <button onClick={() => openResource(video.url)} className="w-full md:w-auto bg-deep-space text-gray-300 border border-white/10 px-6 py-3 rounded-xl font-bold text-sm hover:text-voltage-yellow hover:border-voltage-yellow/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 shadow-md shadow-black/30 hover:shadow-lg group-hover:shadow-voltage-yellow/10 focus:outline-none focus:ring-2 focus:ring-voltage-yellow">
                                                    <ExternalLink className="w-4 h-4" /> WATCH
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {materials.length > 0 && (
                            <div className="mb-10">
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="w-2 h-10 bg-voltage-yellow rounded-full"></div>
                                    <h3 className="text-2xl font-bold text-white">Study Materials</h3>
                                </div>
                                <div className="space-y-4">
                                    {materials.map((doc) => (
                                        <div key={doc.id} className="relative p-5 md:p-6 rounded-3xl border transition-all duration-300 overflow-hidden flex flex-col md:flex-row md:items-center gap-5 group bg-graphite border-white/5 shadow-md shadow-black/20 hover:border-voltage-yellow/30 hover:shadow-lg hover:shadow-voltage-yellow/5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shrink-0 transition-all border bg-gray-800 text-gray-400 border-white/5 group-hover:text-voltage-yellow group-hover:border-voltage-yellow/30 shadow-inner">
                                                    {doc.type === 'pdf' ? <FileDown className="w-6 h-6 fill-current" /> : <File className="w-6 h-6 fill-current" />}
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-lg md:text-xl font-bold text-white group-hover:text-voltage-yellow transition-colors">{doc.title}</h4>
                                                <p className="text-sm font-medium text-gray-500 mt-1 uppercase tracking-wider">{doc.size} • {doc.type}</p>
                                            </div>
                                            <div className="mt-4 md:mt-0 w-full md:w-auto">
                                                <button onClick={() => downloadResource(doc.url, doc.title)} className="w-full md:w-auto bg-deep-space text-gray-300 border border-white/10 px-6 py-3 rounded-xl font-bold text-sm hover:text-voltage-yellow hover:border-voltage-yellow/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 shadow-md shadow-black/30 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-voltage-yellow">
                                                    <Download className="w-4 h-4" /> DOWNLOAD
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {pyqs.length > 0 && (
                            <div className="mb-10">
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="w-2 h-10 bg-voltage-yellow rounded-full"></div>
                                    <h3 className="text-2xl font-bold text-white">Previous Year Papers</h3>
                                </div>
                                <div className="space-y-4">
                                    {pyqs.map((pyq) => (
                                        <div key={pyq.id} className="relative p-5 md:p-6 rounded-3xl border transition-all duration-300 overflow-hidden flex flex-col md:flex-row md:items-center gap-5 group bg-graphite border-white/5 shadow-md shadow-black/20 hover:border-voltage-yellow/30 hover:shadow-lg hover:shadow-voltage-yellow/5">
                                            <div className="flex items-center gap-4 relative z-10">
                                                <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg shrink-0 transition-all border bg-gray-800 text-gray-400 border-white/5 group-hover:text-voltage-yellow group-hover:border-voltage-yellow/30 shadow-inner">
                                                    <span>{pyq.year}</span>
                                                </div>
                                            </div>
                                            <div className="flex-1 relative z-10">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="text-lg md:text-xl font-bold transition-colors text-white group-hover:text-voltage-yellow">
                                                        {pyq.title}
                                                    </h4>
                                                </div>
                                                <p className="text-sm font-medium text-gray-500 mt-1 flex items-center gap-1.5">
                                                    Difficulty: <span className={pyq.difficulty === 'High' ? 'text-error-red' : 'text-voltage-yellow'}>{pyq.difficulty}</span>
                                                </p>
                                            </div>
                                            <div className="mt-4 md:mt-0 w-full md:w-auto relative z-10">
                                                <button onClick={() => openResource(pyq.url)} className="w-full md:w-auto bg-deep-space text-gray-300 border border-white/10 px-6 py-3 rounded-xl font-bold text-sm hover:text-voltage-yellow hover:border-voltage-yellow/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 shadow-md shadow-black/30 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-voltage-yellow">
                                                    <FileText className="w-4 h-4" /> VIEW PAPER
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

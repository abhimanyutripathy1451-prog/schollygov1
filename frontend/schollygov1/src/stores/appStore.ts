import { create } from 'zustand';

interface AppState {
    theme: 'dark' | 'light';
    chaptersCache: Record<string, any[]>;
    selectedSubject: string;
    selectedChapter: any | null;
    
    setTheme: (theme: 'dark' | 'light') => void;
    toggleTheme: () => void;
    setChaptersCache: (subject: string, chapters: any[]) => void;
    updateChapterInCache: (subject: string, chapterCode: string, data: Partial<any>) => void;
    setSelectedSubject: (subject: string) => void;
    setSelectedChapter: (chapter: any) => void;
}

// Helper to get initial theme from local storage or default to dark
const getInitialTheme = (): 'dark' | 'light' => {
    const saved = localStorage.getItem('app-theme');
    return (saved === 'dark' || saved === 'light') ? saved : 'dark';
};

export const useAppStore = create<AppState>((set) => ({
    theme: getInitialTheme(),
    chaptersCache: {},
    selectedSubject: 'math',
    selectedChapter: null,

    setTheme: (theme) => {
        localStorage.setItem('app-theme', theme);
        set({ theme });
    },
    
    toggleTheme: () => set((state) => {
        const newTheme = state.theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('app-theme', newTheme);
        return { theme: newTheme };
    }),

    setChaptersCache: (subject, chapters) => set((state) => ({
        chaptersCache: {
            ...state.chaptersCache,
            [subject]: chapters
        }
    })),

    updateChapterInCache: (subject, chapterCode, data) => set((state) => {
        const cache = state.chaptersCache[subject];
        if (!cache) return state;
        
        return {
            chaptersCache: {
                ...state.chaptersCache,
                [subject]: cache.map((ch) => 
                    ch.id === chapterCode ? { ...ch, ...data } : ch
                )
            }
        };
    }),

    setSelectedSubject: (subject) => set({ selectedSubject: subject }),
    setSelectedChapter: (chapter) => set({ selectedChapter: chapter })
}));

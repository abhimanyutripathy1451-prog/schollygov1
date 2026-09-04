import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, Timer, Activity, Coffee, Target, ClipboardCheck, Award } from 'lucide-react';
import { Logo } from '../ui/Logo';

interface AuthLayoutProps {
    children: React.ReactNode;
    title?: React.ReactNode;
    hideMainLogo?: boolean;
    tagline?: string;
}

const BackgroundPattern = () => (
    <div className="absolute inset-0 pointer-events-none opacity-[0.03] text-white z-0">
        <svg width="100%" height="100%">
            <pattern id="edtech-pattern" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
                <g strokeWidth={1.5} stroke="currentColor" fill="none" opacity={0.8}>
                    <g transform="translate(20, 20)"><Brain size={24} /></g>
                    <g transform="translate(100, 50)"><Timer size={24} /></g>
                    <g transform="translate(160, 120)"><Activity size={24} /></g>
                    <g transform="translate(40, 140)"><Coffee size={24} /></g>
                    <g transform="translate(120, 160)"><Target size={24} /></g>
                    <g transform="translate(170, 20)"><ClipboardCheck size={24} /></g>
                    <g transform="translate(80, 100)"><Award size={24} /></g>
                </g>
            </pattern>
            <rect width="100%" height="100%" fill="url(#edtech-pattern)" />
        </svg>
    </div>
);

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, hideMainLogo, tagline }) => {
    // Quotes Slider Logic
    const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
    const quotes = [
        "Learn. Practice. Level Up.",
        "Practice smarter. Build mastery.",
        "Your syllabus. Your practice. Your progress."
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentQuoteIndex(prev => (prev + 1) % quotes.length);
        }, 4000);
        
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center p-4 lg:p-8 bg-bg-app relative overflow-hidden font-sans antialiased text-text-primary">
            <BackgroundPattern />
            
            {/* Ambient Background Glows */}
            <motion.div 
                animate={{ x: [0, 100, 0], y: [0, -50, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] bg-brand-primary/5 rounded-full blur-[120px] pointer-events-none z-0"
            />
            <motion.div 
                animate={{ x: [0, -100, 0], y: [0, 50, 0], scale: [1, 1.3, 1] }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] max-w-[700px] max-h-[700px] bg-ambient-blue/40 rounded-full blur-[150px] pointer-events-none z-0"
            />
            <motion.div 
                animate={{ x: [0, 50, 0], y: [0, 100, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="absolute top-[20%] right-[20%] w-[30vw] h-[30vw] max-w-[400px] max-h-[400px] bg-ambient-purple/40 rounded-full blur-[100px] pointer-events-none z-0"
            />

            <div className="w-full max-w-md flex flex-col items-center justify-center relative z-10 w-full px-4">
                {/* Branding */}
                {!hideMainLogo && (
                    <div className="mb-6 w-full flex justify-center">
                        <Logo className="h-16 sm:h-20 md:h-24 w-auto max-w-full object-contain drop-shadow-xl" />
                    </div>
                )}

                {title && (
                    <div className="mb-6 w-full flex justify-center">
                        {title}
                    </div>
                )}

                {/* Card Content */}
                <div className="w-full relative z-20">
                    {children}
                </div>

                {/* Quotes */}
                <div className="relative h-20 w-full overflow-hidden hidden sm:flex flex-col items-center justify-center mt-8">
                    {tagline ? (
                        <p className="text-sm text-text-muted w-full text-center font-bold tracking-widest uppercase text-text-secondary">
                            {tagline}
                        </p>
                    ) : (
                        <AnimatePresence mode="popLayout">
                            <motion.p
                                key={currentQuoteIndex}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -15, position: 'absolute' }}
                                transition={{ duration: 0.8 }}
                                className="text-sm text-text-muted w-full text-center font-bold tracking-widest uppercase text-text-secondary"
                            >
                                {quotes[currentQuoteIndex]}
                            </motion.p>
                        </AnimatePresence>
                    )}
                </div>
            </div>
        </div>
    );
};

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Logo } from '../ui/Logo';

interface AuthLayoutProps {
    children: React.ReactNode;
    title?: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title }) => {
    // Quotes Slider Logic
    const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
    const quotes = [
        "Empower your coaching. Manage your classes, engage students, and track your growth.",
        "Streamline your teaching step-by-step. Turn your daily efforts into student success.",
        "Grow your business and reach more students. Welcome to the ultimate partner platform."
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentQuoteIndex(prev => (prev + 1) % quotes.length);
        }, 4000);
        
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center p-4 lg:p-8 bg-deep-space relative overflow-hidden font-sans antialiased text-off-white">
            {/* Ambient Background Glows */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-voltage-yellow/5 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-voltage-yellow/5 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="w-full max-w-6xl flex flex-col lg:flex-row items-center gap-12 lg:gap-24 relative z-10">
                {/* Left Column: Branding and Quotes */}
                <div className="flex-1 text-center lg:text-left flex flex-col items-center lg:items-start w-full px-4">
                    <div className="mb-8 w-full flex justify-center lg:justify-start">
                        <Logo className="h-20 sm:h-24 md:h-28 lg:h-32 w-auto max-w-full object-contain drop-shadow-xl" />
                    </div>

                    {title && (
                        <div className="mb-4 w-full">
                            {title}
                        </div>
                    )}

                    <div className="relative h-24 w-full max-w-md overflow-hidden hidden md:block">
                        <AnimatePresence mode="popLayout">
                            <motion.p
                                key={currentQuoteIndex}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -15, position: 'absolute' }}
                                transition={{ duration: 0.8 }}
                                className="text-lg md:text-xl text-gray-400 w-full text-center lg:text-left font-medium"
                            >
                                {quotes[currentQuoteIndex]}
                            </motion.p>
                        </AnimatePresence>
                    </div>
                </div>

                {/* Right Column: Content */}
                <div className="w-full max-w-md relative">
                    {children}
                </div>
            </div>
        </div>
    );
};

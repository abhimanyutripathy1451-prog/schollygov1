import React, { useState } from 'react';
import { X } from 'lucide-react';

interface DynamicNoticeBoardProps {
    icon?: React.ReactNode;
    message: string;
    buttonText?: string;
    onClickAction?: () => void;
    onDismiss?: () => void;
}

export function DynamicNoticeBoard({ icon, message, buttonText, onClickAction, onDismiss }: DynamicNoticeBoardProps) {
    const [isDismissing, setIsDismissing] = useState(false);

    const handleDismiss = () => {
        setIsDismissing(true);
        if (onDismiss) {
            onDismiss();
        }
    };

    return (
        <div className={`flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 bg-gradient-to-r from-brand-primary/15 to-bg-surface border border-border-subtle border-l-4 border-l-brand-primary rounded-card p-4 shadow-[0_4px_20px_rgba(250,204,21,0.1)] w-full relative transition-all duration-500 ease-out overflow-hidden ${isDismissing ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'}`}>
            
            {/* Subtle animated glow in background */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-brand-primary/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none animate-pulse"></div>

            <button 
                onClick={handleDismiss}
                className="absolute top-2 right-2 text-text-muted hover:text-white transition-colors cursor-pointer p-1 z-10"
                aria-label="Dismiss notice"
            >
                <X className="w-5 h-5" />
            </button>

            <div className="flex items-start sm:items-center gap-3 pr-6 sm:pr-0 w-full sm:flex-1 relative z-10">
                {icon && (
                    <div className="shrink-0 mt-0.5 sm:mt-0 w-10 h-10 rounded-full bg-brand-primary/20 flex items-center justify-center shadow-inner border border-brand-primary/30 text-xl text-brand-primary">
                        {icon}
                    </div>
                )}
                <p className="text-white/95 font-semibold text-sm md:text-base leading-relaxed flex-1 tracking-wide">
                    {message}
                </p>
            </div>
            
            {buttonText && onClickAction && (
                <div className="w-full sm:w-auto shrink-0 flex justify-end mt-1 sm:mt-0">
                    <button 
                        onClick={onClickAction}
                        className="bg-brand-primary text-black px-4 py-2 rounded-input font-bold text-xs md:text-sm shadow-[0_2px_10px_rgba(250,204,21,0.3)] hover:bg-brand-hover hover:scale-105 active:scale-95 transition-all w-full sm:w-auto text-center"
                    >
                        {buttonText}
                    </button>
                </div>
            )}
        </div>
    );
}

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
        <div className={`flex items-center justify-between bg-bg-surface border border-border-subtle rounded-card p-3 md:p-4 shadow-premium w-full relative transition-all duration-500 ease-out ${isDismissing ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'}`}>
            <div className="flex items-center gap-3 md:gap-4 flex-1">
                {icon && (
                    <div className="shrink-0 text-xl flex items-center justify-center">
                        {icon}
                    </div>
                )}
                <p className="text-text-secondary font-medium text-sm md:text-base flex-1 pr-8 md:pr-4">
                    {message}
                </p>
            </div>
            
            <div className="flex items-center gap-3 md:gap-4 shrink-0">
                {buttonText && onClickAction && (
                    <button 
                        onClick={onClickAction}
                        className="bg-brand-primary text-black px-4 py-1.5 md:py-2 rounded-input font-bold text-xs md:text-sm shadow-[0_2px_10px_rgba(250,204,21,0.3)] hover:bg-brand-hover hover:scale-105 active:scale-95 transition-all"
                    >
                        {buttonText}
                    </button>
                )}
                <button 
                    onClick={handleDismiss}
                    className="absolute top-2 right-2 md:relative md:top-0 md:right-0 text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                    aria-label="Dismiss notice"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}

import React, { useState, useEffect } from 'react';
import { X, Smartphone, Download } from 'lucide-react';

export default function PWAInstallBanner() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isIos, setIsIos] = useState(false);

    useEffect(() => {
        // Detect iOS
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
        const isInStandaloneMode = ('standalone' in window.navigator) && (window.navigator as any).standalone;
        
        if (isIosDevice && !isInStandaloneMode) {
            setIsIos(true);
            
            // Check if we should show the prompt (e.g. not dismissed recently)
            const dismissed = localStorage.getItem('pwa_ios_dismissed');
            if (!dismissed) {
                // Delay slightly to not overwhelm on first load
                const timer = setTimeout(() => setIsVisible(true), 3000);
                return () => clearTimeout(timer);
            }
        }

        // Check if the prompt was already captured by index.html script (Android/Desktop)
        if ((window as any).deferredPrompt) {
            setDeferredPrompt((window as any).deferredPrompt);
            setIsVisible(true);
        }

        // Event handler for intercepting the default install prompt
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
            (window as any).deferredPrompt = e;
            setIsVisible(true);
        };

        const handleAppInstalled = () => {
            setIsVisible(false);
            setDeferredPrompt(null);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        // CRITICAL: Call prompt() synchronously BEFORE any React state updates!
        // If we call setIsVisible(false) first, React's re-render microtasks can 
        // cause Chrome to lose the "user gesture" context, making the prompt fail silently.
        deferredPrompt.prompt();

        const { outcome } = await deferredPrompt.userChoice;
        
        // Now we can safely hide our custom UI
        setIsVisible(false);
        setDeferredPrompt(null);
    };

    const handleDismissClick = () => {
        setIsVisible(false);
        if (isIos) {
            localStorage.setItem('pwa_ios_dismissed', 'true');
        }
    };

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in pb-8 sm:pb-4">
            <div className="w-full max-w-sm bg-bg-surface border-t border-x sm:border border-border-subtle rounded-t-[2rem] sm:rounded-card p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.8)] relative overflow-hidden animate-slide-up sm:animate-none">
                {/* Decorative glow */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-brand-primary/5 rounded-full blur-2xl pointer-events-none"></div>
                
                <button 
                    onClick={handleDismissClick}
                    className="absolute top-4 right-4 text-text-muted hover:text-text-primary transition-colors cursor-pointer p-1"
                    aria-label="Dismiss"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="flex items-start gap-4 pr-6">
                    <div className="w-12 h-12 rounded-xl bg-bg-app flex items-center justify-center border border-border-subtle shadow-inner shrink-0 text-brand-primary">
                        <Smartphone className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-text-primary font-bold text-lg mb-1 leading-tight">Install SchollyGo</h3>
                        <p className="text-sm text-text-secondary font-medium mb-4 leading-relaxed">
                            Install our free app for a faster, offline experience!
                        </p>
                        
                        {isIos ? (
                            <div className="bg-bg-app p-4 rounded-xl border border-border-subtle shadow-inner mt-2">
                                <p className="text-xs text-text-secondary font-bold leading-relaxed">
                                    To install on iOS:<br/><br/>
                                    1. Tap the <strong className="text-white">Share</strong> icon at the bottom of your screen.<br/>
                                    2. Scroll down and select <strong className="text-brand-primary">"Add to Home Screen"</strong>.
                                </p>
                            </div>
                        ) : (
                            <div className="flex gap-3">
                                <button 
                                    onClick={handleInstallClick}
                                    className="flex-1 bg-brand-primary hover:bg-brand-hover text-[#0a0f1c] font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-[0_0_15px_rgba(250,204,21,0.2)] hover:shadow-[0_0_20px_rgba(250,204,21,0.4)]"
                                >
                                    <Download className="w-4 h-4" />
                                    Install App
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

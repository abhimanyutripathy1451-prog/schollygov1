import React, { useState, useEffect } from 'react';
import { X, Smartphone, Download } from 'lucide-react';

export default function PWAInstallBanner() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check if the prompt was already captured by index.html script
        if ((window as any).deferredPrompt) {
            setDeferredPrompt((window as any).deferredPrompt);
            setIsVisible(true);
        }

        // Event handler for intercepting the default install prompt
        const handleBeforeInstallPrompt = (e: Event) => {
            // Prevent Chrome's default mini-infobar from appearing
            e.preventDefault();
            // Stash the event so it can be triggered later
            setDeferredPrompt(e);
            (window as any).deferredPrompt = e;
            // Update UI to notify the user they can install the PWA
            setIsVisible(true);
        };

        // Event handler for successful installation
        const handleAppInstalled = () => {
            // Hide the custom install banner
            setIsVisible(false);
            // Clear the deferredPrompt variable
            setDeferredPrompt(null);
            // Log success for analytics
            console.log('PWA was successfully installed');
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const handleInstallClick = async () => {
        // Hide the banner immediately
        setIsVisible(false);

        if (!deferredPrompt) {
            return;
        }

        // Show the prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        
        // Log the outcome for analytics purposes
        console.log(`User response to the install prompt: ${outcome}`);

        // We've used the prompt, and can't use it again, throw it away
        setDeferredPrompt(null);
    };

    const handleDismissClick = () => {
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-sm bg-bg-surface border border-border-subtle rounded-card p-5 shadow-[0_0_40px_rgba(0,0,0,0.8)] relative overflow-hidden">
                {/* Decorative glow */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-brand-primary/5 rounded-full blur-2xl pointer-events-none"></div>
                
                <button 
                    onClick={handleDismissClick}
                    className="absolute top-3 right-3 text-text-muted hover:text-text-primary transition-colors cursor-pointer p-1"
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
                        
                        <div className="flex gap-3">
                            <button 
                                onClick={handleInstallClick}
                                className="flex-1 bg-brand-primary hover:bg-brand-hover text-[#0a0f1c] font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-[0_0_15px_rgba(250,204,21,0.2)] hover:shadow-[0_0_20px_rgba(250,204,21,0.4)]"
                            >
                                <Download className="w-4 h-4" />
                                Install App
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

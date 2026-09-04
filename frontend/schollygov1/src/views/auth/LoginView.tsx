import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimation, useReducedMotion } from 'motion/react';
import { useAuthStore } from '../../stores/auth';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { OtpInput } from '../../components/ui/OtpInput';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { AvatarContainer } from '../../components/ui/AvatarContainer';
import { RecoveryModal } from '../../components/ui/RecoveryModal';
import { 
    User as UserIcon, AlertCircle, 
    ArrowRight, ArrowLeft, Loader2, AlertOctagon
} from 'lucide-react';

interface LoginViewProps {
    apiBase?: string;
    prefilledMobile?: string;
    onLoginSuccess: () => void;
    onNavigate: (route: string) => void;
}

type Profile = {
    id: string;
    username: string;
    avatar_seed: string;
};

export default function LoginView({ apiBase = import.meta.env.VITE_API_URL || '', prefilledMobile = '', onLoginSuccess, onNavigate }: LoginViewProps) {
    const { updateUser, fetchUser } = useAuthStore();
    
    // State Variables
    const [step, setStep] = useState<'mobile' | 'profiles' | 'passkey'>('mobile');
    const [mobile, setMobile] = useState(prefilledMobile);
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
    const [passkey, setPasskey] = useState('');
    
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [showForgotPasskey, setShowForgotPasskey] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    
    const mobileRef = useRef<HTMLInputElement>(null);
    const mobileContainerRef = useRef<HTMLDivElement>(null);
    const shakeControls = useAnimation();
    const shouldReduceMotion = useReducedMotion();

    const [mobileTouched, setMobileTouched] = useState(false);
    const [mobileError, setMobileError] = useState('');
    const [passkeyTouched, setPasskeyTouched] = useState(false);

    useEffect(() => {
        if (window.innerWidth > 768 && mobileRef.current && !prefilledMobile && step === 'mobile') {
            mobileRef.current.focus();
        }
    }, [prefilledMobile, step]);

    useEffect(() => {
        if (prefilledMobile) {
            setMobile(prefilledMobile);
            setMobileTouched(true);
        }
    }, [prefilledMobile]);

    // Validation: show error only after blur or explicit submit attempt
    const isMobileInvalid =
        (mobileTouched && mobile.length > 0 && mobile.trim().length < 10)
        || !!mobileError;

    /** Plays a horizontal shake on the input container (respects reduced-motion). */
    const shakeInput = async () => {
        if (shouldReduceMotion) {
            // Reduced-motion fallback: just re-trigger the error border (already handled by isMobileInvalid)
            return;
        }
        await shakeControls.start({
            x: [0, -8, 8, -6, 6, -3, 3, 0],
            transition: { duration: 0.4, ease: 'easeInOut' },
        });
        shakeControls.set({ x: 0 });
    };
    const isPasskeyInvalid = passkeyTouched && (passkey.length > 0 && !/^\d{4}$/.test(passkey));

    useEffect(() => {
        if (step === 'passkey' && passkey.length === 4 && !isLoading) {
            handleLogin();
        }
    }, [passkey, step]);

    const handleLookup = async (e: React.FormEvent) => {
        e.preventDefault();

        // --- Helpful-friction gate (replaces silent disabled button) ---
        if (!mobile || mobile.trim().length < 10) {
            setMobileTouched(true);
            setMobileError('Please enter your complete 10-digit mobile number to continue.');
            mobileRef.current?.focus();
            shakeInput();
            return;
        }

        // Valid — clear any previous field error and proceed
        setMobileError('');
        setMobileTouched(false);

        setErrorMsg('');
        setIsLoading(true);
        try {
            const response = await fetch(`${apiBase}/auth/lookup-profiles`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mobile: mobile.trim() })
            });

            if (!response.ok) {
                throw new Error('Failed to find accounts.');
            }

            const data = await response.json();
            if (data.profiles && data.profiles.length > 0) {
                setProfiles(data.profiles);
                if (data.profiles.length === 1) {
                    setSelectedProfile(data.profiles[0]);
                    setStep('passkey');
                } else {
                    setStep('profiles');
                }
            } else {
                setErrorMsg('No accounts found for this mobile number.');
            }
        } catch (error: any) {
            setErrorMsg(error.message || 'Network error.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogin = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setPasskeyTouched(true);

        if (!/^\d{4}$/.test(passkey) || !selectedProfile) return;

        setErrorMsg('');
        setIsLoading(true);

        try {
            const response = await fetch(`${apiBase}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    identifier: selectedProfile.id,
                    passkey: passkey
                })
            });

            if (!response.ok) {
                let errStr = 'Login failed. Please check your PIN.';
                try {
                    const errData = await response.json();
                    errStr = errData.detail || errStr;
                } catch(err) {} 
                throw new Error(errStr);
            }

            const data = await response.json();
            let rawToken = data.access_token || data.token || data.data?.access_token || '';

            if (!rawToken) {
                throw new Error('Authentication succeeded, but no token was returned.');
            }

            const token = rawToken.replace(/^Bearer\s+/i, '').trim();

            if (rememberMe) {
                localStorage.setItem('token', token);
                sessionStorage.removeItem('token');
            } else {
                sessionStorage.setItem('token', token);
                localStorage.removeItem('token');
            }

            await fetchUser();
            onLoginSuccess();

        } catch (error: any) {
            setErrorMsg(error.message || 'Network error. Please try again.');
        } finally {
            setIsLoading(false);
            setPasskey(''); // Clear on failure
        }
    };

    const renderMobileStep = () => (
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }} transition={{ type: "spring", stiffness: 300, damping: 25 }}>
            <div className="mb-8">
                <h2 className="text-2xl font-black text-text-primary tracking-wide">Welcome Back</h2>
                <p className="text-sm font-semibold text-text-secondary mt-1">Enter your registered mobile number.</p>
            </div>
            <form onSubmit={handleLookup} className="space-y-5">
                <div className="space-y-1">
                    <Input
                        id="mobile"
                        ref={mobileRef}
                        containerRef={mobileContainerRef}
                        label="Mobile Number"
                        value={mobile}
                        onChange={(e) => {
                            // Sanitize only — clear premature errors as the user types
                            const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                            setMobile(val);
                            if (mobileError || (mobileTouched && val.length >= 10)) {
                                setMobileError('');
                                if (val.length >= 10) setMobileTouched(false);
                            }
                        }}
                        onBlur={() => setMobileTouched(true)}
                        type="tel"
                        required
                        placeholder="10-digit mobile number"
                        icon={<UserIcon className={`w-5 h-5 ${isMobileInvalid ? 'text-semantic-error' : 'text-text-muted'}`} />}
                        errorText={
                            mobileError
                                ? mobileError
                                : (isMobileInvalid ? 'Please enter a valid 10-digit number' : undefined)
                        }
                        animate={shakeControls}
                    />
                </div>

                <Button
                    type="submit"
                    isLoading={isLoading}
                    fullWidth
                    className="mt-4"
                >
                    {isLoading ? 'SEARCHING...' : <>CONTINUE <ArrowRight className="w-4 h-4 ml-2" /></>}
                </Button>
            </form>
        </motion.div>
    );

    const renderProfilesStep = () => (
        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ type: "spring", stiffness: 300, damping: 25 }}>
            <div className="mb-8 text-center relative">
                <button 
                    onClick={() => { setStep('mobile'); setErrorMsg(''); }}
                    className="absolute left-0 top-0 p-2 text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="text-2xl font-black text-text-primary tracking-wide mt-1">Who's playing?</h2>
                <p className="text-sm font-semibold text-text-secondary mt-1">Select your profile to continue.</p>
            </div>
            
            <div className="grid grid-cols-2 gap-6 mt-6 justify-center">
                {profiles.map(p => (
                    <div 
                        key={p.id} 
                        onClick={() => { 
                            setSelectedProfile(p); 
                            setStep('passkey'); 
                            setErrorMsg('');
                        }} 
                        className="cursor-pointer text-center group flex flex-col items-center"
                    >
                        <AvatarContainer src={p.avatar_seed} alt={p.username} size="xl" className="group-hover:border-brand-primary group-hover:shadow-[0_0_20px_rgba(250,204,21,0.5)] group-hover:scale-105" />
                        <p className="text-text-primary font-bold mt-3 text-sm group-hover:text-brand-primary transition-colors">{p.username}</p>
                    </div>
                ))}
            </div>
        </motion.div>
    );

    const renderPasskeyStep = () => (
        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ type: "spring", stiffness: 300, damping: 25 }}>
            <div className="mb-6 text-center relative">
                <button 
                    onClick={() => { 
                        if (profiles.length === 1) {
                            setStep('mobile');
                        } else {
                            setStep('profiles'); 
                        }
                        setErrorMsg(''); 
                        setPasskey(''); 
                    }}
                    className="absolute left-0 top-0 p-2 text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <AvatarContainer src={selectedProfile?.avatar_seed} alt={selectedProfile?.username} size="md" className="mx-auto mb-3" />
                <h2 className="text-2xl font-black text-text-primary tracking-wide">Hi, {selectedProfile?.username}!</h2>
                <p className="text-sm font-semibold text-text-secondary mt-1">Enter your Secret PIN 🤫</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-1">
                    <OtpInput
                        value={passkey}
                        onChange={setPasskey}
                        isInvalid={isPasskeyInvalid}
                        onBlur={() => setPasskeyTouched(true)}
                    />
                    
                    <div className="flex items-center mt-4 justify-center cursor-pointer group" onClick={() => setRememberMe(!rememberMe)}>
                        <div className={`w-4 h-4 rounded border flex items-center justify-center mr-2 transition-colors ${rememberMe ? 'bg-brand-primary border-brand-primary' : 'border-border-subtle group-hover:border-slate-400'}`}>
                            {rememberMe && <svg viewBox="0 0 14 14" fill="none" className="w-3 h-3 text-black"><path d="M3 7.5L5.5 10L11 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        </div>
                        <span className="text-xs text-text-secondary font-medium group-hover:text-text-primary transition-colors">Keep me signed in</span>
                    </div>
                </div>

                <Button
                    type="submit"
                    disabled={passkey.length !== 4}
                    isLoading={isLoading}
                    fullWidth
                    className="mt-4"
                >
                    {isLoading ? 'VERIFYING...' : <>CONTINUE <ArrowRight className="w-4 h-4 ml-2" /></>}
                </Button>

                <div className="flex justify-center mt-6">
                    <a href="#" onClick={(e) => { e.preventDefault(); setShowForgotPasskey(true); }} className="text-sm font-bold text-brand-primary hover:text-brand-hover transition-colors">Forgot PIN? 🔑</a>
                </div>
            </form>
        </motion.div>
    );

    return (
        <AuthLayout tagline="YOUR SYLLABUS. YOUR PRACTICE. YOUR PROGRESS.">
            <Card className="w-full shadow-2xl group border-[rgba(255,255,255,0.08)]">
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-brand-primary/5 rounded-full blur-3xl pointer-events-none group-hover:bg-brand-primary/10 transition-colors duration-500"></div>
                
                <AnimatePresence mode="wait">
                    {step === 'mobile' && <div key="step-mobile">{renderMobileStep()}</div>}
                    {step === 'profiles' && <div key="step-profiles">{renderProfilesStep()}</div>}
                    {step === 'passkey' && <div key="step-passkey">{renderPasskeyStep()}</div>}
                </AnimatePresence>

                {/* Error Message Banner */}
                {errorMsg && (
                    <div aria-live="assertive" className="flex items-start gap-3 bg-semantic-error/5 border border-semantic-error/20 p-4 rounded-xl mt-4 animate-shake">
                        <AlertOctagon className="w-6 h-6 text-semantic-error shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-xs font-bold tracking-wider uppercase text-semantic-error">ERROR</p>
                            <p className="text-xs text-red-200 mt-0.5 leading-relaxed font-medium">{errorMsg}</p>
                        </div>
                    </div>
                )}
            </Card>

            {step === 'mobile' && (
                <div className="mt-6 text-center relative z-10">
                    <button 
                        onClick={() => onNavigate('signup')} 
                        className="text-sm font-bold text-text-secondary hover:text-text-primary transition-colors cursor-pointer group"
                    >
                        Don't have an account? <span className="text-brand-primary group-hover:text-[#FDE047] transition-colors">Sign Up</span>
                    </button>
                </div>
            )}

            {/* Multi-Step Recovery Modal */}
            <RecoveryModal 
                isOpen={showForgotPasskey} 
                onClose={() => setShowForgotPasskey(false)} 
                mobile={mobile} 
            />
        </AuthLayout>
    );
}

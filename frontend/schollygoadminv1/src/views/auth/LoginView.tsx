import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuthStore } from '../../stores/auth';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { OtpInput } from '../../components/ui/OtpInput';
import { 
    User as UserIcon, AlertCircle, 
    ArrowRight, Loader2, AlertOctagon, X, ShieldAlert 
} from 'lucide-react';

interface LoginViewProps {
    apiBase?: string;
    prefilledMobile?: string;
    onLoginSuccess: () => void;
    onNavigate: (route: string) => void;
}

export default function LoginView({ apiBase = import.meta.env.VITE_API_URL || '', prefilledMobile = '', onLoginSuccess, onNavigate }: LoginViewProps) {
    const { updateUser, fetchUser } = useAuthStore();
    
    // State Variables
    const [loginId, setLoginId] = useState(prefilledMobile);
    const [passkey, setPasskey] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [showForgotPasskey, setShowForgotPasskey] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const loginIdRef = useRef<HTMLInputElement>(null);
    const passkeyRefs = useRef<(HTMLInputElement | null)[]>([]);
    
    // Dirty Trackers for Field Level Validations
    const [loginIdTouched, setLoginIdTouched] = useState(false);
    const [passkeyTouched, setPasskeyTouched] = useState(false);

    useEffect(() => {
        // Auto-focus logic
        if (window.innerWidth > 768 && loginIdRef.current && !prefilledMobile) {
            loginIdRef.current.focus();
        }
    }, [prefilledMobile]);

    useEffect(() => {
        if (prefilledMobile) {
            setLoginId(prefilledMobile);
            setLoginIdTouched(true);
        }
    }, [prefilledMobile]);

    // Validation
    const isLoginIdInvalid = loginIdTouched && (!loginId || loginId.trim().length === 0);
    const isPasskeyInvalid = passkeyTouched && (passkey.length > 0 && !/^\d{4}$/.test(passkey));
    const isFormValid = !!loginId && loginId.trim().length > 0 && /^\d{4}$/.test(passkey);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoginIdTouched(true);
        setPasskeyTouched(true);

        if (!isFormValid) {
            setErrorMsg('Please resolve field level errors before session initialization.');
            return;
        }

        setErrorMsg('');
        setIsLoading(true);

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            const loginPayload = {
                contact_number: loginId.trim(),
                passkey: passkey
            };

            const response = await fetch(`${apiBase}/api/partners/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(loginPayload),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!response.ok) {
                let errStr = 'Login failed. Please check your credentials.';
                try {
                    const errData = await response.json();
                    errStr = errData.detail || errStr;
                } catch(err) {} // ignore json parse errors
                throw new Error(errStr);
            }

            const data = await response.json();

            let rawToken = data.access_token || data.token ||
                           data.data?.access_token || data.data?.token ||
                           data.user?.access_token || data.user?.token || '';

            if (!rawToken) {
                throw new Error('Authentication succeeded, but no authorization token was found in the API response. Contact Support.');
            }

            const token = rawToken.replace(/^Bearer\s+/i, '').trim();

            if (rememberMe) {
                localStorage.setItem('access_token', token);
                localStorage.setItem('token', token);
            } else {
                sessionStorage.setItem('access_token', token);
                sessionStorage.setItem('token', token);
            }

            // Fetch user session data from API to avoid caching stale data
            await fetchUser();
            
            onLoginSuccess();

        } catch (error: any) {
            setErrorMsg(error.message || 'Network error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout>
            <div className="bg-graphite p-8 rounded-3xl border border-gray-800/50 shadow-2xl relative">
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-white">Partner Portal</h2>
                            <p className="text-sm text-gray-400 mt-1">Enter your Partner credentials to access the dashboard.</p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-5">
                            {/* User ID Input */}
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Partner ID / Email</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <UserIcon className={`w-5 h-5 ${isLoginIdInvalid ? 'text-error-red' : 'text-gray-500'}`} />
                                    </div>
                                    <input
                                        ref={loginIdRef}
                                        value={loginId}
                                        onChange={(e) => {
                                            setLoginIdTouched(true);
                                            setLoginId(e.target.value);
                                        }}
                                        onBlur={() => setLoginIdTouched(true)}
                                        type="text"
                                        required
                                        placeholder="Enter Partner ID or Email"
                                        className={`w-full bg-deep-space border text-white text-sm rounded-xl focus:ring-2 block pl-11 p-3.5 transition-colors outline-none placeholder-gray-600 ${
                                            isLoginIdInvalid
                                            ? 'border-error-red/60 focus:ring-error-red/30 focus:border-error-red shadow-[0_0_10px_rgba(239,68,68,0.1)]'
                                            : 'border-gray-700 focus:ring-voltage-yellow/50 focus:border-voltage-yellow'
                                        }`}
                                    />
                                </div>
                                {isLoginIdInvalid && (
                                    <div className="flex items-center gap-1.5 text-xs text-error-red font-bold px-1 pt-1 animate-fade-in">
                                        <AlertCircle className="w-4 h-4" />
                                        <span>Partner ID / Email cannot be blank</span>
                                    </div>
                                )}
                            </div>

                            {/* Passkey Input */}
                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">4-Digit Passkey</label>
                                    <a href="#" onClick={(e) => { e.preventDefault(); setShowForgotPasskey(true); }} className="text-xs font-bold text-voltage-yellow hover:text-yellow-400 transition-colors">Forgot Passkey?</a>
                                </div>
                                <OtpInput
                                    value={passkey}
                                    onChange={setPasskey}
                                    isInvalid={isPasskeyInvalid}
                                    onBlur={() => setPasskeyTouched(true)}
                                />
                                {isPasskeyInvalid && (
                                    <div className="flex items-center gap-1.5 text-xs text-error-red font-bold px-1 pt-1 animate-fade-in">
                                        <AlertCircle className="w-4 h-4" />
                                        <span>Passkey must be exactly 4 digits</span>
                                    </div>
                                )}
                                
                                {/* Remember Me */}
                                <div className="flex items-center mt-3 ml-1 cursor-pointer w-max group" onClick={() => setRememberMe(!rememberMe)}>
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center mr-2 transition-colors ${rememberMe ? 'bg-voltage-yellow border-voltage-yellow' : 'border-gray-600 group-hover:border-gray-400'}`}>
                                        {rememberMe && <svg viewBox="0 0 14 14" fill="none" className="w-3 h-3 text-black"><path d="M3 7.5L5.5 10L11 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                    </div>
                                    <span className="text-xs text-gray-400 font-medium group-hover:text-white transition-colors">Keep me signed in</span>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isLoading || !isFormValid}
                                className="w-full bg-voltage-yellow text-black font-bold text-sm rounded-xl px-5 py-4 mt-4 text-center hover:bg-yellow-400 transition-all active:translate-y-0 hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none flex justify-center items-center gap-2 shadow-[0_0_15px_rgba(255,215,0,0.2)] hover:shadow-[0_0_25px_rgba(255,215,0,0.4)] cursor-pointer active:scale-95"
                            >
                                {!isLoading ? (
                                    <span className="flex items-center gap-2">ACCESS DASHBOARD <ArrowRight className="w-4 h-4" /></span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        AUTHENTICATING...
                                    </span>
                                )}
                            </button>

                            {/* Error Message Banner */}
                            {errorMsg && (
                                <div className="flex items-start gap-3 bg-red-950/40 border border-error-red/50 p-4 rounded-xl mt-4 animate-shake shadow-[0_0_20px_rgba(239,68,68,0.15)]">
                                    <AlertOctagon className="w-6 h-6 text-error-red shrink-0 mt-0.5 animate-pulse" />
                                    <div className="flex-1">
                                        <p className="text-xs font-bold tracking-wider uppercase text-error-red">SESSION ABORTED</p>
                                        <p className="text-xs text-red-200 mt-0.5 leading-relaxed font-medium">{errorMsg}</p>
                                    </div>
                                </div>
                            )}
                        </form>
                    </div>


            {/* Offline Forgot Passkey Modal */}
            <AnimatePresence>
                {showForgotPasskey && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                    >
                        <motion.div 
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 20, opacity: 0 }}
                            className="bg-graphite border border-gray-800/50 rounded-3xl p-8 max-w-sm w-full text-center shadow-[0_0_50px_rgba(255,215,0,0.15)] relative"
                        >
                            <button onClick={() => setShowForgotPasskey(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white cursor-pointer active:scale-95">
                                <X className="w-6 h-6" />
                            </button>

                            <div className="w-16 h-16 bg-voltage-yellow/10 border border-voltage-yellow/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <ShieldAlert className="w-8 h-8 text-voltage-yellow" fill="currentColor" />
                            </div>

                            <h2 className="text-xl font-black text-white mb-2">Account Locked?</h2>
                            <p className="text-gray-400 text-sm leading-relaxed mb-6">
                                Contact the Super Admin or Support team to reset your <strong className="text-voltage-yellow">Partner PIN</strong> and restore access!
                            </p>

                            <button onClick={() => setShowForgotPasskey(false)} className="w-full bg-deep-space hover:bg-gray-800 text-white font-bold text-sm rounded-xl px-5 py-4 transition-all border border-gray-700 cursor-pointer active:scale-95">
                                Got it, Thanks!
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </AuthLayout>
    );
}

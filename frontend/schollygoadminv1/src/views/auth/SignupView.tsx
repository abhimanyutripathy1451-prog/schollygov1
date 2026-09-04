import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
    UserCircle, Phone, ArrowRight, ArrowLeft, Loader2, CheckCircle, 
    XCircle, AlertCircle, CheckSquare, Users,
    AtSign, Gift, Check
} from 'lucide-react';
import { Logo } from '../../components/ui/Logo';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { OtpInput } from '../../components/ui/OtpInput';

interface SignupViewProps {
    apiBase?: string;
    onNavigate: (view: 'login' | 'signup' | 'forgot-password') => void;
    onToggleLogin: (mobile?: string) => void;
}

export default function SignupView({ apiBase = import.meta.env.VITE_API_URL || '', onNavigate, onToggleLogin }: SignupViewProps) {
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    
    // Success Modal state
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [generatedRollNumber, setGeneratedRollNumber] = useState('');

    // Step 1: Personal
    const [fullName, setFullName] = useState('');
    const [grade, setGrade] = useState('');
    const [board, setBoard] = useState('CGBSE');

    // Step 2: Guardian & Mobile
    const [parentName, setParentName] = useState('');
    const [mobile, setMobile] = useState('');

    // Step 3: Security
    const [userId, setUserId] = useState('');
    const [passkey, setPasskey] = useState('');
    const [inviteCode, setInviteCode] = useState('');

    const [userIdStatus, setUserIdStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
    const [userIdSuggestions, setUserIdSuggestions] = useState<string[]>([]);
    const checkUserIdTimeout = useRef<NodeJS.Timeout | null>(null);

    // Clear errors on change
    useEffect(() => {
        setErrorMsg('');
    }, [fullName, parentName, mobile, userId, passkey]);

    const verifyUserIdAvailability = (idToCheck: string) => {
        if (!idToCheck || idToCheck.length < 3) {
            setUserIdStatus('idle');
            setUserIdSuggestions([]);
            return;
        }

        setUserIdStatus('checking');

        if (checkUserIdTimeout.current) clearTimeout(checkUserIdTimeout.current);

        checkUserIdTimeout.current = setTimeout(async () => {
            try {
                const response = await fetch(`${apiBase}/auth/check-nickname?username=${idToCheck}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.available) {
                        setUserIdStatus('available');
                        setUserIdSuggestions([]);
                    } else {
                        setUserIdStatus('taken');
                        setUserIdSuggestions([
                            `${idToCheck}x`,
                            `${idToCheck}_pro`,
                            `${idToCheck}${Math.floor(Math.random() * 99)}`
                        ]);
                    }
                } else {
                    setUserIdStatus('error');
                    setUserIdSuggestions([]);
                }
            } catch (error) {
                setUserIdStatus('error');
            }
        }, 600);
    };

    const handleUserIdInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
        setUserId(val);
        verifyUserIdAvailability(val);
    };

    const handleMobileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
        setMobile(val);
    };

    const handleStep1Submit = (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');
        setStep(2);
    };

    const handleSendOTP = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (mobile.length !== 10 || !parentName) return;

        setIsLoading(true);
        setErrorMsg('');

        try {
            const res = await fetch(`${apiBase}/auth/check-mobile?mobile=${mobile}`);
            if (res.ok) {
                const data = await res.json();
                if (!data.available) {
                    setErrorMsg("Mobile number is already registered. Please log in.");
                    setIsLoading(false);
                    return;
                }
            } else {
                throw new Error("Failed to check mobile availability");
            }
        } catch (error: any) {
            console.error("Backend validation error:", error);
            setErrorMsg("Could not verify mobile number. Check connection.");
            setIsLoading(false);
            return;
        }

        setIsLoading(false);
        setStep(3);
    };

    const completeSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!fullName || !parentName || userIdStatus !== 'available' || !grade || !board || passkey.length !== 4) {
            setErrorMsg('Please ensure all fields are correctly filled and valid.');
            return;
        }

        setIsLoading(true);
        setErrorMsg('');

        try {
            const signupPayload = {
                name: fullName,
                nickName: userId,
                mobile: mobile,
                gender: "Other",
                board: board,
                grade: String(grade),
                school: "Not Specified",
                parentName: parentName,
                parentMobile: mobile,
                parentEmail: "parent@example.com",
                passkey: passkey,
                inviteCode: inviteCode ? inviteCode.trim() : undefined,
                centerCode: inviteCode ? inviteCode.trim() : undefined
            };

            const res = await fetch(`${apiBase}/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(signupPayload)
            });

            if (!res.ok) {
                const errResponse = await res.json();
                if (res.status === 422 && Array.isArray(errResponse.detail)) {
                    const messages = errResponse.detail.map((err: any) => `${err.loc[err.loc.length - 1]}: ${err.msg}`).join(' | ');
                    throw new Error(`Validation Error: ${messages}`);
                }
                throw new Error(errResponse.detail || 'Failed to create account.');
            }

            const data = await res.json();
            setGeneratedRollNumber(data.roll_number || `${new Date().getFullYear()}${Math.floor(1000 + Math.random()*9000)}`);
            setShowSuccessModal(true);

        } catch (error: any) {
            setErrorMsg(error.message || 'An error occurred during final setup.');
        } finally {
            setIsLoading(false);
        }
    };

    const selectSuggestion = (sug: string) => {
        setUserId(sug);
        verifyUserIdAvailability(sug);
    };

    return (
        <AuthLayout title={<h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-4">Join <span className="text-voltage-yellow">schollygo</span></h1>}>
            <div className="bg-graphite p-8 rounded-3xl border border-gray-800/50 shadow-2xl relative overflow-hidden flex flex-col justify-between" style={{ minHeight: '480px' }}>
                <div>
                    {/* 3-Step Progress Indicator */}
                    <div className="flex items-center gap-2 mb-8">
                        <div className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${step >= 1 ? 'bg-voltage-yellow' : 'bg-gray-700'}`}></div>
                        <div className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${step >= 2 ? 'bg-voltage-yellow' : 'bg-gray-700'}`}></div>
                        <div className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${step >= 3 ? 'bg-voltage-yellow' : 'bg-gray-700'}`}></div>
                    </div>

                    <div className="relative flex-1">
                        <AnimatePresence mode="wait">
                            {/* STEP 1: Personal Details */}
                            {step === 1 && (
                                <motion.div 
                                    key="step1"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}
                                    className="w-full"
                                >
                                    <h2 className="text-2xl font-bold text-white mb-2">Personal Details</h2>
                                    <p className="text-sm text-gray-400 mb-6">Let's start with your academic info.</p>

                                    <form onSubmit={handleStep1Submit} className="space-y-4">
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <UserCircle className="w-5 h-5 text-gray-500" />
                                            </div>
                                            <input
                                                value={fullName} onChange={e => setFullName(e.target.value)}
                                                type="text" required
                                                className="w-full bg-deep-space border border-gray-700 text-off-white text-sm rounded-xl focus:ring-2 focus:ring-voltage-yellow/50 focus:border-voltage-yellow block pl-11 p-3.5 transition-all outline-none"
                                                placeholder="Student's Full Name"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 mt-4">
                                            <div className="relative">
                                                <select 
                                                    value={grade} onChange={e => setGrade(e.target.value)} required 
                                                    className="w-full h-12 bg-deep-space border border-gray-700 text-off-white text-sm rounded-xl focus:ring-2 focus:ring-voltage-yellow/50 focus:border-voltage-yellow block px-3 transition-all outline-none font-medium appearance-none cursor-pointer active:scale-95"
                                                >
                                                    <option value="" disabled>Select Grade</option>
                                                    <option value="9">9th Grade</option>
                                                    <option value="10">10th Grade</option>
                                                    <option value="11">11th Grade</option>
                                                    <option value="12">12th Grade</option>
                                                </select>
                                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                                                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                                                </div>
                                            </div>

                                            <div className="bg-deep-space border border-gray-700 rounded-xl p-1 flex justify-between items-center h-12">
                                                <button type="button" onClick={() => setBoard((grade === '11' || grade === '12') ? 'CGBSESCIENCE' : 'CGBSE')} className={`flex-1 h-full text-xs font-bold rounded-lg transition-colors cursor-pointer active:scale-95 ${board === 'CGBSE' || board === 'CGBSESCIENCE' ? 'bg-voltage-yellow text-black' : 'text-gray-400 hover:text-white'}`}>CG Board</button>
                                                <button type="button" onClick={() => setBoard('Others')} className={`flex-1 h-full text-xs font-bold rounded-lg transition-colors cursor-pointer active:scale-95 ${board === 'Others' ? 'bg-voltage-yellow text-black' : 'text-gray-400 hover:text-white'}`}>Others</button>
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={!fullName || !grade || !board}
                                            className="w-full bg-voltage-yellow text-black font-bold text-sm rounded-xl px-5 py-4 mt-6 text-center hover:bg-yellow-400 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex justify-center items-center gap-2 cursor-pointer active:scale-95 shadow-[0_0_15px_rgba(255,215,0,0.2)]"
                                        >
                                            NEXT STEP
                                            <ArrowRight className="w-5 h-5" />
                                        </button>
                                    </form>
                                </motion.div>
                            )}

                            {/* STEP 2: Guardian Details & OTP */}
                            {step === 2 && (
                                <motion.div 
                                    key="step2"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}
                                    className="w-full"
                                >
                                    <div className="flex items-center gap-3 mb-2">
                                        <button type="button" onClick={() => { setStep(1); setErrorMsg(''); }} className="text-gray-400 hover:text-white transition-colors cursor-pointer active:scale-95">
                                            <ArrowLeft className="w-5 h-5" />
                                        </button>
                                        <h2 className="text-2xl font-bold text-white">Guardian Details</h2>
                                    </div>
                                    <p className="text-sm text-gray-400 mb-6">Enter parent details to verify the account.</p>

                                    <form onSubmit={handleSendOTP} className="space-y-4">
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <Users className="w-5 h-5 text-gray-500" />
                                            </div>
                                            <input
                                                value={parentName} onChange={e => setParentName(e.target.value)}
                                                type="text" required
                                                className="w-full bg-deep-space border border-gray-700 text-off-white text-sm rounded-xl focus:ring-2 focus:ring-voltage-yellow/50 focus:border-voltage-yellow block pl-11 p-3.5 transition-all outline-none disabled:opacity-50"
                                                placeholder="Parent's Full Name"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                    <Phone className="w-5 h-5 text-gray-500" />
                                                </div>
                                                <span className="absolute inset-y-0 left-10 flex items-center text-gray-400 text-sm pointer-events-none ml-1">+91</span>
                                                <input
                                                    value={mobile} onChange={handleMobileInput}
                                                    type="text" inputMode="numeric" maxLength={10} required
                                                    className="w-full bg-deep-space border border-gray-700 text-off-white text-sm rounded-xl focus:ring-2 focus:ring-voltage-yellow/50 focus:border-voltage-yellow block p-3.5 transition-all outline-none disabled:opacity-50"
                                                    style={{ paddingLeft: '4.5rem' }}
                                                />
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={mobile.length !== 10 || !parentName || isLoading}
                                            className="w-full bg-voltage-yellow text-black font-bold text-sm rounded-xl px-5 py-4 mt-6 text-center hover:bg-yellow-400 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 shadow-[0_0_15px_rgba(255,215,0,0.2)] cursor-pointer active:scale-95"
                                        >
                                            {!isLoading ? 'CONTINUE' : <Loader2 className="w-5 h-5 animate-spin" />}
                                        </button>
                                    </form>
                                </motion.div>
                            )}

                            {/* STEP 3: Security Details */}
                            {step === 3 && (
                                <motion.div 
                                    key="step3"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}
                                    className="w-full"
                                >
                                    <div className="flex items-center gap-3 mb-2">
                                        <button type="button" onClick={() => { setStep(2); setErrorMsg(''); }} className="text-gray-400 hover:text-white transition-colors cursor-pointer active:scale-95">
                                            <ArrowLeft className="w-5 h-5" />
                                        </button>
                                        <h2 className="text-2xl font-bold text-white">Secure Account</h2>
                                    </div>
                                    <p className="text-sm text-gray-400 mb-6">Create your login credentials.</p>

                                    <form onSubmit={completeSignup} className="space-y-4" autoComplete="off">
                                        <div>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                    <AtSign className={`w-5 h-5 transition-colors ${userIdStatus === 'available' ? 'text-success-green' : userIdStatus === 'taken' ? 'text-error-red' : 'text-voltage-yellow'}`} />
                                                </div>
                                                <input
                                                    name="new-username-field"
                                                    value={userId} onChange={handleUserIdInput} type="text" required autoComplete="new-password"
                                                    className={`w-full bg-deep-space border text-off-white text-sm rounded-xl focus:ring-2 block pl-11 pr-11 p-3.5 transition-all outline-none ${
                                                        userIdStatus === 'available' ? 'border-success-green/50 focus:ring-success-green/50 focus:border-success-green shadow-[0_0_10px_rgba(0,255,163,0.1)]' :
                                                        userIdStatus === 'taken' ? 'border-error-red/60 focus:ring-error-red/30 focus:border-error-red shadow-[0_0_10px_rgba(239,68,68,0.1)]' :
                                                        'border-gray-700 focus:ring-voltage-yellow/50 focus:border-voltage-yellow'
                                                    }`}
                                                    placeholder="Username"
                                                />
                                                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                                    {userIdStatus === 'checking' && <Loader2 className="w-5 h-5 animate-spin text-voltage-yellow" />}
                                                    {userIdStatus === 'available' && <CheckCircle className="w-5 h-5 text-success-green" />}
                                                    {userIdStatus === 'taken' && <XCircle className="w-5 h-5 text-error-red" />}
                                                </div>
                                            </div>

                                            <div className="min-h-6 mt-1.5 px-1">
                                                <AnimatePresence>
                                                    {userIdStatus === 'available' && (
                                                        <motion.div initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} className="text-xs text-success-green flex items-center gap-1 font-medium">
                                                            <CheckSquare className="w-3 h-3" /> Valid and available
                                                        </motion.div>
                                                    )}
                                                    {userIdStatus === 'taken' && (
                                                        <motion.div initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} className="flex flex-col gap-2">
                                                            <span className="text-xs text-error-red flex items-center gap-1 font-medium">
                                                                <AlertCircle className="w-3 h-3" /> ID taken. Try these:
                                                            </span>
                                                            <div className="flex flex-wrap gap-2">
                                                                {userIdSuggestions.map(sug => (
                                                                    <button
                                                                        key={sug} type="button" onClick={() => selectSuggestion(sug)}
                                                                        className="text-xs font-medium bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700 hover:border-gray-500 border border-gray-700 px-3 py-1 rounded-lg transition-all cursor-pointer active:scale-95"
                                                                    >
                                                                        @{sug}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </div>

                                        <div className="mt-2">
                                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">4-Digit Passkey</label>
                                            <OtpInput value={passkey} onChange={setPasskey} />
                                        </div>

                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <Gift className="w-5 h-5 text-voltage-yellow" />
                                            </div>
                                            <input
                                                value={inviteCode} onChange={e => setInviteCode(e.target.value)} type="text"
                                                className="w-full bg-deep-space border border-dashed border-gray-600 text-off-white text-sm rounded-xl focus:ring-2 focus:ring-voltage-yellow/50 focus:border-voltage-yellow block pl-11 p-3.5 transition-all outline-none placeholder-gray-500 uppercase"
                                                placeholder="Invite/Center Code (Optional)"
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={isLoading || userIdStatus !== 'available' || passkey.length !== 4}
                                            className="w-full bg-voltage-yellow text-black font-bold text-sm rounded-xl px-5 py-4 mt-6 text-center hover:bg-yellow-400 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-40 disabled:cursor-not-allowed flex justify-center items-center gap-2 shadow-[0_0_15px_rgba(255,215,0,0.2)] cursor-pointer active:scale-95"
                                        >
                                            {!isLoading ? (
                                                <span>ENTER SCHOLLYGO</span>
                                            ) : (
                                                <span className="flex items-center gap-2">
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                    CREATING AVATAR...
                                                </span>
                                            )}
                                        </button>
                                    </form>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {errorMsg && (
                    <div className="mt-4 relative text-error-red text-xs text-center bg-error-red/10 border border-error-red/20 py-2 px-3 rounded-lg animate-pulse z-20 leading-relaxed">
                        {errorMsg}
                    </div>
                )}
            </div>

            <p className="text-center text-gray-400 text-sm mt-8">
                Already have an account?{' '}
                <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('login'); }} className="font-bold text-voltage-yellow hover:text-yellow-400 hover:underline transition-all cursor-pointer active:scale-95">
                    Log In Here
                </a>
            </p>

            {/* Success Overlay Modal */}
            <AnimatePresence>
                {showSuccessModal && (
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
                            className="bg-graphite border border-gray-800/50 rounded-3xl p-8 max-w-sm w-full text-center shadow-[0_0_50px_rgba(255,215,0,0.15)]"
                        >
                            <div className="w-20 h-20 bg-success-green/10 border border-success-green/30 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(0,255,163,0.2)]">
                                <Check className="w-10 h-10 text-success-green" />
                            </div>
                            <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Access Granted!</h2>
                            <p className="text-gray-400 text-sm mb-6">Your profile has been created successfully. Welcome to schollygo.</p>

                            <div className="bg-deep-space border border-gray-700 rounded-xl p-4 mb-8">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">Assigned Roll Number</p>
                                <p className="text-2xl font-black text-voltage-yellow tracking-wider font-mono">{generatedRollNumber}</p>
                            </div>

                            <button
                                onClick={() => onToggleLogin(mobile)}
                                className="w-full bg-voltage-yellow text-black font-bold text-sm rounded-xl px-5 py-4 transition-all hover:bg-yellow-400 hover:-translate-y-0.5 active:translate-y-0 shadow-[0_0_15px_rgba(255,215,0,0.2)] cursor-pointer active:scale-95 uppercase tracking-wider flex items-center justify-center gap-2"
                            >
                                Proceed to Login
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </AuthLayout>
    );
}

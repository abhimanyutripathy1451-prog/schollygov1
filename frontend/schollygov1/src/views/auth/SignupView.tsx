import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { useAuthStore } from '../../stores/auth';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { OtpInput } from '../../components/ui/OtpInput';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { AvatarContainer } from '../../components/ui/AvatarContainer';
import { 
    User as UserIcon, AlertCircle, ArrowRight, ArrowLeft, Loader2,
    BookOpen, Users, Shield, Check, RefreshCw
} from 'lucide-react';

interface SignupViewProps {
    apiBase?: string;
    onSignupSuccess: (mobile: string) => void;
    onNavigate: (route: string) => void;
    onToggleLogin: (mobile: string) => void;
}

export default function SignupView({ apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000', onSignupSuccess, onNavigate, onToggleLogin }: SignupViewProps) {
    const { updateUser } = useAuthStore();
    const shouldReduceMotion = useReducedMotion();

    // ── Reduced-motion-aware animation presets ─────────────────────────────
    // Spread {...stepMotion} on every step motion.div. When the user has
    // enabled "Reduce Motion" in their OS settings, all horizontal slides
    // are replaced with simple opacity crossfades (WCAG 2.3.3 / APCA).
    const stepMotion = shouldReduceMotion
        ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.15 } }
        : { initial: { opacity: 0, x: 30 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -30 }, transition: { type: 'spring' as const, stiffness: 300, damping: 25 } };

    const successMotion = shouldReduceMotion
        ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.15 } }
        : { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 1.05 }, transition: { type: 'spring' as const, stiffness: 300, damping: 25 } };
    
    const [step, setStep] = useState(1);
    
    // --- Step 1: The Persona ---
    const [avatar, setAvatar] = useState('Felix');
    const [userId, setUserId] = useState('');
    const [userIdStatus, setUserIdStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'error'>('idle');
    const [userIdSuggestions, setUserIdSuggestions] = useState<string[]>([]);
    const checkUserIdTimeout = useRef<NodeJS.Timeout | null>(null);

    // --- Step 2: The Curriculum ---
    const [goalType, setGoalType] = useState<'school_board' | 'competitive_exam' | ''>('');
    const [selectedCurriculumCode, setSelectedCurriculumCode] = useState('');
    const [schoolName, setSchoolName] = useState('');
    
    const [availableCurriculums, setAvailableCurriculums] = useState<{code: string, name: string, board: string, stream: string, medium: string, grade: string, type?: string}[]>([]);

    useEffect(() => {
        fetch(`${apiBase}/curriculum/curriculums`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setAvailableCurriculums(data);
                else if (data.success) setAvailableCurriculums(data.data);
            })
            .catch(err => console.error("Failed to load curriculums:", err));
    }, [apiBase]);

    const filteredCurriculums = availableCurriculums.filter(c => !goalType || c.type === goalType);

    // --- Step 3: The Vault ---
    const [fullName, setFullName] = useState('');
    const [mobile, setMobile] = useState('');
    const [mobileStatus, setMobileStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
    const checkMobileTimeout = useRef<NodeJS.Timeout | null>(null);
    
    const [passkey, setPasskey] = useState('');
    const [vaultQuestion, setVaultQuestion] = useState('');
    const [vaultAnswer, setVaultAnswer] = useState('');
    const [inviteCode, setInviteCode] = useState('');
    const [inviteCodeStatus, setInviteCodeStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
    const checkInviteCodeTimeout = useRef<NodeJS.Timeout | null>(null);

    // ── Step 3 refs for auto-focus on validation error (Phase 4) ──────────
    const fullNameRef    = useRef<HTMLInputElement>(null);
    const mobileFieldRef = useRef<HTMLInputElement>(null);

    // ── Step 3 onBlur touched state (inline validation, not mid-keystroke) ─
    const [fullNameTouched,      setFullNameTouched]      = useState(false);
    const [step3MobileTouched,   setStep3MobileTouched]   = useState(false);

    // --- Misc States ---
    const [errorMsg, setErrorMsg] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [generatedRollNumber, setGeneratedRollNumber] = useState('');

    // --- Input Handlers ---
    const handleUserIdInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
        setUserId(val);
        setUserIdStatus('idle');
        setErrorMsg('');
        
        if (checkUserIdTimeout.current) clearTimeout(checkUserIdTimeout.current);
        
        if (val.length >= 3) {
            setUserIdStatus('checking');
            checkUserIdTimeout.current = setTimeout(() => {
                fetch(`${apiBase}/auth/check-username?username=${val}`)
                    .then(res => {
                        if (!res.ok) throw new Error("API responded with an error");
                        return res.json();
                    })
                    .then(data => {
                        if (data.available === true) {
                            setUserIdStatus('available');
                        } else {
                            setUserIdStatus('taken');
                            setUserIdSuggestions(data.suggestions || []);
                        }
                    })
                    .catch(err => {
                        console.error("Error checking username:", err);
                        setUserIdStatus('error');
                        // Phase 1: user-friendly copy — never expose raw API / server messages
                        setErrorMsg('Could not verify username right now. Please try again in a moment.');
                    });
            }, 500);
        }
    };

    const handleMobileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/[^0-9]/g, '');
        setMobile(val);
        setMobileStatus('idle');

        if (checkMobileTimeout.current) clearTimeout(checkMobileTimeout.current);

        if (val.length === 10) {
            setMobileStatus('checking');
            checkMobileTimeout.current = setTimeout(() => {
                fetch(`${apiBase}/auth/check-mobile?mobile=${val}`)
                    .then(res => res.json())
                    .then(data => {
                        if (data.available) {
                            setMobileStatus('available');
                        } else {
                            setMobileStatus('taken'); // Sibling constraint - soft warning
                        }
                    })
                    .catch(() => setMobileStatus('idle'));
            }, 500);
        }
    };

    const handleInviteCodeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.toUpperCase();
        setInviteCode(val);
        setInviteCodeStatus('idle');
        
        if (checkInviteCodeTimeout.current) clearTimeout(checkInviteCodeTimeout.current);
        
        if (val.length >= 3) {
            setInviteCodeStatus('checking');
            checkInviteCodeTimeout.current = setTimeout(() => {
                fetch(`${apiBase}/auth/check-invite-code?code=${val}`)
                    .then(res => res.json())
                    .then(data => {
                        if (data.valid) {
                            setInviteCodeStatus('valid');
                        } else {
                            setInviteCodeStatus('invalid');
                        }
                    })
                    .catch(() => setInviteCodeStatus('idle'));
            }, 500);
        } else if (val.length === 0) {
             setInviteCodeStatus('idle');
        }
    };

    const validateStep = (currentStep: number) => {
        if (currentStep === 1) {
            if (userId.length < 3) return "Username must be at least 3 characters.";
            if (userIdStatus === 'checking') return "Still checking username availability... please wait.";
            if (userIdStatus === 'error') return "Network error while checking username. Please try again.";
            if (userIdStatus === 'taken') return "That username is taken. Please choose another.";
            if (userIdStatus !== 'available') return "Please choose a valid and available username.";
        }
        if (currentStep === 2) {
            if (!goalType) return "Please tell us what you are preparing for.";
            if (!selectedCurriculumCode) return "Please select a curriculum.";
        }
        if (currentStep === 3) {
            if (!fullName || fullName.length < 3) return "Please enter your full name.";
            if (!mobile || mobile.length !== 10) return "Please enter a valid 10-digit mobile number.";
            if (passkey.length !== 4) return "Please enter a 4-digit passkey.";
            if (!vaultQuestion) return "Please select a vault question.";
            if (!vaultAnswer || vaultAnswer.trim().length === 0) return "Please enter a vault answer.";
            if (inviteCode && inviteCodeStatus === 'invalid') return "Please enter a valid Invite Code or leave it blank.";
            // Explicitly allowing mobileStatus === 'taken' (Sibling constraint)
        }
        return null;
    };

    const handleNext = () => {
        const err = validateStep(step);
        if (err) {
            setErrorMsg(err);
            return;
        }
        setErrorMsg('');
        setStep(step + 1);
    };

    const completeSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        const err = validateStep(step);
        if (err) {
            setErrorMsg(err);
            // Phase 4: shift keyboard focus to the first offending Step-3 field
            // so the user never has to scroll to discover the error.
            if (step === 3) {
                if (!fullName || fullName.length < 3)        fullNameRef.current?.focus();
                else if (!mobile || mobile.length !== 10)    mobileFieldRef.current?.focus();
            }
            return;
        }
        
        setIsLoading(true);
        setErrorMsg('');

        const match = availableCurriculums.find(c => c.code === selectedCurriculumCode);
        const curriculumCode = match ? match.code : '';
        const finalGrade = match ? match.grade : '';

        try {
            const res = await fetch(`${apiBase}/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: fullName,
                    nickName: userId,
                    mobile: mobile,
                    passkey: passkey,
                    avatarSeed: `https://api.dicebear.com/9.x/personas/svg?seed=${avatar}&backgroundColor=transparent`,
                    role: 'student',
                    curriculum_code: curriculumCode,
                    grade: finalGrade,
                    school: schoolName || 'Not Specified',
                    parentName: fullName, // Automatically set since Guardian fields removed
                    parentMobile: mobile, // Automatically set since Guardian fields removed
                    vaultQuestion: vaultQuestion,
                    vaultAnswer: vaultAnswer,
                    inviteCode: inviteCode || null
                })
            });

            const data = await res.json();
            
            if (res.ok) {
                setGeneratedRollNumber(data.roll_number);
                setStep(4); // Success step
            } else {
                setErrorMsg(data.detail || data.message || "Failed to create account. Please try again.");
            }
        } catch (error) {
            setErrorMsg("Network error. Please check your connection.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout tagline="LEARN. PRACTICE. LEVEL UP.">
            <motion.div
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
                animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                exit={shouldReduceMotion    ? { opacity: 0 } : { opacity: 0, y: -20 }}
                transition={shouldReduceMotion ? { duration: 0.15 } : { type: 'spring', stiffness: 300, damping: 25 }}
                className="w-full flex flex-col h-full relative"
            >
                <Card className="flex-1 shadow-2xl group border-[rgba(255,255,255,0.08)] p-6 md:px-8 md:py-6 overflow-hidden">
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-brand-primary/5 rounded-full blur-3xl pointer-events-none group-hover:bg-brand-primary/10 transition-colors duration-500"></div>
                {/* Steps Header */}
                <div className="flex items-center justify-between mb-8 relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-bg-surface-elevated border border-border-subtle rounded-2xl flex items-center justify-center shadow-inner">
                            {step === 1 && <UserIcon className="w-6 h-6 text-brand-primary" />}
                            {step === 2 && <BookOpen className="w-6 h-6 text-brand-primary" />}
                            {step === 3 && <Shield className="w-6 h-6 text-brand-primary" />}
                            {step === 4 && <Check className="w-6 h-6 text-semantic-success" />}
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-text-primary tracking-wide">
                                {step === 1 && "The Persona"}
                                {step === 2 && "The Curriculum"}
                                {step === 3 && "The Vault"}
                                {step === 4 && "Success!"}
                            </h2>
                            <p className="text-sm font-semibold text-text-secondary">
                                {step < 4 ? `Step ${step} of 3` : "You're all set"}
                            </p>
                        </div>
                    </div>
                    {step < 4 && (
                        <div className="flex gap-1.5">
                            {[1, 2, 3].map(i => (
                                <div key={i} className={`h-2.5 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-brand-primary shadow-[0_0_10px_rgba(250,204,21,0.5)]' : i < step ? 'w-2.5 bg-brand-primary/50' : 'w-2.5 bg-border-subtle'}`} />
                            ))}
                        </div>
                    )}
                </div>

                {/* Phase 1 fix: removed `step > 1` gate so Step-1 errors are visible */}
                {errorMsg && step < 4 && (
                    <motion.div
                        role="alert"
                        aria-live="assertive"
                        aria-atomic="true"
                        initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 bg-semantic-error/5 border-l-4 border-semantic-error/50 p-4 rounded-r-xl flex items-center gap-3"
                    >
                        <AlertCircle className="w-5 h-5 text-semantic-error flex-shrink-0" />
                        <p className="text-sm font-medium text-semantic-error">{errorMsg}</p>
                    </motion.div>
                )}

                <div className="flex-1 relative z-10 overflow-y-auto no-scrollbar pb-6">
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div key="step1" {...stepMotion} className="space-y-6">
                                <div className="flex flex-col items-center justify-center pt-2">
                                    <div className="relative group">
                                        {/* Phase 2: meaningful alt text for screen readers */}
                                        <AvatarContainer
                                            src={`https://api.dicebear.com/9.x/personas/svg?seed=${avatar}&backgroundColor=transparent`}
                                            alt={`Avatar persona: ${avatar}`}
                                            size="xl"
                                            className="group-hover:border-brand-primary/50 group-hover:shadow-lg group-hover:scale-105 bg-[#1F2937]"
                                        />
                                        {/* Phase 2: focus-visible ring + descriptive aria-label on shuffle button */}
                                        <button
                                            type="button"
                                            aria-label={`Shuffle avatar — currently showing ${avatar}`}
                                            onClick={() => {
                                                const avatars = ['Felix', 'Aneka', 'Jocelyn', 'Mimi', 'Jasper', 'Sawyer', 'Bandit', 'Ginger'];
                                                const next = (avatars.indexOf(avatar) + 1) % avatars.length;
                                                setAvatar(avatars[next]);
                                            }}
                                            className="absolute -bottom-4 -right-4 bg-bg-surface border-2 border-border-subtle rounded-full p-3 text-brand-primary hover:bg-brand-primary hover:text-black transition-all shadow-xl hover:scale-110 active:scale-95 cursor-pointer z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-app"
                                            title="Shuffle Avatar"
                                        >
                                            <RefreshCw className="w-5 h-5" />
                                        </button>
                                    </div>
                                    <p className="text-xs font-bold text-text-secondary uppercase tracking-widest mt-6">Your Player Avatar</p>
                                </div>

                                <div aria-live="polite">
                                    <Input
                                        id="userId"
                                        label="GAMERTAG *"
                                        helperText="Your public username for the learning arena."
                                        value={userId}
                                        onChange={handleUserIdInput}
                                        placeholder="Choose a cool gamertag"
                                        success={userIdStatus === 'available'}
                                        errorText={(userIdStatus === 'taken' || errorMsg) ? (errorMsg || 'That username is taken') : undefined}
                                        icon={
                                            userIdStatus === 'checking'  ? <Loader2 className="w-5 h-5 animate-spin text-brand-primary" /> :
                                            userIdStatus === 'available' ? <Check   className="w-5 h-5 text-semantic-success" /> : null
                                        }
                                        iconPosition="right"
                                    />
                                    {userIdStatus === 'available' && (
                                        <p className="text-xs text-semantic-success mt-2 font-medium">Gamertag is available!</p>
                                    )}
                                    {userIdStatus === 'taken' && (
                                        <div className="mt-2">
                                            <p className="text-xs text-semantic-error font-medium mb-1">Taken. Try one of these:</p>
                                            <div className="flex flex-wrap gap-2">
                                                {userIdSuggestions.map(s => (
                                                    // Phase 2: aria-label + 44px-minimum touch target (py-2 px-3) + focus ring
                                                    <button
                                                        key={s}
                                                        type="button"
                                                        aria-label={`Use suggested gamertag: ${s}`}
                                                        onClick={() => { setUserId(s); setUserIdStatus('available'); setErrorMsg(''); }}
                                                        className="text-xs bg-bg-surface-elevated border border-border-subtle px-3 py-2 rounded-md text-text-secondary hover:text-text-primary transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-1 focus-visible:ring-offset-bg-app"
                                                    >
                                                        {s}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div key="step2" {...stepMotion} className="space-y-6">
                                <div>
                                    <label id="goalTypeLabel" className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 block">Choose Your Arena *</label>
                                    <div className="flex gap-3" role="radiogroup" aria-labelledby="goalTypeLabel">
                                        {/* Phase 1 fix: added `relative` so the abs-positioned checkmark badge stays inside this card */}
                                        {/* Phase 2: added focus-visible ring to both arena cards */}
                                        <button
                                            type="button"
                                            role="radio"
                                            aria-checked={goalType === 'school_board'}
                                            onClick={() => { setGoalType('school_board'); setSelectedCurriculumCode(''); }}
                                            className={`flex-1 py-4 px-4 rounded-xl text-sm font-bold border-2 transition-all flex flex-col items-center gap-2 relative cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-app ${
                                                goalType === 'school_board'
                                                    ? 'bg-brand-primary/10 border-brand-primary text-brand-primary shadow-[0_0_15px_rgba(250,204,21,0.2)]'
                                                    : 'bg-bg-surface border-border-subtle text-text-secondary hover:border-border-subtle/80 hover:text-text-primary'
                                            }`}
                                        >
                                            <BookOpen className="w-6 h-6" />
                                            School Boards
                                            {goalType === 'school_board' && (
                                                <div className="absolute top-2 right-2 bg-brand-primary rounded-full p-0.5">
                                                    <Check className="w-3 h-3 text-black" />
                                                </div>
                                            )}
                                        </button>
                                        <button
                                            type="button"
                                            role="radio"
                                            aria-checked={goalType === 'competitive_exam'}
                                            onClick={() => { setGoalType('competitive_exam'); setSelectedCurriculumCode(''); }}
                                            className={`flex-1 py-4 px-4 rounded-xl text-sm font-bold border-2 transition-all flex flex-col items-center gap-2 relative cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-app ${
                                                goalType === 'competitive_exam'
                                                    ? 'bg-brand-primary/10 border-brand-primary text-brand-primary shadow-[0_0_15px_rgba(250,204,21,0.2)]'
                                                    : 'bg-bg-surface border-border-subtle text-text-secondary hover:border-border-subtle/80 hover:text-text-primary'
                                            }`}
                                        >
                                            <Users className="w-6 h-6" />
                                            Competitive Exams
                                            {goalType === 'competitive_exam' && (
                                                <div className="absolute top-2 right-2 bg-brand-primary rounded-full p-0.5">
                                                    <Check className="w-3 h-3 text-black" />
                                                </div>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Phase 3: inner reveal animation also respects reduced motion */}
                                {goalType && (
                                    <motion.div
                                        initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
                                        animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                                        className="space-y-5"
                                    >
                                        <div>
                                            <label id="curriculumLabel" className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 block">
                                                {goalType === 'school_board' ? 'Select Curriculum *' : 'Select Exam *'}
                                            </label>
                                            {/* Phase 2: focus rings on curriculum radio buttons */}
                                            <div role="radiogroup" aria-labelledby="curriculumLabel" className="flex flex-col gap-3">
                                                {filteredCurriculums.length === 0 ? (
                                                    <p className="text-sm text-text-secondary italic">No options available for this category yet.</p>
                                                ) : (
                                                    filteredCurriculums.map(c => (
                                                        <button
                                                            role="radio"
                                                            aria-checked={selectedCurriculumCode === c.code}
                                                            key={c.code}
                                                            type="button"
                                                            onClick={() => setSelectedCurriculumCode(c.code)}
                                                            className={`px-4 py-3 rounded-card text-sm font-bold border-2 transition-all text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-1 focus-visible:ring-offset-bg-app ${
                                                                selectedCurriculumCode === c.code
                                                                    ? 'bg-brand-primary/10 border-brand-primary text-brand-primary'
                                                                    : 'bg-bg-surface border-border-subtle text-text-secondary hover:border-border-subtle/80 hover:text-text-primary'
                                                            }`}
                                                        >
                                                            {c.name}
                                                        </button>
                                                    ))
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <Input
                                                id="schoolName"
                                                label="School Name (Optional)"
                                                value={schoolName}
                                                onChange={e => setSchoolName(e.target.value)}
                                                placeholder="Enter school name"
                                            />
                                        </div>
                                    </motion.div>
                                )}
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div key="step3" {...stepMotion} className="space-y-5">
                                {/* Phase 4: ref for auto-focus on error + onBlur inline validation */}
                                <div>
                                    <Input
                                        id="fullName"
                                        ref={fullNameRef}
                                        label="Full Name *"
                                        value={fullName}
                                        onChange={e => setFullName(e.target.value)}
                                        onBlur={() => setFullNameTouched(true)}
                                        placeholder="e.g., John Doe"
                                        errorText={
                                            fullNameTouched && fullName.length < 3
                                                ? 'Please enter your full name (at least 3 characters).'
                                                : undefined
                                        }
                                    />
                                </div>

                                <div>
                                    <Input
                                        id="mobile"
                                        ref={mobileFieldRef}
                                        label="Mobile Number *"
                                        type="tel"
                                        inputMode="numeric"
                                        value={mobile}
                                        onChange={handleMobileInput}
                                        onBlur={() => setStep3MobileTouched(true)}
                                        maxLength={10}
                                        placeholder="10-digit number"
                                        success={mobileStatus === 'available'}
                                        errorText={
                                            step3MobileTouched && mobile.length > 0 && mobile.length < 10
                                                ? 'Please enter a valid 10-digit mobile number.'
                                                : mobileStatus === 'taken'
                                                    ? 'Number already in use. A sibling account will be created! 👯'
                                                    : undefined
                                        }
                                        icon={mobileStatus === 'checking' ? <Loader2 className="w-5 h-5 animate-spin text-brand-primary" /> : undefined}
                                        iconPosition="right"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 block">Secure Passkey (4-Digits) *</label>
                                    <OtpInput value={passkey} onChange={setPasskey} />
                                </div>

                                <hr className="border-border-subtle my-4" />
                                <h3 className="text-text-secondary text-sm font-bold uppercase tracking-wider mb-3">Secure Your Vault</h3>

                                <div>
                                    <label htmlFor="vaultQuestion" className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 block">Secret Question *</label>
                                    {/* Phase 2 & 4: custom chevron replaces OS-default arrow (appearance-none) + WCAG focus ring */}
                                    <div className="relative">
                                        <select
                                            id="vaultQuestion"
                                            value={vaultQuestion}
                                            onChange={(e) => setVaultQuestion(e.target.value)}
                                            className="w-full bg-bg-surface border-2 border-border-subtle rounded-xl px-4 py-3 pr-10 text-text-primary text-sm font-medium focus:border-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-app transition-colors shadow-inner appearance-none"
                                        >
                                            <option value="" disabled>Select a question...</option>
                                            <option value="What is your dream superpower?">What is your dream superpower?</option>
                                            <option value="What is your favorite video game?">What is your favorite video game?</option>
                                            <option value="What is the name of your favorite pet or animal?">What is the name of your favorite pet or animal?</option>
                                            <option value="What is your favorite cartoon character?">What is your favorite cartoon character?</option>
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center" aria-hidden="true">
                                            <svg className="w-4 h-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <Input
                                        id="vaultAnswer"
                                        label="Vault Answer *"
                                        value={vaultAnswer}
                                        onChange={e => setVaultAnswer(e.target.value)}
                                        placeholder="Keep it secret, keep it safe..."
                                    />
                                </div>

                                <div aria-live="polite">
                                    <Input
                                        id="inviteCode"
                                        label="Invite Code (Optional)"
                                        value={inviteCode}
                                        onChange={handleInviteCodeInput}
                                        placeholder="Have a code?"
                                        className="uppercase font-mono tracking-widest"
                                        success={inviteCodeStatus === 'valid'}
                                        errorText={inviteCodeStatus === 'invalid' ? "Invalid code. Leave blank if you don't have one." : undefined}
                                        icon={inviteCodeStatus === 'checking' ? <Loader2 className="w-5 h-5 animate-spin text-brand-primary" /> : undefined}
                                        iconPosition="right"
                                    />
                                    {inviteCodeStatus === 'valid' && (
                                        <motion.div
                                            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="mt-2 bg-semantic-success/10 border border-semantic-success/20 px-3 py-2 rounded-lg inline-block"
                                        >
                                            <p className="text-xs text-semantic-success font-bold">Valid code! +50 XP will be added to your account.</p>
                                        </motion.div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                        
                        {step === 4 && (
                            // Phase 3: successMotion respects prefers-reduced-motion (scale → fade)
                            <motion.div key="step4" {...successMotion} className="text-center py-6">
                                <div className="w-20 h-20 bg-semantic-success/10 border border-semantic-success/30 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(0,255,163,0.2)]">
                                    <Check className="w-10 h-10 text-semantic-success" />
                                </div>
                                <h2 className="text-3xl font-black text-text-primary mb-2 tracking-tight">Welcome to the Arena! 🏟️</h2>
                                <p className="text-text-secondary text-sm mb-4">Your profile is ready. Time to level up!</p>

                                {/* Phase 5: Gamified XP reward banner — peak-end emotional payoff */}
                                <motion.div
                                    role="status"
                                    aria-label="100 Starter XP unlocked"
                                    initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={shouldReduceMotion
                                        ? { duration: 0.15 }
                                        : { delay: 0.3, type: 'spring', stiffness: 300, damping: 25 }}
                                    className="bg-brand-primary/10 border border-brand-primary/30 rounded-xl px-4 py-3 mb-6 flex items-center gap-3 justify-center shadow-[0_0_20px_rgba(250,204,21,0.08)]"
                                >
                                    <span className="text-2xl" aria-hidden="true">🎉</span>
                                    <div className="text-left">
                                        <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest">Bonus Unlocked</p>
                                        <p className="text-sm font-black text-brand-primary tracking-wide">+100 Starter XP awarded!</p>
                                    </div>
                                </motion.div>

                                <div className="bg-bg-surface-elevated border border-border-subtle rounded-card p-4 mb-8">
                                    <p className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-1">Your Roll Number</p>
                                    <p className="text-2xl font-black text-brand-primary tracking-wider font-mono">{generatedRollNumber}</p>
                                </div>

                                <Button onClick={() => onToggleLogin(mobile)} fullWidth>
                                    PROCEED TO LOGIN
                                    <ArrowRight className="w-5 h-5 ml-2" />
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer Navigation */}
                {step < 4 && (
                    <div className="pt-4 mt-auto border-t border-border-subtle/30 flex items-center justify-between relative z-10">
                        {step > 1 ? (
                            // Phase 2: focus ring + adequate padding on Back nav button
                            <button
                                type="button"
                                onClick={() => { setStep(step - 1); setErrorMsg(''); }}
                                className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors cursor-pointer font-bold text-sm rounded-md px-1 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/60 focus-visible:ring-offset-1 focus-visible:ring-offset-bg-app"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back
                            </button>
                        ) : (
                            <div></div>
                        )}
                        
                        {step === 3 ? (
                            <Button
                                onClick={completeSignup}
                                isLoading={isLoading}
                                className="ml-auto"
                            >
                                {isLoading ? 'COMPLETE' : 'COMPLETE'}
                            </Button>
                        ) : (
                            <Button
                                onClick={handleNext}
                                className="ml-auto"
                            >
                                CONTINUE <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        )}
                    </div>
                )}
                </Card>
            </motion.div>
            
            {step === 1 && (
                <div className="mt-6 text-center relative z-10">
                    <button 
                        onClick={() => onToggleLogin(mobile)} 
                        className="text-sm font-bold text-text-secondary hover:text-text-primary transition-colors cursor-pointer group"
                    >
                        Already have an account? <span className="text-brand-primary group-hover:text-[#FDE047] transition-colors">Log In</span>
                    </button>
                </div>
            )}
        </AuthLayout>
    );
}

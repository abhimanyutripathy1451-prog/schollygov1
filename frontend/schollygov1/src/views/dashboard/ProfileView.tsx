import React, { useState, useEffect, useRef } from 'react';
import { User, Phone, GraduationCap, Edit2, Shield, Lock, Trophy, Zap, ShieldCheck, Check, ArrowRight, ArrowLeft, Stars } from 'lucide-react';
import { getRankTitle } from '../../utils/gamification';
import { useAuthStore } from '../../stores/auth';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { AvatarContainer } from '../../components/ui/AvatarContainer';
import { MidnightSkeleton } from '../../components/ui/MidnightSkeleton';
import { RecoveryModal } from '../../components/ui/RecoveryModal';

interface ProfileViewProps {
    apiBase: string;
    onNavigate?: (route: string) => void;
}

export default function ProfileView({ apiBase, onNavigate }: ProfileViewProps) {
    const { user: authUser, updateUser } = useAuthStore();
    const [profile, setProfile] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    // Edit Mode State
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    
    // Focus Management Ref
    const fullNameInputRef = useRef<HTMLInputElement>(null);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        mobile: '',
        curriculum_code: '',
        grade: '',
        school: '',
        avatarSeed: '',
    });

    // Step Wizard State
    const [currentStep, setCurrentStep] = useState(1);
    const shouldReduceMotion = useReducedMotion();
    
    const stepMotion = shouldReduceMotion
        ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.15 } }
        : { initial: { opacity: 0, x: 30 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -30 }, transition: { type: 'spring' as const, stiffness: 300, damping: 25 } };

    // Passkey modal state (now using RecoveryModal)
    const [showForgotPasskey, setShowForgotPasskey] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!authUser?.id) return;
            try {
                const response = await fetch(`${apiBase}/auth/profile/${authUser.id}`);
                if (!response.ok) throw new Error("Failed to load profile");
                const data = await response.json();
                setProfile(data);
                setFormData({
                    name: data.full_name || '',
                    mobile: data.mobile || '',
                    curriculum_code: data.curriculum_code || '',
                    grade: data.grade || '',
                    school: data.school_name || '',
                    avatarSeed: data.avatar_seed || '',
                });
            } catch (err: any) {
                console.error(err.message || 'Error loading profile data.');
                setErrorMsg('Unable to connect to the server. Some details may be unavailable.');
                // graceful degraded state
                const degradedProfile = {
                   full_name: authUser.fullName || '',
                   username: authUser.username || '',
                   curriculum_code: authUser.curriculum_code || '',
                   grade: authUser.grade || '',
                   avatar_seed: authUser.avatar || '',
                   total_xp: authUser.xp || 0
                };
                setProfile(degradedProfile);
                setFormData({
                    name: degradedProfile.full_name,
                    mobile: '',
                    curriculum_code: degradedProfile.curriculum_code,
                    grade: degradedProfile.grade,
                    school: '',
                    avatarSeed: degradedProfile.avatar_seed,
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, [authUser, apiBase]);

    const handleEditToggle = () => {
        const newEditState = !isEditing;
        setIsEditing(newEditState);
        if (newEditState) {
            // Jump to step 1 automatically when entering edit mode if not already there
            if (currentStep !== 1) setCurrentStep(1);
            setTimeout(() => {
                fullNameInputRef.current?.focus();
            }, 100);
        } else {
            // Reset form data on cancel
            setFormData({
                name: profile.full_name || '',
                mobile: profile.mobile || '',
                curriculum_code: profile.curriculum_code || '',
                grade: profile.grade || '',
                school: profile.school_name || '',
                avatarSeed: profile.avatar_seed || '',
            });
            setErrorMsg('');
        }
    };

    const handleSave = async () => {
        if (!authUser?.id) return;
        setIsSaving(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            const response = await fetch(`${apiBase}/auth/profile/${authUser.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.detail || "Failed to update profile");
            }

            const data = await response.json();
            setProfile(data.user);
            updateUser({
                fullName: data.user.full_name,
                avatar: data.user.avatar_seed,
                curriculum_code: data.user.curriculum_code,
                grade: data.user.grade
            });
            setIsEditing(false);
            setSuccessMsg('Awesome! Your profile is updated! 🌟');
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err: any) {
            setErrorMsg(err.message || 'Error updating profile');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-bg-app p-8">
                <MidnightSkeleton className="w-full max-w-5xl h-64" />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="p-8 max-w-xl mx-auto text-center mt-20">
                <p className="text-semantic-error font-bold text-xl">Oops! Could not load profile information. 🙈</p>
            </div>
        );
    }

    return (
        <div className="p-4 pb-20 md:p-8 max-w-3xl mx-auto font-sans space-y-8 relative">
            
            {/* Back Navigation */}
            {onNavigate && (
                <button
                    onClick={() => onNavigate('dashboard')}
                    className="inline-flex items-center gap-2 text-text-primary bg-bg-surface-elevated hover:bg-brand-primary/10 hover:text-brand-primary border border-border-subtle transition-all duration-300 cursor-pointer font-bold text-sm mb-6 px-5 py-2.5 rounded-xl shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Back to Basecamp
                </button>
            )}

            {/* Global Notifications */}
            <AnimatePresence>
                {errorMsg && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-semantic-error/10 border border-semantic-error/50 text-semantic-error p-4 rounded-xl font-bold flex items-center gap-3">
                        <Shield className="w-5 h-5 flex-shrink-0" />
                        {errorMsg}
                    </motion.div>
                )}
                
                {successMsg && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-semantic-success/10 border border-semantic-success/50 text-semantic-success p-4 rounded-xl font-bold flex items-center gap-3">
                        <Check className="w-5 h-5 flex-shrink-0" />
                        {successMsg}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header Section: The Player Card */}
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-10"
            >
                <Card variant="gamified" className="p-6">
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                        <button 
                            onClick={() => {
                                if (isEditing) {
                                    const randomSeed = Math.random().toString(36).substring(7);
                                    setFormData({ ...formData, avatarSeed: `https://api.dicebear.com/9.x/fun-emoji/svg?seed=${randomSeed}` });
                                }
                            }}
                            className={`relative rounded-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-primary ${isEditing ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
                            disabled={!isEditing}
                        >
                            <AvatarContainer 
                                size="lg"
                                src={(isEditing ? formData.avatarSeed : profile.avatar_seed) || `https://api.dicebear.com/9.x/fun-emoji/svg?seed=${profile.username}`} 
                                alt={profile.username}
                            />
                            {isEditing && (
                                <div className="absolute bottom-0 right-0 bg-brand-primary text-bg-app p-1.5 rounded-full border-2 border-bg-surface shadow-md">
                                    <Edit2 className="w-4 h-4" />
                                </div>
                            )}
                        </button>
                        
                        <div className="flex-1 text-center sm:text-left">
                            <h2 className="text-2xl font-black text-brand-primary tracking-tight mb-1">@{profile.username}</h2>
                            <p className="text-sm font-medium text-text-secondary mb-4">{profile.full_name}</p>
                            
                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                                <Badge variant="rank" className="flex items-center gap-1">
                                    <Trophy className="w-3 h-3" />
                                    {getRankTitle(profile.level || profile.computed_level || 1)}
                                </Badge>
                                <Badge variant="primary" className="flex items-center gap-1">
                                    <Zap className="w-3 h-3" />
                                    {profile.total_xp} XP
                                </Badge>
                                <Badge variant="milestone" className="flex items-center gap-1">
                                    ID: {profile.roll_number}
                                </Badge>
                            </div>
                        </div>
                    </div>
                </Card>
            </motion.div>

            {/* Prominent Referral Code */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-brand-primary/10 border-2 border-brand-primary/30 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_0_20px_rgba(250,204,21,0.08)]"
            >
                <div className="text-center sm:text-left">
                    <p className="text-xs font-black text-brand-primary uppercase tracking-widest mb-1 flex items-center gap-2 justify-center sm:justify-start">
                        <Zap className="w-4 h-4" /> Your Referral Key
                    </p>
                    <p className="text-sm font-medium text-text-secondary">Invite friends to SchollyGo and earn bonus XP!</p>
                </div>
                <div className="bg-bg-app border-2 border-brand-primary/50 text-brand-primary rounded-xl px-6 py-3 font-mono font-black text-xl tracking-widest shadow-inner relative overflow-hidden group select-all cursor-text">
                    <div className="absolute inset-0 bg-brand-primary/10 translate-y-full group-hover:translate-y-0 transition-transform"></div>
                    <span className="relative z-10">{profile.referral_code || 'N/A'}</span>
                </div>
            </motion.div>

            {/* Step Wizard Container */}
            <Card variant="default" className="p-0 overflow-hidden flex flex-col min-h-[400px]">
                {/* Steps Header */}
                <div className="p-6 border-b border-border-subtle/50 flex items-center justify-between bg-bg-surface-elevated/20">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-bg-surface-elevated border border-border-subtle rounded-2xl flex items-center justify-center shadow-inner">
                            {currentStep === 1 && <GraduationCap className="w-6 h-6 text-brand-primary" />}
                            {currentStep === 2 && <User className="w-6 h-6 text-brand-primary" />}
                            {currentStep === 3 && <ShieldCheck className="w-6 h-6 text-brand-primary" />}
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-text-primary tracking-wide">
                                {currentStep === 1 && "Academic Info"}
                                {currentStep === 2 && "Guardian Details"}
                                {currentStep === 3 && "Identity & Security"}
                            </h2>
                            <p className="text-sm font-semibold text-text-secondary">
                                Step {currentStep} of 3
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-1.5 hidden sm:flex">
                        {[1, 2, 3].map(i => (
                            <div key={i} className={`h-2.5 rounded-full transition-all duration-300 ${i === currentStep ? 'w-8 bg-brand-primary shadow-[0_0_10px_rgba(250,204,21,0.5)]' : i < currentStep ? 'w-2.5 bg-brand-primary/50' : 'w-2.5 bg-border-subtle'}`} />
                        ))}
                    </div>
                </div>

                {/* Step Content */}
                <div className="flex-1 p-6 relative overflow-x-hidden">
                    <AnimatePresence mode="wait">
                        {currentStep === 1 && (
                            <motion.div key="step1" {...stepMotion} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <Input 
                                        ref={fullNameInputRef}
                                        label="Student's Full Name"
                                        icon={<User className="w-4 h-4" />}
                                        value={isEditing ? formData.name : profile.full_name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        disabled={!isEditing}
                                        placeholder="Your full name"
                                    />
                                </div>

                                <Input 
                                    label="Curriculum"
                                    icon={<Stars className="w-4 h-4" />}
                                    value={profile.curriculum_name || profile.curriculum_code}
                                    disabled={true}
                                    readOnly
                                />

                                <Input 
                                    label="Grade"
                                    icon={<Trophy className="w-4 h-4" />}
                                    value={`Class ${profile.grade}`}
                                    disabled={true}
                                    readOnly
                                />

                                <div className="md:col-span-2">
                                    <Input 
                                        label="School Name"
                                        icon={<GraduationCap className="w-4 h-4" />}
                                        value={isEditing ? formData.school : (profile.school_name || "Not Specified")}
                                        onChange={(e) => setFormData({...formData, school: e.target.value})}
                                        disabled={!isEditing}
                                        placeholder="Where do you study?"
                                    />
                                </div>
                            </motion.div>
                        )}

                        {currentStep === 2 && (
                            <motion.div key="step2" {...stepMotion} className="space-y-6">
                                <Input 
                                    label="Parent's Full Name"
                                    icon={<User className="w-4 h-4" />}
                                    value={profile.parent_name || 'N/A'}
                                    disabled={true}
                                    readOnly
                                />
                                <Input 
                                    label="Registered Mobile Number"
                                    icon={<Phone className="w-4 h-4" />}
                                    value={isEditing ? formData.mobile : profile.mobile}
                                    onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                                    disabled={!isEditing}
                                    placeholder="Mobile number"
                                    helperText="Some details are locked for security purposes."
                                />
                            </motion.div>
                        )}

                        {currentStep === 3 && (
                            <motion.div key="step3" {...stepMotion} className="space-y-6">
                                <Input 
                                    label="Username (ID)"
                                    icon={<span className="font-black text-xs text-text-muted">@</span>}
                                    value={profile.username}
                                    disabled={true}
                                    readOnly
                                    helperText="Username cannot be changed after registration."
                                />

                                <div className="relative">
                                    <Input 
                                        label="Account Passkey"
                                        icon={<Lock className="w-4 h-4" />}
                                        type="password"
                                        value="••••"
                                        disabled={true}
                                        readOnly
                                    />
                                    {/* Reset Passkey Trigger */}
                                    <button 
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setShowForgotPasskey(true);
                                        }} 
                                        className="absolute right-0 top-0 text-[10px] font-bold text-brand-primary hover:underline uppercase tracking-widest cursor-pointer mt-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary rounded"
                                    >
                                        Reset Passkey
                                    </button>
                                </div>
                                
                                <p className="text-xs text-text-muted font-medium mt-4">
                                    Your Referral Key has been moved to the top of your profile for easier sharing!
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer Navigation */}
                <div className="p-4 border-t border-border-subtle/30 bg-bg-surface flex items-center justify-between">
                    {currentStep > 1 ? (
                        <button
                            type="button"
                            onClick={() => setCurrentStep(prev => prev - 1)}
                            className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors cursor-pointer font-bold text-sm rounded-md px-2 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/60 focus-visible:ring-offset-1 focus-visible:ring-offset-bg-surface"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back
                        </button>
                    ) : (
                        <div />
                    )}
                    
                    {currentStep < 3 && (
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={() => setCurrentStep(prev => prev + 1)}
                            className="ml-auto"
                        >
                            CONTINUE <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    )}
                </div>
            </Card>

            {/* Edit Actions below the wizard */}
            <div className="flex flex-col sm:flex-row justify-end gap-4 pt-4">
                {!isEditing ? (
                    <Button 
                        variant="primary"
                        onClick={handleEditToggle}
                    >
                        <Edit2 className="w-4 h-4 mr-2" /> Edit Profile
                    </Button>
                ) : (
                    <>
                        <Button 
                            variant="secondary"
                            onClick={() => {
                                setIsEditing(false);
                                setFormData({
                                    name: profile.full_name || '',
                                    mobile: profile.mobile || '',
                                    curriculum_code: profile.curriculum_code || '',
                                    grade: profile.grade || '',
                                    school: profile.school_name || '',
                                    avatarSeed: profile.avatar_seed || '',
                                });
                                setErrorMsg('');
                            }}
                            disabled={isSaving}
                            className="order-2 sm:order-1"
                        >
                            Cancel
                        </Button>
                        <Button 
                            variant="primary"
                            onClick={handleSave}
                            isLoading={isSaving}
                            disabled={isSaving}
                            className="order-1 sm:order-2"
                        >
                            Save Changes
                        </Button>
                    </>
                )}
            </div>

            {/* PIN Recovery / Reset Modal from Auth Flow */}
            <RecoveryModal 
                isOpen={showForgotPasskey} 
                onClose={() => setShowForgotPasskey(false)} 
                mobile={profile.mobile}
                apiBase={apiBase} 
            />

        </div>
    );
}

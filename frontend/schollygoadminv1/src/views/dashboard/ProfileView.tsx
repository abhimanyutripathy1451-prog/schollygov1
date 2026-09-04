import React, { useState, useEffect } from 'react';
import { User, Phone, GraduationCap, Edit2, Check, X, Shield, Lock, Key, ArrowRight, Zap, Trophy, ShieldCheck, Gamepad2, Stars, BookOpen, Building } from 'lucide-react';
import { useAuthStore } from '../../stores/auth';
import { motion, AnimatePresence } from 'motion/react';

interface ProfileViewProps {
    apiBase: string;
}

export default function ProfileView({ apiBase }: ProfileViewProps) {
    const { user: authUser, updateUser } = useAuthStore();
    const [profile, setProfile] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        mobile: '',
        board: '',
        grade: '',
        school: '',
        avatar: '',
    });

    // Passkey modal state
    const [showPasskeyModal, setShowPasskeyModal] = useState(false);
    const [newPasskey, setNewPasskey] = useState('');
    const [isPasskeyLoading, setIsPasskeyLoading] = useState(false);

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
                    board: data.board || '',
                    grade: data.grade || '',
                    school: data.school_name || '',
                    avatar: data.avatar_seed || '',
                });
            } catch (err: any) {
                console.error(err.message || 'Error loading profile data.');
                setErrorMsg('Unable to connect to the server. Some details may be unavailable.');
                // graceful degraded state
                const degradedProfile = {
                   full_name: authUser.fullName || '',
                   username: authUser.username || '',
                   board: authUser.board || '',
                   grade: authUser.grade || '',
                   avatar_seed: authUser.avatar || '',
                   total_xp: authUser.xp || 0
                };
                setProfile(degradedProfile);
                setFormData({
                    name: degradedProfile.full_name,
                    mobile: '',
                    board: degradedProfile.board,
                    grade: degradedProfile.grade,
                    school: '',
                    avatar: degradedProfile.avatar_seed,
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, [authUser, apiBase]);

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
            updateUser(data.user);
            setIsEditing(false);
            setSuccessMsg('Awesome! Your profile is updated! 🌟');
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err: any) {
            setErrorMsg(err.message || 'Error updating profile');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSavePasskey = async () => {
        if (newPasskey.length !== 4) {
            setErrorMsg("Passkey must be exactly 4 digits!");
            return;
        }

        setIsPasskeyLoading(true);
        setErrorMsg('');
        
        try {
            const response = await fetch(`${apiBase}/auth/profile/${authUser?.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ passkey: newPasskey })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.detail || "Failed to update passkey");
            }
            
            setShowPasskeyModal(false);
            setSuccessMsg("Secret Passkey locked in successfully! 🚀");
            setTimeout(() => setSuccessMsg(''), 4000);
            
            // reset state
            setNewPasskey('');
        } catch (err: any) {
            setErrorMsg(err.message || 'Error updating passkey');
        } finally {
            setIsPasskeyLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-deep-space">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-voltage-yellow"></div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="p-8 max-w-xl mx-auto text-center mt-20">
                <p className="text-error-red font-bold text-xl">Oops! Could not load profile information. 🙈</p>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto font-sans">
            
            {/* Header Banner - Sophisticated Dark Theme */}
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-graphite rounded-3xl p-6 md:p-8 border border-white/5 shadow-2xl shadow-black/40 relative overflow-hidden flex flex-col items-stretch gap-6 mb-10"
            >
                <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#FFD700 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 md:gap-8">
                    <div 
                        className={`relative w-24 h-24 md:w-28 md:h-28 rounded-full border-4 border-voltage-yellow shadow-[0_0_20px_rgba(255,215,0,0.15)] flex-shrink-0 bg-deep-space overflow-hidden ${isEditing ? 'cursor-pointer hover:scale-105 transition-transform' : ''}`}
                        onClick={() => {
                            if (isEditing) {
                                const randomSeed = Math.random().toString(36).substring(7);
                                setFormData({ ...formData, avatar: `https://api.dicebear.com/9.x/fun-emoji/svg?seed=${randomSeed}` });
                            }
                        }}
                    >
                        <img 
                            src={(isEditing ? formData.avatar : profile.avatar_seed) || `https://api.dicebear.com/9.x/fun-emoji/svg?seed=${profile.username}`} 
                            alt="Avatar" 
                            className="w-full h-full object-cover"
                        />
                        {isEditing && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                <Stars className="text-white w-8 h-8" />
                            </div>
                        )}
                    </div>
                    
                    <div className="flex-1 text-center md:text-left">
                        <div className="inline-block bg-voltage-yellow/10 text-voltage-yellow text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest mb-2.5">
                            Roll No: {profile.roll_number}
                        </div>
                        <h2 className="text-2xl md:text-3xl font-black text-white mb-0.5 tracking-tight">
                            {profile.full_name}
                        </h2>
                        <p className="text-gray-400 font-semibold text-sm md:text-base flex items-center justify-center md:justify-start gap-0.5 mb-4">
                            <span className="text-voltage-yellow">@</span>{profile.username}
                        </p>
                        
                        <div className="flex flex-wrap justify-center md:justify-start gap-3">
                            <div className="bg-deep-space border border-gray-700 rounded-xl px-4 py-2 flex items-center gap-2">
                                <Stars className="text-voltage-yellow w-5 h-5" />
                                <div className="text-left">
                                    <div className="text-white font-bold leading-none text-sm md:text-base">{profile.rankTitle || 'Novice'}</div>
                                    <div className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Lvl {profile.computed_level || 1}</div>
                                </div>
                            </div>
                            <div className="bg-deep-space border border-gray-700 rounded-xl px-4 py-2 flex items-center gap-2">
                                <Trophy className="text-voltage-yellow w-5 h-5" />
                                <div className="text-left">
                                    <div className="text-white font-bold leading-none text-sm md:text-base">{profile.total_xp}</div>
                                    <div className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Total XP</div>
                                </div>
                            </div>
                            <div className="bg-deep-space border border-gray-700 rounded-xl px-4 py-2 flex items-center gap-2">
                                <Zap className="text-orange-500 w-5 h-5" />
                                <div className="text-left">
                                    <div className="text-white font-bold leading-none text-sm md:text-base">{profile.current_streak}</div>
                                    <div className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Day Streak</div>
                                </div>
                            </div>

                            {!isEditing && (
                                <button 
                                    onClick={() => setIsEditing(true)}
                                    className="ml-auto bg-graphite hover:bg-gray-800 border border-white/10 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-sm hover:shadow-md cursor-pointer active:scale-95"
                                >
                                    <Edit2 className="w-4 h-4 text-voltage-yellow" />
                                    Edit Profile
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>

            <AnimatePresence>
                {errorMsg && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-red-500/10 border-2 border-red-500 text-red-400 p-4 mb-6 rounded-2xl font-bold flex items-center gap-3">
                        <Shield className="w-6 h-6 flex-shrink-0" />
                        {errorMsg}
                    </motion.div>
                )}
                
                {successMsg && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-emerald-500/10 border-2 border-emerald-500 text-emerald-400 p-4 mb-6 rounded-2xl font-bold flex items-center gap-3">
                        <Trophy className="w-6 h-6 flex-shrink-0 text-emerald-400" />
                        {successMsg}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Content Cards */}
            <div className="grid md:grid-cols-2 gap-6 relative z-0">
                {/* Academic Profile */}
                <div className="bg-graphite border border-white/5 rounded-2xl p-6 shadow-xl shadow-black/20 md:col-span-2">
                    <h3 className="text-sm font-bold text-white mb-5 flex items-center gap-2 border-b border-white/5 pb-3 uppercase tracking-wider">
                        <div className="w-8 h-8 rounded-lg bg-voltage-yellow/10 flex items-center justify-center text-voltage-yellow">
                            <GraduationCap className="w-5 h-5 text-voltage-yellow" />
                        </div>
                        Personal & Academic Info
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Student's Full Name</label>
                            <div className="w-full bg-gray-900/50 border border-transparent text-gray-400 rounded-xl p-3 cursor-not-allowed font-medium flex justify-between items-center">
                                <span>{profile.full_name}</span>
                                <Lock className="w-4 h-4 text-gray-500" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Board</label>
                            <div className="w-full bg-gray-900/50 border border-transparent text-gray-400 rounded-xl p-3 cursor-not-allowed font-medium flex justify-between items-center">
                                <span>{profile.board}</span>
                                <Lock className="w-4 h-4 text-gray-500" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Grade</label>
                            <div className="w-full bg-gray-900/50 border border-transparent text-gray-400 rounded-xl p-3 cursor-not-allowed font-medium flex justify-between items-center">
                                <span>Class {profile.grade}</span>
                                <Lock className="w-4 h-4 text-gray-500" />
                            </div>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">School Name</label>
                            {isEditing ? (
                                <input 
                                    type="text" 
                                    value={formData.school} 
                                    onChange={e => setFormData({...formData, school: e.target.value})}
                                    className="w-full bg-deep-space border border-white/10 text-white rounded-xl p-3 focus:ring-2 focus:ring-voltage-yellow/30 focus:border-voltage-yellow outline-none transition-all shadow-inner"
                                    placeholder="Where do you study?"
                                />
                            ) : (
                                <div className="w-full bg-gray-900/50 border border-transparent text-gray-400 rounded-xl p-3 cursor-not-allowed font-medium">{profile.school_name || "Not Specified"}</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Secure / Parent Details */}
                <div className="bg-graphite border border-white/5 rounded-2xl p-6 shadow-xl shadow-black/20">
                    <h3 className="text-sm font-bold text-white mb-5 flex items-center gap-2 border-b border-white/5 pb-3 uppercase tracking-wider">
                        <div className="w-8 h-8 rounded-lg bg-voltage-yellow/10 flex items-center justify-center text-voltage-yellow">
                            <span className="font-bold relative"><User className="w-5 h-5"/></span>
                        </div>
                        Guardian Details
                    </h3>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Parent's Full Name</label>
                            <div className="relative flex items-center">
                                <input type="text" disabled value={profile.parent_name || 'N/A'}
                                    className="w-full bg-gray-900/50 border border-transparent text-gray-400 rounded-xl p-3 pr-10 outline-none cursor-not-allowed font-medium" />
                                <Lock className="w-4 h-4 absolute right-4 text-gray-500" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Registered Mobile Number</label>
                            <div className="relative flex items-center">
                                <span className="absolute left-4 text-gray-500 text-sm pointer-events-none select-none">+91</span>
                                <input type="text" disabled value={profile.mobile}
                                    className="w-full bg-gray-900/50 border border-transparent text-gray-400 rounded-xl p-3 pl-12 pr-10 outline-none cursor-not-allowed font-medium" />
                                <Lock className="w-4 h-4 absolute right-4 text-gray-500" />
                            </div>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-1 pl-1">Some details are locked for security purposes.</p>
                    </div>
                </div>

                <div className="bg-graphite border border-white/5 rounded-2xl p-6 shadow-xl shadow-black/20">
                    <h3 className="text-sm font-bold text-white mb-5 flex items-center gap-2 border-b border-white/5 pb-3 uppercase tracking-wider">
                        <div className="w-8 h-8 rounded-lg bg-voltage-yellow/10 flex items-center justify-center text-voltage-yellow">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        Identity & Security
                    </h3>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Username (ID)</label>
                            <div className="relative flex items-center">
                                <span className="absolute left-4 text-gray-500 font-bold pointer-events-none select-none">@</span>
                                <input type="text" disabled value={profile.username}
                                    className="w-full bg-gray-900/50 border border-transparent text-gray-400 rounded-xl p-3 pl-8 pr-10 outline-none cursor-not-allowed font-medium" />
                                <Lock className="w-4 h-4 absolute right-4 text-gray-500" />
                            </div>
                            <p className="text-[10px] text-gray-500 mt-1 pl-1">Username cannot be changed after registration.</p>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Account Passkey</label>
                            <div className="flex items-center justify-between bg-deep-space border border-white/10 shadow-inner rounded-xl p-3">
                                <span className="text-gray-400 tracking-widest font-bold text-sm leading-none">••••</span>
                            <button 
                                onClick={(e) => {
                                    e.preventDefault();
                                    setShowPasskeyModal(true);
                                    setNewPasskey('');
                                    setErrorMsg('');
                                }} 
                                className="text-xs font-bold text-voltage-yellow hover:underline uppercase tracking-wider cursor-pointer font-sans"
                            >
                                Reset Passkey
                            </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Buttons for Profile Editing */}
            <AnimatePresence>
                {isEditing && (
                    <motion.div 
                        initial={{ opacity: 0, y: 50 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        exit={{ opacity: 0, y: 50 }}
                        className="mt-6 flex flex-col sm:flex-row justify-end gap-4 p-4 sm:p-0 bg-graphite sm:bg-transparent rounded-2xl sm:rounded-none border sm:border-none border-white/5 sm:relative fixed bottom-4 left-4 right-4 z-50 shadow-2xl shadow-black/40 sm:shadow-none"
                    >
                        <button 
                            onClick={() => {
                                setIsEditing(false);
                                setFormData({
                                    name: profile.full_name || '',
                                    mobile: profile.mobile || '',
                                    board: profile.board || '',
                                    grade: profile.grade || '',
                                    school: profile.school_name || '',
                                    avatar: profile.avatar_seed || '',
                                });
                            }}
                            disabled={isSaving}
                            className="bg-transparent hover:bg-gray-800 border border-white/10 hover:border-white/20 text-gray-300 px-6 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleSave}
                            disabled={isSaving}
                            className="bg-voltage-yellow hover:bg-yellow-400 text-black px-6 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-[0_0_10px_rgba(255,215,0,0.2)] cursor-pointer disabled:opacity-50"
                        >
                            {isSaving ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-black border-t-transparent"></div>
                            ) : (
                                <span>Save Changes</span>
                            )}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Passkey OTP Modal */}
            <AnimatePresence>
                {showPasskeyModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
                            onClick={() => !isPasskeyLoading && setShowPasskeyModal(false)}
                        ></motion.div>
                        
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-graphite border border-white/5 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl shadow-black/40 relative z-10"
                        >
                            <button 
                                onClick={() => setShowPasskeyModal(false)}
                                className="absolute top-4 right-4 text-gray-400 hover:text-white cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="w-16 h-16 bg-voltage-yellow/10 text-voltage-yellow rounded-full flex items-center justify-center mx-auto mb-4">
                                <Lock className="w-8 h-8 text-voltage-yellow" />
                            </div>

                            <h2 className="text-xl font-black text-white mb-2">Change Passkey</h2>
                            
                            <p className="text-gray-400 text-sm mb-6">
                                Choose a new 4-digit secret passkey.
                            </p>
                            <input
                                type="text"
                                inputMode="numeric"
                                maxLength={4}
                                value={newPasskey}
                                onChange={(e) => setNewPasskey(e.target.value.replace(/\D/g, ''))}
                                className="w-full bg-deep-space border border-white/10 text-white font-black text-center text-3xl tracking-[0.5em] rounded-xl p-4 mb-6 focus:ring-2 focus:ring-voltage-yellow/30 focus:border-voltage-yellow outline-none transition-all shadow-inner"
                                placeholder="0000"
                                autoFocus
                            />
                            <button 
                                onClick={handleSavePasskey}
                                disabled={newPasskey.length !== 4 || isPasskeyLoading}
                                className="w-full bg-voltage-yellow text-black hover:bg-yellow-400 p-3 rounded-xl font-bold text-sm transition-transform focus:outline-none flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 shadow-sm"
                            >
                                {isPasskeyLoading ? 'Saving...' : 'Set New Passkey'}
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
}

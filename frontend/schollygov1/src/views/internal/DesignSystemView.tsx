import React, { useState } from 'react';
import { Logo } from '../../components/ui/Logo';
import { Flame, Trophy, Star, Crown, AlertTriangle, CheckCircle, Info, Loader2 } from 'lucide-react';

export default function DesignSystemView() {
    const [tab, setTab] = useState('Overview');
    
    return (
        <div className="min-h-screen bg-bg-app text-text-primary p-6 md:p-12 overflow-y-auto">
            <div className="max-w-6xl mx-auto space-y-16">
                
                {/* Header */}
                <div className="border-b border-border-subtle pb-8">
                    <Logo className="h-12 mb-6" />
                    <h1 className="text-4xl font-black text-white tracking-wide">Design System <span className="text-brand-primary">Internal Review</span></h1>
                    <p className="text-text-secondary mt-2 text-lg">Current implementation of the SchollyGo visual identity.</p>
                </div>

                {/* 1. Colors */}
                <section>
                    <h2 className="text-2xl font-black text-white mb-6 border-b border-border-subtle/50 pb-2">1. Color Palette</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="space-y-2"><div className="h-20 rounded-xl bg-brand-primary border border-white/10 shadow-gamified-glow"></div><p className="text-sm font-bold">Brand Primary</p><p className="text-xs text-text-muted">#FACC15</p></div>
                        <div className="space-y-2"><div className="h-20 rounded-xl bg-bg-app border border-white/10"></div><p className="text-sm font-bold">Background App</p><p className="text-xs text-text-muted">#080C14</p></div>
                        <div className="space-y-2"><div className="h-20 rounded-xl bg-bg-surface border border-white/10"></div><p className="text-sm font-bold">Surface</p><p className="text-xs text-text-muted">#111827</p></div>
                        <div className="space-y-2"><div className="h-20 rounded-xl bg-bg-surface-elevated border border-white/10"></div><p className="text-sm font-bold">Surface Elevated</p><p className="text-xs text-text-muted">#182131</p></div>
                        <div className="space-y-2"><div className="h-20 rounded-xl bg-semantic-success border border-white/10"></div><p className="text-sm font-bold">Success</p><p className="text-xs text-text-muted">#22C55E</p></div>
                        <div className="space-y-2"><div className="h-20 rounded-xl bg-semantic-error border border-white/10"></div><p className="text-sm font-bold">Error</p><p className="text-xs text-text-muted">#EF4444</p></div>
                        <div className="space-y-2"><div className="h-20 rounded-xl bg-semantic-info border border-white/10"></div><p className="text-sm font-bold">Info</p><p className="text-xs text-text-muted">#38BDF8</p></div>
                        <div className="space-y-2"><div className="h-20 rounded-xl bg-semantic-rank border border-white/10"></div><p className="text-sm font-bold">Rank/Gamification</p><p className="text-xs text-text-muted">#A855F7</p></div>
                    </div>
                </section>

                {/* 2. Typography */}
                <section>
                    <h2 className="text-2xl font-black text-white mb-6 border-b border-border-subtle/50 pb-2">2. Typography Hierarchy</h2>
                    <div className="space-y-6 bg-bg-surface p-8 rounded-2xl border border-border-subtle">
                        <div><h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">Display / H1 Title</h1><p className="text-xs text-text-muted mt-1">text-4xl/5xl font-black tracking-tight</p></div>
                        <div><h2 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-orange-300 drop-shadow-sm">Gamified / H2 Title</h2><p className="text-xs text-text-muted mt-1">text-2xl/3xl font-black bg-clip-text brand-gradient</p></div>
                        <div><h3 className="text-xl font-bold text-white">Section Title / H3</h3><p className="text-xs text-text-muted mt-1">text-xl font-bold text-white</p></div>
                        <div><p className="text-sm text-text-secondary font-semibold">Subheader Description</p><p className="text-xs text-text-muted mt-1">text-sm font-semibold text-text-secondary</p></div>
                        <div><p className="text-sm text-text-primary">Standard body text. This is used for paragraphs and general reading. It uses the Inter font and is colored with the primary text token.</p><p className="text-xs text-text-muted mt-1">text-sm text-text-primary</p></div>
                        <div><label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Form Label</label><p className="text-xs text-text-muted mt-1">text-xs font-semibold uppercase tracking-wider</p></div>
                    </div>
                </section>

                {/* 3. Buttons */}
                <section>
                    <h2 className="text-2xl font-black text-white mb-6 border-b border-border-subtle/50 pb-2">3. Buttons</h2>
                    <div className="flex flex-wrap gap-6 items-center bg-bg-surface p-8 rounded-2xl border border-border-subtle">
                        <button className="bg-brand-primary text-[#080C14] border-b-[4px] border-[#ca8a04] px-6 py-4 rounded-xl text-sm font-black uppercase tracking-widest shadow-[0_5px_15px_rgba(250,204,21,0.2)]">Primary Default</button>
                        <button className="bg-[#FDE047] text-[#080C14] border-b-[4px] border-[#eab308] px-6 py-4 rounded-xl text-sm font-black uppercase tracking-widest shadow-[0_8px_20px_rgba(250,204,21,0.3)] -translate-y-1">Primary Hover</button>
                        <button className="bg-brand-primary text-[#080C14] border-b-[4px] border-[#ca8a04] px-6 py-4 rounded-xl text-sm font-black uppercase tracking-widest opacity-50 cursor-not-allowed">Primary Disabled</button>
                        <button className="bg-bg-surface hover:bg-bg-surface border-2 border-border-subtle/50 hover:border-brand-primary/50 text-white px-6 py-4 rounded-xl text-sm uppercase tracking-widest font-bold shadow-inner transition-all">Secondary Ghost</button>
                    </div>
                </section>

                {/* 4. Inputs */}
                <section>
                    <h2 className="text-2xl font-black text-white mb-6 border-b border-border-subtle/50 pb-2">4. Inputs</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-bg-surface p-8 rounded-2xl border border-border-subtle">
                        <div>
                            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 block">Default State</label>
                            <input type="text" placeholder="Placeholder text" className="w-full text-text-primary text-sm rounded-input block p-3.5 transition-all duration-300 outline-none placeholder-slate-500 border-2 bg-bg-surface hover:bg-bg-surface-elevated/50 border-border-subtle shadow-inner" />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 block">Focus State</label>
                            <input type="text" placeholder="Typing..." defaultValue="User input" className="w-full text-text-primary text-sm rounded-input block p-3.5 transition-all duration-300 outline-none placeholder-slate-500 border-2 bg-bg-surface focus:ring-4 focus:ring-brand-primary/20 border-brand-primary shadow-inner" />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 block">Success State</label>
                            <input type="text" defaultValue="Valid Gamertag" className="w-full text-text-primary text-sm rounded-input block p-3.5 transition-all duration-300 outline-none placeholder-slate-500 border-2 bg-bg-surface border-semantic-success/50 focus:ring-4 focus:ring-semantic-success/20 focus:border-semantic-success shadow-inner" />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 block">Error State</label>
                            <input type="text" defaultValue="Invalid Code" className="w-full text-text-primary text-sm rounded-input block p-3.5 transition-all duration-300 outline-none placeholder-slate-500 border-2 bg-semantic-error/10 border-semantic-error/60 focus:ring-4 focus:ring-semantic-error/20 focus:border-semantic-error shadow-[0_0_15px_rgba(239,68,68,0.2)]" />
                        </div>
                    </div>
                </section>

                {/* 5. Cards & Gamification */}
                <section>
                    <h2 className="text-2xl font-black text-white mb-6 border-b border-border-subtle/50 pb-2">5. Cards & Gamification</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Standard Card */}
                        <div className="bg-bg-surface rounded-2xl border border-border-subtle p-6 shadow-premium">
                            <h3 className="text-xl font-bold text-white mb-2">Standard Card</h3>
                            <p className="text-sm text-text-secondary mb-4">Used for general content blocks and layouts.</p>
                            <div className="h-10 bg-bg-surface-elevated rounded-lg border border-border-subtle"></div>
                        </div>

                        {/* Gamified Card */}
                        <div className="bg-bg-surface rounded-[2rem] border-2 border-b-[6px] border-brand-primary/50 p-6 md:p-8 relative overflow-hidden shadow-[0_8px_30px_rgba(250,204,21,0.15)] group">
                            <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/10 via-orange-500/10 to-brand-primary/10 opacity-50"></div>
                            <div className="relative z-10 flex items-center gap-4">
                                <div className="w-16 h-16 rounded-[1.25rem] bg-bg-surface flex items-center justify-center border-2 border-border-subtle/50 shadow-inner overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/10 to-transparent opacity-50"></div>
                                    <Trophy className="w-8 h-8 text-brand-primary fill-brand-primary" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-orange-300">Level 5 Scholar</h3>
                                    <p className="text-sm font-semibold text-text-secondary">Gamified Elevated Card</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 6. Alerts & Badges */}
                <section>
                    <h2 className="text-2xl font-black text-white mb-6 border-b border-border-subtle/50 pb-2">6. Alerts & Badges</h2>
                    <div className="space-y-6">
                        <div className="flex gap-4">
                            <span className="bg-semantic-rank/10 text-semantic-rank border border-semantic-rank/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Epic Rank</span>
                            <span className="bg-brand-primary/10 text-brand-primary border border-brand-primary/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Active</span>
                            <span className="bg-gradient-to-br from-brand-primary to-orange-400 text-slate-900 px-3 py-1 rounded-xl text-[10px] font-black border border-yellow-300 shadow-[0_0_10px_rgba(250,204,21,0.4)] uppercase tracking-widest">Milestone</span>
                        </div>
                        
                        <div className="bg-semantic-error/5 border border-semantic-error/20 p-4 rounded-xl flex items-center gap-3">
                            <AlertTriangle className="text-semantic-error w-5 h-5" />
                            <p className="text-sm text-semantic-error font-medium">Error state alert banner.</p>
                        </div>
                        <div className="bg-semantic-info/5 border border-semantic-info/20 p-4 rounded-xl flex items-center gap-3">
                            <Info className="text-semantic-info w-5 h-5" />
                            <p className="text-sm text-semantic-info font-medium">Informational alert banner.</p>
                        </div>
                        <div className="bg-semantic-success/5 border border-semantic-success/20 p-4 rounded-xl flex items-center gap-3">
                            <CheckCircle className="text-semantic-success w-5 h-5" />
                            <p className="text-sm text-semantic-success font-medium">Success state alert banner.</p>
                        </div>
                    </div>
                </section>

                {/* 7. Components (Progress, Tabs, Loading) */}
                <section>
                    <h2 className="text-2xl font-black text-white mb-6 border-b border-border-subtle/50 pb-2">7. Common Components</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Progress */}
                        <div className="bg-bg-surface p-6 rounded-2xl border border-border-subtle space-y-4">
                            <h3 className="text-sm font-bold text-text-secondary uppercase">Progress Bar</h3>
                            <div className="w-full bg-bg-surface-elevated rounded-full h-3 border border-border-subtle overflow-hidden">
                                <div className="bg-gradient-to-r from-brand-primary to-orange-400 h-full rounded-full w-[60%] shadow-[0_0_12px_rgba(250,204,21,0.8)]"></div>
                            </div>
                            
                            <h3 className="text-sm font-bold text-text-secondary uppercase mt-6">Step Indicator</h3>
                            <div className="flex gap-1.5">
                                <div className="h-2.5 rounded-full transition-all duration-300 w-8 bg-brand-primary shadow-[0_0_10px_rgba(250,204,21,0.5)]"></div>
                                <div className="h-2.5 rounded-full transition-all duration-300 w-2.5 bg-brand-primary/50"></div>
                                <div className="h-2.5 rounded-full transition-all duration-300 w-2.5 bg-border-subtle"></div>
                            </div>
                        </div>

                        {/* Tabs & Loading */}
                        <div className="bg-bg-surface p-6 rounded-2xl border border-border-subtle space-y-6">
                            <div>
                                <h3 className="text-sm font-bold text-text-secondary uppercase mb-3">Tabs</h3>
                                <div className="flex bg-bg-surface-elevated rounded-xl p-1 border border-border-subtle w-max">
                                    {['Overview', 'Stats'].map(t => (
                                        <button key={t} onClick={() => setTab(t)} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${tab === t ? 'bg-bg-surface text-brand-primary shadow-sm border border-border-subtle' : 'text-text-secondary hover:text-white'}`}>
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            <div>
                                <h3 className="text-sm font-bold text-text-secondary uppercase mb-3">Loading State</h3>
                                <div className="flex items-center gap-3">
                                    <Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
                                    <span className="text-sm text-text-secondary">Loading...</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}

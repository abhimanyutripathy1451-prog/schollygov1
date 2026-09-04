"use client";

import React from 'react';
import { 
  Trophy, TrendingUp, Target, BrainCircuit, ShieldAlert,
  Flame, ChevronRight, Zap, PlayCircle, ShieldCheck
} from 'lucide-react';

export default function LandingPage() {
  const SCHOLLYGO_APP_URL = "http://localhost:3000/app";

  return (
    <div className="min-h-screen bg-app-bg text-app-textMain font-sans overflow-x-hidden selection:bg-app-yellow/30 selection:text-white">
      {/* Glow Effects */}
      <div className="fixed top-[-10%] left-[20%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none z-0"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-app-yellow/5 rounded-full blur-[100px] pointer-events-none z-0"></div>

      {/* Header */}
      <header className="fixed top-0 w-full z-50 backdrop-blur-md bg-app-bg/80 border-b border-app-cardBorder/50">
        <div className="max-w-7xl mx-auto px-6 h-[73px] flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Minimal Logo Representation */}
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-app-yellow to-app-yellowDark flex items-center justify-center font-black text-black text-xl">S</div>
            <span className="font-black text-xl tracking-tight text-white">SchollyGo</span>
          </div>
          <a 
            href={`${SCHOLLYGO_APP_URL}/login`}
            className="px-6 py-2 rounded-full border-2 border-app-cardBorder text-white font-bold hover:bg-app-cardHover hover:border-white transition-all text-sm"
          >
            Login
          </a>
        </div>
      </header>

      <main className="relative z-10 pt-32 pb-20 px-6">
        {/* HERO SECTION */}
        <section className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center min-h-[70vh]">
          <div className="flex flex-col gap-6 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-app-yellow/10 border border-app-yellow/20 text-app-yellow text-xs font-black uppercase tracking-widest w-fit">
              <Zap className="w-4 h-4" /> Next-Gen Learning Arena
            </div>
            <h1 className="text-5xl lg:text-7xl font-black text-white leading-[1.1] tracking-tight">
              Master Your Syllabus. <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-app-yellow to-orange-400">
                Earn Your Rank.
              </span>
            </h1>
            <p className="text-lg lg:text-xl text-app-textMuted max-w-xl font-medium leading-relaxed">
              The premium, distraction-free learning arena where your study time turns into XP. Stop memorizing, start conquering.
            </p>
            <div className="flex flex-wrap items-center gap-4 mt-4">
              <a 
                href={`${SCHOLLYGO_APP_URL}/signup`}
                className="px-8 py-4 bg-app-yellow text-black rounded-xl font-black uppercase tracking-widest hover:bg-app-yellowDark transition-transform hover:-translate-y-1 shadow-[0_0_20px_rgba(251,192,45,0.4)] flex items-center gap-2"
              >
                Start Your Journey <ChevronRight className="w-5 h-5" />
              </a>
              <a 
                href="#features"
                className="px-8 py-4 bg-app-card border-2 border-app-cardBorder text-white rounded-xl font-black uppercase tracking-widest hover:bg-app-cardHover transition-all flex items-center gap-2"
              >
                Explore Features
              </a>
            </div>
          </div>

          {/* Hero Visual Mockup: Compact HUD */}
          <div className="relative flex justify-center lg:justify-end animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="relative w-full max-w-sm rotate-y-[-10deg] rotate-x-[5deg] transform-gpu hover:rotate-0 transition-transform duration-700 ease-out">
              <div className="bg-app-card border-2 border-app-cardBorder/50 rounded-[2rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-b-[6px]">
                
                {/* Mock Rank Badge */}
                <div className="flex flex-col items-center mb-8">
                  <div className="relative w-28 h-28 mb-4">
                    <div className="absolute inset-0 bg-app-yellow/20 rounded-full blur-xl custom-animate-pulse-glow"></div>
                    <div className="relative w-full h-full bg-gradient-to-b from-[#2A3441] to-[#131927] rounded-full border-4 border-app-yellow flex items-center justify-center shadow-inner">
                      <Trophy className="w-12 h-12 text-app-yellow drop-shadow-md" />
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-app-card border-2 border-app-cardBorder w-10 h-10 rounded-full flex items-center justify-center font-black text-sm text-white">
                      6
                    </div>
                  </div>
                  <h3 className="text-xl font-black text-white tracking-widest uppercase">Elite Scholar</h3>
                </div>

                {/* Mock XP Bar */}
                <div className="space-y-2 mb-8">
                  <div className="flex justify-between text-xs font-black uppercase tracking-widest text-app-textMuted">
                    <span>Lvl 6</span>
                    <span>Lvl 7</span>
                  </div>
                  <div className="h-3 bg-app-bg rounded-full overflow-hidden border border-app-cardBorder shadow-inner relative">
                    <div className="absolute top-0 left-0 h-full bg-app-yellow w-[65%] shadow-[0_0_10px_rgba(251,192,45,0.8)]"></div>
                  </div>
                  <div className="text-center text-xs font-bold text-app-yellow">
                    350 XP to next rank
                  </div>
                </div>

                {/* Mock Active Streak */}
                <div className="flex items-center justify-between p-4 bg-app-bg/50 rounded-2xl border border-app-cardBorder/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center border border-orange-500/30">
                      <Flame className="w-5 h-5 text-orange-500" />
                    </div>
                    <div>
                      <div className="text-xs font-black uppercase tracking-widest text-app-textMuted">Current Streak</div>
                      <div className="font-bold text-white">12 Days</div>
                    </div>
                  </div>
                  <div className="text-orange-400 font-black">+10% XP Bonus</div>
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* CORE LOOP SECTION */}
        <section className="max-w-7xl mx-auto py-24 border-t border-app-cardBorder/30 mt-12">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-4">The SchollyGo Core Loop</h2>
            <p className="text-app-textMuted text-lg max-w-2xl mx-auto">A proven PvE architecture designed to build actual mastery without the grind.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="bg-app-card border border-app-cardBorder/50 rounded-[2rem] p-8 hover:bg-app-cardHover transition-colors group">
              <div className="w-14 h-14 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <PlayCircle className="w-7 h-7 text-blue-400" />
              </div>
              <h3 className="text-xl font-black text-white mb-3">1. The Gym</h3>
              <p className="text-app-textMuted text-sm leading-relaxed mb-6">
                Practice without pressure. Warm-up topics grant 0 XP, letting you fail safely and learn the fundamentals before stepping into the arena.
              </p>
              {/* Mockup */}
              <div className="p-3 bg-app-bg rounded-xl border border-app-cardBorder flex justify-between items-center opacity-80">
                <span className="text-xs font-bold text-app-textDark">Warm-up Topic</span>
                <span className="text-xs font-black text-blue-400">0 XP Risk</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-app-card border border-app-cardBorder/50 rounded-[2rem] p-8 hover:bg-app-cardHover transition-colors group relative top-0 md:top-8">
              <div className="w-14 h-14 bg-purple-500/10 border border-purple-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Target className="w-7 h-7 text-purple-400" />
              </div>
              <h3 className="text-xl font-black text-white mb-3">2. The Soft Gate</h3>
              <p className="text-app-textMuted text-sm leading-relaxed mb-6">
                Know when you're ready. The system tracks your Average Topic Mastery and intelligently recommends when it's time to test your skills.
              </p>
              {/* Mockup */}
              <div className="space-y-2 opacity-80">
                <div className="flex justify-between text-xs font-bold text-app-textDark">
                  <span>Topic Mastery</span>
                  <span className="text-purple-400">92% (Ready)</span>
                </div>
                <div className="h-1.5 bg-app-bg rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 w-[92%]"></div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-app-card border border-app-cardBorder/50 rounded-[2rem] p-8 hover:bg-app-cardHover transition-colors group">
              <div className="w-14 h-14 bg-app-yellow/10 border border-app-yellow/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Trophy className="w-7 h-7 text-app-yellow" />
              </div>
              <h3 className="text-xl font-black text-white mb-3">3. The Arena</h3>
              <p className="text-app-textMuted text-sm leading-relaxed mb-6">
                Challenge yourself and earn. Take Adaptive Quizzes where Anti-Farming curves reward genuine knowledge over brute-force guessing.
              </p>
              {/* Mockup */}
              <div className="p-3 bg-app-bg rounded-xl border border-app-cardBorder flex justify-between items-center opacity-80">
                <span className="text-xs font-bold text-app-textDark">Adaptive Quiz</span>
                <span className="text-xs font-black text-app-yellow">+150 XP</span>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURE HIGHLIGHT GRID */}
        <section id="features" className="max-w-7xl mx-auto py-24">
          <div className="mb-12">
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-4">Elite Tooling for Elite Students</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Feature 1 */}
            <div className="bg-app-card border-2 border-app-cardBorder/50 rounded-3xl p-8 flex flex-col justify-between">
              <div>
                <BrainCircuit className="w-10 h-10 text-success-green mb-6" />
                <h3 className="text-xl font-black text-white mb-2">Intelligent Notice Board</h3>
                <p className="text-app-textMuted text-sm leading-relaxed mb-8">
                  Context-aware AI that warns you of XP decay, analyzes your weaknesses, and protects your streak before risks happen.
                </p>
              </div>
              <div className="p-4 bg-app-bg rounded-xl border border-success-green/20">
                <div className="flex items-center gap-2 text-xs font-bold text-success-green mb-1">
                  <ShieldCheck className="w-4 h-4" /> System Alert
                </div>
                <div className="text-xs text-app-textDark">You have 3 weak topics in Physics. Review them to prevent XP decay.</div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-app-card border-2 border-app-cardBorder/50 rounded-3xl p-8 flex flex-col justify-between">
              <div>
                <TrendingUp className="w-10 h-10 text-blue-400 mb-6" />
                <h3 className="text-xl font-black text-white mb-2">Eagle-Eye Analytics</h3>
                <p className="text-app-textMuted text-sm leading-relaxed mb-8">
                  A distraction-free progress HUD that tracks your exact mastery down to the chapter level. Never guess where you stand.
                </p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs bg-app-bg p-3 rounded-lg border border-app-cardBorder/50">
                  <span className="font-bold text-white">Kinematics</span>
                  <span className="font-black text-blue-400">85% Mastery</span>
                </div>
                <div className="flex items-center justify-between text-xs bg-app-bg p-3 rounded-lg border border-app-cardBorder/50">
                  <span className="font-bold text-white">Optics</span>
                  <span className="font-black text-app-textMuted">42% Mastery</span>
                </div>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="bg-app-card border-2 border-app-cardBorder/50 rounded-3xl p-8 flex flex-col justify-between md:col-span-2 lg:col-span-1">
              <div>
                <ShieldAlert className="w-10 h-10 text-error-red mb-6" />
                <h3 className="text-xl font-black text-white mb-2">Anti-Grind Mechanics</h3>
                <p className="text-app-textMuted text-sm leading-relaxed mb-8">
                  Smart decay curves ensure that farming easy questions yields diminishing returns. SchollyGo rewards actual, challenging growth.
                </p>
              </div>
              <div className="p-4 bg-error-red/10 border border-error-red/20 rounded-xl">
                <div className="text-xs font-bold text-error-red flex items-center justify-between">
                  <span>Easy Question Output</span>
                  <span>-75% XP</span>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* FINAL CTA */}
        <section className="max-w-5xl mx-auto py-24 text-center">
          <div className="bg-gradient-to-br from-app-card to-app-bg border-2 border-app-cardBorder rounded-[3rem] p-12 md:p-20 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-app-yellow/10 via-transparent to-transparent"></div>
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">Ready to Enter the Arena?</h2>
              <p className="text-app-textMuted text-lg mb-10 max-w-xl mx-auto">
                Join thousands of students turning their study hours into tangible, gamified progress.
              </p>
              <a 
                href={`${SCHOLLYGO_APP_URL}/signup`}
                className="inline-flex items-center justify-center px-10 py-5 bg-app-yellow text-black rounded-2xl font-black text-lg uppercase tracking-widest hover:bg-yellow-400 transition-transform hover:-translate-y-1 shadow-[0_0_30px_rgba(251,192,45,0.3)] gap-2"
              >
                Create Free Account <ChevronRight className="w-6 h-6" />
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-app-cardBorder bg-app-bg py-12 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded bg-gradient-to-br from-app-yellow to-app-yellowDark flex items-center justify-center font-black text-black text-xs">S</div>
              <span className="font-black text-lg tracking-tight text-white">SchollyGo</span>
            </div>
            <p className="text-app-textDark text-sm max-w-xs leading-relaxed">
              The ultimate gamified learning arena. Master your syllabus and earn your rank.
            </p>
          </div>
          
          <div>
            <h4 className="font-bold text-white mb-4 uppercase tracking-widest text-xs">Legal</h4>
            <ul className="space-y-2 text-sm text-app-textDark">
              <li><a href="#" className="hover:text-app-yellow transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-app-yellow transition-colors">Terms of Service</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold text-white mb-4 uppercase tracking-widest text-xs">Partners</h4>
            <ul className="space-y-2 text-sm text-app-textDark">
              <li><a href="#" className="hover:text-app-yellow transition-colors">B2B Teacher Portal (Soon)</a></li>
              <li><a href="#" className="hover:text-app-yellow transition-colors">Support Center</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-app-cardBorder/50 text-center text-app-textDark text-xs font-medium">
          &copy; {new Date().getFullYear()} SchollyGo. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

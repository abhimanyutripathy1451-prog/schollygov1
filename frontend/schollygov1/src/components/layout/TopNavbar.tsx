import React from 'react';
import { Flame, Zap, Menu } from 'lucide-react';
import { AvatarContainer } from '../ui/AvatarContainer';
import { Logo } from '../ui/Logo';

interface TopNavbarProps {
  player: {
    id: string;
    avatar: string;
    streak: number;
    xp: number;
  };
  onLogout: () => void;
  onNavigate: (route: string) => void;
  onToggleMenu?: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({ player, onNavigate, onToggleMenu }) => {
  return (
    <header className="sticky top-0 z-40 w-full flex items-center justify-between px-4 md:px-6 py-3 h-16 backdrop-blur-md bg-bg-app/80 border-b border-border-subtle/50">
      {/* Left Side: Menu Toggle & Logo (Mobile Only) */}
      <div className="flex items-center gap-3 md:hidden">
        <button 
          onClick={onToggleMenu}
          className="p-1 -ml-1 text-text-secondary hover:text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary rounded"
        >
          <Menu className="w-6 h-6" />
        </button>
        <Logo className="h-6" />
      </div>

      {/* Right Side: Badges (Desktop Only) & Avatar */}
      <div className="flex items-center gap-2 md:gap-3 ml-auto">
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-bg-surface border border-border-subtle shadow-inner">
          <Flame className={`w-4 h-4 ${player.streak > 0 ? 'text-orange-500' : 'text-text-muted'}`} />
          <span className="text-xs font-bold text-white">{player.streak}</span>
        </div>
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-bg-surface border border-border-subtle shadow-inner">
          <Zap className="w-4 h-4 text-brand-primary" />
          <span className="text-xs font-bold text-white">{player.xp}</span>
        </div>
        
        <button
          onClick={() => onNavigate('profile')}
          className="ml-1 flex items-center justify-center rounded-full hover:ring-2 hover:ring-brand-primary/50 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-app cursor-pointer"
        >
          <AvatarContainer size="sm" src={player.avatar} alt={player.id} className="w-8 h-8" />
        </button>
      </div>
    </header>
  );
};

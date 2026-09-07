import React from 'react';
import { LayoutDashboard, TrendingUp, User as UserIcon, Menu, LogOut } from 'lucide-react';
import { Logo } from '../ui/Logo';

interface SidebarProps {
  currentRoute: string;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
  isMobileMenuOpen?: boolean;
  setIsMobileMenuOpen?: (open: boolean) => void;
  onNavigate: (route: string) => void;
  onLogout: () => void;
}

const navItems = [
  { id: 'dashboard', label: 'Basecamp', icon: LayoutDashboard },
  { id: 'analytics', label: 'Progress', icon: TrendingUp },
  { id: 'profile', label: 'Profile', icon: UserIcon },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentRoute,
  isSidebarCollapsed,
  setIsSidebarCollapsed,
  isMobileMenuOpen = false,
  setIsMobileMenuOpen,
  onNavigate,
  onLogout,
}) => {
  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileMenuOpen?.(false)}
        />
      )}
      
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-bg-app transform transition-transform duration-300 ease-in-out
        flex md:relative md:translate-x-0 flex-col justify-between border-r border-border-subtle
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        ${isSidebarCollapsed ? 'md:w-[80px]' : 'md:w-64'}
      `}>
      <div>
        {/* Logo / Brand */}
        <div className="flex items-center justify-between mb-8 px-5 py-4 border-b border-border-subtle/50 h-[73px]">
          {!isSidebarCollapsed ? (
            <div className="flex items-center justify-between w-full">
              <Logo className="h-8" />
              <button 
                onClick={() => setIsSidebarCollapsed(true)} 
                className="w-8 h-8 rounded-lg bg-bg-surface-elevated flex items-center justify-center border border-border-subtle cursor-pointer hover:bg-bg-surface-elevated transition-colors shrink-0 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                title="Collapse sidebar"
              >
                 <Menu className="w-4 h-4 text-text-secondary group-hover:text-brand-primary transition-colors" />
              </button>
            </div>
          ) : (
            <div className="w-full flex justify-center">
              <button 
                onClick={() => setIsSidebarCollapsed(false)}
                className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-text-secondary bg-bg-app border border-border-subtle shadow-inner hover:bg-bg-surface-elevated hover:text-brand-primary transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                title="Expand sidebar"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        <nav className="space-y-1.5 px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentRoute === item.id;
            return (
              <button
                key={item.id}
                title={isSidebarCollapsed ? item.label : undefined}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3'} font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-inset ${
                  isActive 
                    ? 'bg-bg-surface-elevated text-brand-primary border-l-4 border-brand-primary rounded-r-lg rounded-l-none' 
                    : 'text-text-secondary border-l-4 border-transparent hover:bg-bg-surface-elevated/50 hover:text-white rounded-r-lg rounded-l-none'
                }`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-brand-primary' : 'opacity-70'}`} />
                {!isSidebarCollapsed && <span className="truncate tracking-wide">{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto px-4 pb-6 space-y-4">
        <button
          onClick={onLogout}
          title={isSidebarCollapsed ? 'Log Out' : undefined}
          className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3'} font-bold transition-all duration-200 text-semantic-error/80 hover:bg-semantic-error/10 hover:text-semantic-error rounded-lg cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-semantic-error focus-visible:ring-inset`}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!isSidebarCollapsed && <span className="truncate tracking-wide">Log Out</span>}
        </button>

        {!isSidebarCollapsed ? (
          <div className="text-xs text-text-secondary/70 text-center font-medium pt-2 border-t border-border-subtle/30">
            &copy; {new Date().getFullYear()} SchollyGo.<br/>All rights reserved.
          </div>
        ) : (
          <div className="text-[10px] text-text-secondary/70 text-center font-medium pt-2 border-t border-border-subtle/30">
            &copy; {new Date().getFullYear()}
          </div>
        )}
      </div>
    </aside>
    </>
  );
};

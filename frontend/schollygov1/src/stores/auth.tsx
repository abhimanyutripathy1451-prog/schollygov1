import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { getRankTitle } from '../utils/gamification';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    updateUser: (data: Partial<User>) => void;
    fetchUser: () => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuthStore = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuthStore must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const API_BASE_URL = import.meta.env.VITE_API_URL || '';

    const fetchUser = async () => {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) {
            setUser(null);
            setIsLoading(false);
            return;
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            
            const response = await fetch(`${API_BASE_URL}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (response.ok) {
                const data = await response.json();
                const sessionPacket = {
                    id: data.id || data.student_id,
                    username: data.username,
                    fullName: data.full_name,
                    curriculum_code: data.curriculum_code,
                    grade: data.grade,
                    xp: data.total_xp,
                    avatar: data.avatar_seed || data.username,
                    level: data.computed_level || 1,
                    rankTitle: getRankTitle(data.computed_level || 1),
                    nextLevelXp: data.next_level_xp || 2000,
                    xpWithinLevel: data.xpWithinLevel !== undefined ? data.xpWithinLevel : (data.total_xp || 0),
                    progress: data.level_progress_percentage || 0,
                    streak: data.current_streak || 0,
                };
                setUser(sessionPacket as any);
            } else {
                localStorage.removeItem('token');
                localStorage.removeItem('access_token');
                sessionStorage.removeItem('token');
                sessionStorage.removeItem('access_token');
                setUser(null);
            }
        } catch (err: any) {
            console.error('Failed to fetch user due to network or server error', err);
            // Do not clear tokens or log out for transient network/server connectivity issues.
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUser();
    }, []);

    const updateUser = (data: Partial<User>) => {
        setUser((prev) => (prev ? { ...prev, ...data } : null));
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('access_token');
        localStorage.removeItem('student_id');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('access_token');
        sessionStorage.removeItem('student_id');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, updateUser, fetchUser, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

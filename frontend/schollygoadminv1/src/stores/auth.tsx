import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';

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
            // Removed /auth/me fetch as requested
            // We set a placeholder partner session so the App.tsx route guard doesn't log the user out.
            setUser({
                id: 'partner',
                username: 'Partner',
                fullName: 'Partner Admin',
                role: 'partner'
            } as any);
        } catch (err: any) {
            console.error('Failed to fetch user', err);
            localStorage.removeItem('token');
            localStorage.removeItem('access_token');
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('access_token');
            setUser(null);
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

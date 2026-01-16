import { useState, useEffect, createContext, useContext, type ReactNode } from 'react';

interface AuthContextType {
    isAuthenticated: boolean;
    login: (password: string) => boolean;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Simple password - change this to your preferred password
const SITE_PASSWORD = 'books2026';

export function AuthProvider({ children }: { children: ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        // Check if already logged in from session
        const auth = sessionStorage.getItem('book-auth');
        if (auth === 'true') {
            setIsAuthenticated(true);
        }
    }, []);

    const login = (password: string): boolean => {
        if (password === SITE_PASSWORD) {
            setIsAuthenticated(true);
            sessionStorage.setItem('book-auth', 'true');
            return true;
        }
        return false;
    };

    const logout = () => {
        setIsAuthenticated(false);
        sessionStorage.removeItem('book-auth');
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}

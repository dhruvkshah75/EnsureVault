"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Role = "customer" | "admin" | "agent" | null;

export interface AuthUser {
    name: string;
    role: Role;
    user_id: number;
    customer_id?: number;
}

interface AuthContextType {
    user: AuthUser | null;
    login: (role: Role, info: Omit<AuthUser, "role">) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    login: () => { },
    logout: () => { },
});

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);

    useEffect(() => {
        // Defer so setState is not called synchronously inside an effect
        const t = setTimeout(() => {
            try {
                const stored = localStorage.getItem("ev_user");
                if (stored) setUser(JSON.parse(stored));
            } catch {
                // ignore malformed storage
            }
        }, 0);
        return () => clearTimeout(t);
    }, []);

    const login = (role: Role, info: Omit<AuthUser, "role">) => {
        if (!role) return;
        const u: AuthUser = { ...info, role };
        localStorage.setItem("ev_user", JSON.stringify(u));
        setUser(u);
    };

    const logout = () => {
        localStorage.removeItem("ev_user");
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);

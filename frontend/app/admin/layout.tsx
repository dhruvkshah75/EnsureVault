"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // Allow a tick for localStorage hydration, then guard
        const timer = setTimeout(() => {
            if (!user) {
                router.replace("/auth/login");
            } else if (user.role === "customer") {
                // Customers are blocked from all /admin routes
                router.replace("/customer/dashboard");
            }
        }, 100);
        return () => clearTimeout(timer);
    }, [user, router]);

    // While checking auth, show nothing to avoid flash
    if (!user || user.role === "customer") {
        return (
            <div className="flex items-center justify-center py-40 text-muted-foreground">
                <span>Checking permissions...</span>
            </div>
        );
    }

    return <>{children}</>;
}

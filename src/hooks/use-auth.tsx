
"use client";

import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter, usePathname } from "next/navigation";

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    
    // Temporarily bypass auth for development without backend config
    // const mockUser = { email: "test@example.com" } as User;
    // setUser(mockUser);
    // setLoading(false);


    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/signup');
    const isProtectedRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/admin');
    
    if (loading) return;

    if (user) {
        // If user is logged in, redirect from auth routes
        if (isAuthRoute) {
            // Special case for admin user
            if (user.email === "admin@example.com") {
                router.push('/admin');
            } else {
                router.push('/dashboard');
            }
        }
    } else {
        // If user is not logged in, redirect from protected routes
        if (isProtectedRoute) {
            router.push('/login');
        }
    }

  }, [user, loading, pathname, router]);


  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

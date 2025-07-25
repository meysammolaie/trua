
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
      // Temporarily bypass Firebase auth for development without backend config
      // setUser(user);
      // setLoading(false);
    });
    
    // Mock user for development
    const mockUser = { email: "test@example.com" } as User;
    setUser(mockUser);
    setLoading(false);


    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/signup');
    // For development, we assume user is always logged in, so if they are on an auth route, redirect them.
    if (!loading && user && isAuthRoute) {
       router.push("/dashboard");
    }

    const isProtectedRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/admin');
    if (!loading && !user && isProtectedRoute) {
      router.push("/login");
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

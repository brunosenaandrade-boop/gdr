"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

type AuthContextType = {
  user: User | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Carrega sessao inicial
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    // Escuta mudancas de sessao (login, logout, token refresh, expiracao)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (event === "SIGNED_OUT" || event === "TOKEN_REFRESHED" && !session) {
          router.push("/login");
        }
      },
    );

    return () => subscription.unsubscribe();
  }, [router, supabase]);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

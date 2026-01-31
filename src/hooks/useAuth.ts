import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { isAdminEmail, signIn as authSignIn, signOut as authSignOut } from "@/lib/auth";
import type { User, Session } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    isAuthenticated: false,
    isAdmin: false,
  });

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const user = session?.user ?? null;
        const isAdmin = isAdminEmail(user?.email);
        
        setState({
          user,
          session,
          loading: false,
          isAuthenticated: !!session,
          isAdmin,
        });
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user ?? null;
      const isAdmin = isAdminEmail(user?.email);
      
      setState({
        user,
        session,
        loading: false,
        isAuthenticated: !!session,
        isAdmin,
      });
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const result = await authSignIn(email, password);
    
    if (result.error) {
      return { error: { message: result.error } };
    }

    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    await authSignOut();
  }, []);

  const checkAuth = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user ?? null;
    const isAdmin = isAdminEmail(user?.email);
    
    setState({
      user,
      session,
      loading: false,
      isAuthenticated: !!session,
      isAdmin,
    });
  }, []);

  return {
    ...state,
    signIn,
    signOut,
    checkAuth,
  };
}

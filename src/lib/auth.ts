import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

// Admin email allowlist - only these emails can access admin features
// This is checked on both frontend AND backend (Edge Functions)
export const ADMIN_EMAILS = [
  "admin@bntoon.com",
  "bntoonweb@gmail.com",
];

export function isAdminEmail(email: string | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase().trim());
}

export async function signIn(
  email: string,
  password: string
): Promise<{ user: User | null; error: string | null }> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error) {
    return { user: null, error: error.message };
  }

  // Check if user is an admin
  if (!isAdminEmail(data.user?.email)) {
    await supabase.auth.signOut();
    return { user: null, error: "Access denied. Admin privileges required." };
  }

  return { user: data.user, error: null };
}

export async function signUp(
  email: string,
  password: string
): Promise<{ user: User | null; error: string | null }> {
  // Only allow admin emails to sign up
  if (!isAdminEmail(email)) {
    return { user: null, error: "Access denied. Admin privileges required." };
  }

  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/admin`,
    },
  });

  if (error) {
    return { user: null, error: error.message };
  }

  return { user: data.user, error: null };
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

export async function getSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function getUser(): Promise<User | null> {
  const { data } = await supabase.auth.getUser();
  return data.user;
}

// Get the current access token for API calls
export async function getAccessToken(): Promise<string | null> {
  const session = await getSession();
  return session?.access_token ?? null;
}

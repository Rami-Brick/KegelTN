import { supabase } from '../lib/supabase';

const EMAIL_DOMAIN = 'kegeltn.app';

/**
 * Converts an access key to the fake email format
 * e.g., "test-key-001" → "test-key-001@kegeltn.app"
 */
function keyToEmail(accessKey: string): string {
  return `${accessKey.toLowerCase().trim()}@${EMAIL_DOMAIN}`;
}

/**
 * Log in with an access key
 */
export async function loginWithKey(accessKey: string) {
  const email = keyToEmail(accessKey);

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: accessKey.toLowerCase().trim(),
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Log out the current user
 */
export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Get the current session (returns null if not logged in)
 */
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw new Error(error.message);
  }
  return data.session;
}

/**
 * Listen for auth state changes (login, logout, token refresh)
 */
export function onAuthStateChange(callback: (session: any) => void) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
}
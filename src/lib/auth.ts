import { supabase } from "@/integrations/supabase/client";

/** Turn any Supabase/network failure into a sentence a human can act on. */
export function authErrorMessage(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err ?? "");
  const code =
    err && typeof err === "object" && "code" in err ? String((err as { code: unknown }).code) : "";
  const m = raw.toLowerCase();

  if (m.includes("missing supabase environment"))
    return "Pulse can't reach its backend right now. Please reload in a moment.";
  if (code === "invalid_credentials" || m.includes("invalid login credentials"))
    return "That email and password don't match an account.";
  if (code === "email_not_confirmed" || m.includes("email not confirmed"))
    return "Confirm your email first — check your inbox for the Pulse link.";
  if (code === "weak_password" || m.includes("known to be weak") || m.includes("pwned"))
    return "That password has shown up in known breaches. Pick a less common one.";
  if (m.includes("password should be at least"))
    return "Use at least 6 characters for your password.";
  if (code === "user_already_exists" || m.includes("already registered"))
    return "An account already uses that email. Try signing in instead.";
  if (code === "over_email_send_rate_limit" || m.includes("rate limit"))
    return "Too many attempts just now. Wait a minute and try again.";
  if (m.includes("duplicate key") && m.includes("username"))
    return "That username is taken — try another handle.";
  if (m.includes("failed to fetch") || m.includes("networkerror"))
    return "Network hiccup. Check your connection and try again.";
  return raw || "Something went wrong. Try again?";
}

/** Full sign-out: clears the session and any locally cached identity. */
export async function signOutEverywhere() {
  try {
    await supabase.auth.signOut();
  } catch {
    /* even if the network call fails, local storage is cleared below */
  }
  if (typeof window !== "undefined") {
    Object.keys(window.localStorage)
      .filter((k) => k.startsWith("sb-") && k.endsWith("-auth-token"))
      .forEach((k) => window.localStorage.removeItem(k));
  }
}

export function normalizeUsername(value: string) {
  return value.trim().replace(/[^a-zA-Z0-9_]/g, "").toLowerCase();
}

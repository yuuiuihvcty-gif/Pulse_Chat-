import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, AtSign, Check, KeyRound, Loader2, Mail, MailCheck, User } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { authErrorMessage, normalizeUsername } from "@/lib/auth";
import { useSession } from "@/hooks/use-session";
import { ParallaxScene } from "@/components/pulse/illo/Scene";
import { BubbleObject, PulseCreature, type CreatureMood, type LookDir } from "@/components/pulse/illo/PulseCreature";
import { SPRING, DUR, EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in to Pulse — The Living Messenger" },
      {
        name: "description",
        content:
          "Join Pulse, the illustrated messenger where every message, reaction and voice note feels alive.",
      },
      { property: "og:title", content: "Sign in to Pulse — The Living Messenger" },
      {
        property: "og:description",
        content: "Join Pulse, the illustrated messenger where messaging feels alive.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

type Field = "email" | "password" | "name" | "username" | null;
type Mode = "in" | "up" | "forgot";

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading: sessionLoading } = useSession();
  const [mode, setMode] = useState<Mode>("in");
  const [focus, setFocus] = useState<Field>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [form, setForm] = useState({ email: "", password: "", name: "", username: "" });

  // Already signed in? Go straight to the app — never show the form twice.
  useEffect(() => {
    if (!sessionLoading && user) void navigate({ to: "/chats", replace: true });
  }, [sessionLoading, user, navigate]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setForm((f) => ({ ...f, [k]: e.target.value }));
  };

  const mood: CreatureMood = done
    ? "celebrate"
    : focus === "password"
      ? "shy"
      : busy
        ? "typing"
        : focus
          ? "happy"
          : "wave";

  const look: LookDir =
    focus === "email" || focus === "name" ? "down" : focus === "username" ? "right" : "center";

  const enter = () => {
    setDone(true);
    // Session is real at this point; the tiny delay is only for the celebrate beat.
    setTimeout(() => void navigate({ to: "/chats", replace: true }), 520);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      if (mode === "forgot") {
        const { error: err } = await supabase.auth.resetPasswordForEmail(form.email.trim(), {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (err) throw err;
        setNotice(`We sent a reset link to ${form.email.trim()}.`);
        setBusy(false);
        return;
      }

      if (mode === "in") {
        const { data, error: err } = await supabase.auth.signInWithPassword({
          email: form.email.trim(),
          password: form.password,
        });
        if (err) throw err;
        if (!data.session) throw new Error("Email not confirmed");
        enter();
        return;
      }

      const username = normalizeUsername(form.username);
      if (!form.name.trim()) throw new Error("Add your display name first");
      if (username.length < 3) throw new Error("Pick a username with at least 3 characters");

      const { data, error: err } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: {
          emailRedirectTo: `${window.location.origin}/chats`,
          data: { display_name: form.name.trim(), username },
        },
      });
      if (err) throw err;

      if (data.session) {
        enter();
        return;
      }
      // Email confirmation is required — do NOT pretend the user is in.
      setNotice(
        `Almost there — confirm ${form.email.trim()} using the link we just emailed you, then sign in.`,
      );
      setMode("in");
      setBusy(false);
    } catch (err) {
      const message = authErrorMessage(err);
      setError(message);
      toast.error(message);
      setBusy(false);
    }
  };

  const google = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) throw result.error;
      if (result.redirected) return; // browser is navigating to Google
      const { data } = await supabase.auth.getSession();
      if (!data.session) throw new Error("Google sign-in didn't complete. Try again.");
      enter();
    } catch (err) {
      const message = authErrorMessage(err);
      setError(message);
      toast.error(message);
      setBusy(false);
    }
  };

  const title = mode === "in" ? "Welcome back" : mode === "up" ? "Make your Pulse" : "Reset password";
  const subtitle =
    mode === "in"
      ? "Your conversations are waiting."
      : mode === "up"
        ? "A name, a handle, and you're alive here."
        : "We'll email you a link to set a new password.";

  return (
    <ParallaxScene className="min-h-screen" intensity={1.4}>
      <main className="relative mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-5 py-10">
        {/* FOREGROUND — the Pulse creature reacting to the form */}
        <div className="relative mx-auto mb-[-26px] h-44 w-52">
          <BubbleObject className="absolute -left-6 top-0 w-16" tone="cyan" delay={0.3} />
          <BubbleObject className="absolute -right-4 top-6 w-12" tone="orchid" delay={1.1} />
          <div className="absolute inset-x-8 bottom-0 top-6">
            <PulseCreature mood={mood} look={look} />
          </div>
          <AnimatePresence>
            {done && (
              <motion.span
                initial={{ scale: 0, opacity: 0.9 }}
                animate={{ scale: 3.2, opacity: 0 }}
                transition={{ duration: DUR.cinematic, ease: EASE }}
                className="absolute inset-x-10 bottom-6 top-10 rounded-full border-4 border-brand"
              />
            )}
          </AnimatePresence>
        </div>

        {/* UI — authentication panel integrated in the illustrated world */}
        <motion.section
          layout
          transition={SPRING.settle}
          className="relative rounded-[28px] border border-border bg-surface/85 p-5 shadow-float backdrop-blur-xl"
        >
          <header className="mb-5 text-center">
            <h1 className="font-display text-[32px] font-bold leading-tight tracking-tight">
              {title}
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
          </header>

          <AnimatePresence initial={false}>
            {notice && (
              <motion.p
                key="notice"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-3 flex items-start gap-2 rounded-2xl border border-brand/30 bg-brand-soft px-3 py-2.5 text-[13px] text-foreground"
              >
                <MailCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                {notice}
              </motion.p>
            )}
            {error && (
              <motion.p
                key="error"
                role="alert"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-3 rounded-2xl border border-destructive/35 bg-destructive/10 px-3 py-2.5 text-[13px] font-medium text-destructive"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <form onSubmit={submit} className="space-y-3">
            <AnimatePresence initial={false} mode="popLayout">
              {mode === "up" && (
                <motion.div
                  key="identity"
                  layout
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3 overflow-hidden"
                >
                  <PulseField
                    icon={<User className="h-4 w-4" />}
                    label="Display name"
                    value={form.name}
                    onChange={set("name")}
                    onFocus={() => setFocus("name")}
                    onBlur={() => setFocus(null)}
                    autoComplete="name"
                  />
                  <PulseField
                    icon={<AtSign className="h-4 w-4" />}
                    label="Username"
                    value={form.username}
                    onChange={set("username")}
                    onFocus={() => setFocus("username")}
                    onBlur={() => setFocus(null)}
                    autoComplete="username"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <PulseField
              icon={<Mail className="h-4 w-4" />}
              label="Email"
              type="email"
              value={form.email}
              onChange={set("email")}
              onFocus={() => setFocus("email")}
              onBlur={() => setFocus(null)}
              autoComplete="email"
            />
            <AnimatePresence initial={false} mode="popLayout">
              {mode !== "forgot" && (
                <motion.div
                  key="pw"
                  layout
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <PulseField
                    icon={<KeyRound className="h-4 w-4" />}
                    label="Password"
                    type="password"
                    value={form.password}
                    onChange={set("password")}
                    onFocus={() => setFocus("password")}
                    onBlur={() => setFocus(null)}
                    autoComplete={mode === "in" ? "current-password" : "new-password"}
                    minLength={6}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {mode === "in" && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setMode("forgot");
                    setError(null);
                    setNotice(null);
                  }}
                  className="text-xs font-semibold text-brand underline-offset-4 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <motion.button
              type="submit"
              disabled={busy}
              whileTap={{ scale: 0.96, y: 1 }}
              transition={SPRING.press}
              className="mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand text-[15px] font-semibold text-brand-foreground shadow-soft disabled:opacity-70"
            >
              <AnimatePresence mode="wait" initial={false}>
                {done ? (
                  <motion.span key="ok" initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="flex items-center gap-2">
                    <Check className="h-5 w-5" /> You're in
                  </motion.span>
                ) : busy ? (
                  <motion.span key="busy" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {mode === "in" ? "Signing in…" : mode === "up" ? "Creating…" : "Sending…"}
                  </motion.span>
                ) : (
                  <motion.span key="go" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                    {mode === "in" ? "Sign in" : mode === "up" ? "Create my Pulse" : "Send reset link"}
                    <ArrowRight className="h-4 w-4" />
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </form>

          {mode !== "forgot" && (
            <>
              <div className="my-4 flex items-center gap-3 text-[11px] uppercase tracking-widest text-muted-foreground">
                <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
              </div>

              <motion.button
                type="button"
                onClick={google}
                disabled={busy}
                whileTap={{ scale: 0.96, y: 1 }}
                transition={SPRING.press}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-full border border-border bg-surface-2 text-sm font-medium press disabled:opacity-60"
              >
                <GoogleMark /> Continue with Google
              </motion.button>
            </>
          )}

          <p className="mt-5 text-center text-sm text-muted-foreground">
            {mode === "forgot" ? (
              <button
                type="button"
                onClick={() => {
                  setMode("in");
                  setError(null);
                }}
                className="font-semibold text-brand underline-offset-4 hover:underline"
              >
                Back to sign in
              </button>
            ) : (
              <>
                {mode === "in" ? "New to Pulse?" : "Already have a Pulse?"}{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode((m) => (m === "in" ? "up" : "in"));
                    setError(null);
                    setNotice(null);
                  }}
                  className="font-semibold text-brand underline-offset-4 hover:underline"
                >
                  {mode === "in" ? "Create an account" : "Sign in"}
                </button>
              </>
            )}
          </p>
        </motion.section>
      </main>
    </ParallaxScene>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" className="h-4 w-4" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.7-6.7C35.5 2.4 30.1 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6.1C12.3 13.2 17.6 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.15-3.2-.44-4.7H24v9.3h12.6c-.55 2.9-2.2 5.3-4.7 7l7.6 5.9c4.4-4.1 7-10.1 7-17.5z" />
      <path fill="#FBBC05" d="M10.4 28.7A14.6 14.6 0 0 1 9.6 24c0-1.6.3-3.2.8-4.7l-7.8-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.8l7.8-6.1z" />
      <path fill="#34A853" d="M24 48c6.1 0 11.3-2 15.1-5.5l-7.6-5.9c-2.1 1.4-4.8 2.3-7.5 2.3-6.4 0-11.7-3.7-13.6-9.2l-7.8 6.1C6.5 42.6 14.6 48 24 48z" />
    </svg>
  );
}

function PulseField({
  icon,
  label,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { icon: React.ReactNode; label: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 ml-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="flex items-center gap-2 rounded-2xl border border-input bg-surface-2 px-3 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/25">
        <span className="text-muted-foreground">{icon}</span>
        <input
          {...props}
          required
          className={cn(
            "h-11 w-full min-w-0 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground",
            className,
          )}
        />
      </span>
    </label>
  );
}

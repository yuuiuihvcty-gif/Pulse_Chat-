import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ArrowRight, Check, KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { authErrorMessage } from "@/lib/auth";
import { ParallaxScene } from "@/components/pulse/illo/Scene";
import { PulseCreature } from "@/components/pulse/illo/PulseCreature";
import { SPRING } from "@/lib/motion";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Choose a new password — Pulse" },
      { name: "description", content: "Set a new password for your Pulse account." },
      { property: "og:title", content: "Choose a new password — Pulse" },
      { property: "og:description", content: "Set a new password for your Pulse account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The recovery link puts a session in place (either via hash tokens or PKCE).
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => setReady(!!data.session));
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setError(null);
    if (password.length < 6) return setError("Use at least 6 characters.");
    if (password !== confirm) return setError("Those two passwords don't match.");
    setBusy(true);
    try {
      const { error: err } = await supabase.auth.updateUser({ password });
      if (err) throw err;
      setDone(true);
      toast.success("Password updated");
      setTimeout(() => void navigate({ to: "/chats", replace: true }), 700);
    } catch (err) {
      const message = authErrorMessage(err);
      setError(message);
      toast.error(message);
      setBusy(false);
    }
  };

  return (
    <ParallaxScene className="min-h-screen" intensity={1.2}>
      <main className="relative mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-5 py-10">
        <div className="relative mx-auto mb-[-26px] h-40 w-48">
          <div className="absolute inset-x-8 bottom-0 top-4">
            <PulseCreature mood={done ? "celebrate" : "shy"} look="center" />
          </div>
        </div>

        <motion.section
          layout
          transition={SPRING.settle}
          className="rounded-[28px] border border-border bg-surface/85 p-5 shadow-float backdrop-blur-xl"
        >
          <h1 className="text-center font-display text-[28px] font-bold leading-tight tracking-tight">
            New password
          </h1>
          <p className="mt-1.5 text-center text-sm text-muted-foreground">
            {ready
              ? "Choose something only you would guess."
              : "Open this page from the reset link in your email."}
          </p>

          {error && (
            <p role="alert" className="mt-3 rounded-2xl border border-destructive/35 bg-destructive/10 px-3 py-2.5 text-[13px] font-medium text-destructive">
              {error}
            </p>
          )}

          <form onSubmit={submit} className="mt-4 space-y-3">
            <Field value={password} onChange={(e) => setPassword(e.target.value)} label="New password" disabled={!ready} />
            <Field value={confirm} onChange={(e) => setConfirm(e.target.value)} label="Confirm password" disabled={!ready} />
            <motion.button
              type="submit"
              disabled={busy || !ready}
              whileTap={{ scale: 0.96, y: 1 }}
              transition={SPRING.press}
              className="mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand text-[15px] font-semibold text-brand-foreground shadow-soft disabled:opacity-60"
            >
              {done ? (
                <>
                  <Check className="h-5 w-5" /> Saved
                </>
              ) : busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving…
                </>
              ) : (
                <>
                  Update password <ArrowRight className="h-4 w-4" />
                </>
              )}
            </motion.button>
          </form>
        </motion.section>
      </main>
    </ParallaxScene>
  );
}

function Field({
  label,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 ml-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="flex items-center gap-2 rounded-2xl border border-input bg-surface-2 px-3 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/25">
        <KeyRound className="h-4 w-4 text-muted-foreground" />
        <input
          {...props}
          type="password"
          required
          autoComplete="new-password"
          minLength={6}
          className={cn(
            "h-11 w-full min-w-0 bg-transparent text-[15px] outline-none disabled:opacity-50",
            className,
          )}
        />
      </span>
    </label>
  );
}

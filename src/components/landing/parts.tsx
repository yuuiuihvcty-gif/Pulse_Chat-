import { Link } from "@tanstack/react-router";
import { motion, useScroll, useTransform } from "motion/react";
import { useRef, type ReactNode } from "react";

/* ---------------------------------- nav ---------------------------------- */

export function LandingNav() {
  return (
    <header className="fixed inset-x-0 top-0 z-40">
      <nav className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-5 md:px-10">
        <Link to="/" className="flex items-center gap-2.5">
          <LoopMark className="h-5 w-5" />
          <span className="font-editorial text-[13px] tracking-[0.2em] text-editorial uppercase">Iris</span>
        </Link>
        <ul className="hidden items-center gap-8 md:flex">
          {["Studio", "Craft", "Index", "Journal"].map((i) => (
            <li key={i}>
              <span className="editorial-label cursor-default transition-colors hover:text-editorial">{i}</span>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-3">
          <Link to="/auth" className="editorial-label hidden hover:text-editorial sm:block">
            Sign in
          </Link>
          <Link
            to="/chats"
            className="press rounded-full bg-editorial px-4 py-2 font-editorial text-[11px] tracking-[0.14em] text-canvas uppercase"
          >
            Open Pulse
          </Link>
        </div>
      </nav>
    </header>
  );
}

export function LoopMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="loopMark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--iris-cyan)" />
          <stop offset="50%" stopColor="var(--iris-blue)" />
          <stop offset="100%" stopColor="var(--iris-pink)" />
        </linearGradient>
      </defs>
      {[
        [16, 16],
        [32, 16],
        [16, 32],
        [32, 32],
      ].map(([cx, cy], i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r="9"
          fill="none"
          stroke="url(#loopMark)"
          strokeWidth="3.4"
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}

/* ------------------------- scroll-reveal container ------------------------ */

export function Act({
  children,
  className = "",
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const opacity = useTransform(scrollYProgress, [0, 0.26, 0.72, 1], [0, 1, 1, 0]);
  const y = useTransform(scrollYProgress, [0, 0.26, 0.72, 1], [46, 0, 0, -46]);

  return (
    <section ref={ref} id={id} className={`relative flex min-h-screen w-full ${className}`}>
      <motion.div style={{ opacity, y }} className="relative w-full">
        {children}
      </motion.div>
    </section>
  );
}

/* ------------------------------ small pieces ----------------------------- */

export function Tick({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="h-[5px] w-[5px] rounded-full bg-iris-blue" />
      <span className="editorial-label">{label}</span>
    </div>
  );
}

export function MiniCard({
  title,
  meta,
  bars = 3,
  tone = "cyan",
}: {
  title: string;
  meta: string;
  bars?: number;
  tone?: "cyan" | "pink" | "orange";
}) {
  const tint =
    tone === "pink" ? "var(--iris-pink)" : tone === "orange" ? "var(--iris-orange)" : "var(--iris-cyan)";
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 420, damping: 30 }}
      className="glass-panel w-[168px] rounded-2xl p-3"
    >
      <div className="flex items-center justify-between">
        <span className="font-editorial text-[11px] tracking-tight text-editorial">{title}</span>
        <span className="h-2 w-2 rounded-full" style={{ background: tint }} />
      </div>
      <div className="mt-3 space-y-1.5">
        {Array.from({ length: bars }).map((_, i) => (
          <div
            key={i}
            className="h-1 rounded-full"
            style={{
              width: `${92 - i * 22}%`,
              background: `color-mix(in oklab, ${tint} ${70 - i * 14}%, transparent)`,
            }}
          />
        ))}
      </div>
      <div className="editorial-label mt-3">{meta}</div>
    </motion.div>
  );
}

export function EdgeMeta({ left, right }: { left: string; right: string }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-between px-6 md:px-10">
      <span className="editorial-label">{left}</span>
      <span className="editorial-label">{right}</span>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useMotionValueEvent, useScroll, useTransform } from "motion/react";
import { useRef, useState } from "react";

import { Atmosphere } from "@/components/landing/Atmosphere";
import { Humanoid, POSES, type Pose } from "@/components/landing/Humanoid";
import { Act, EdgeMeta, LandingNav, LoopMark, MiniCard, Tick } from "@/components/landing/parts";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Iris — The clarity your business has been missing" },
      {
        name: "description",
        content:
          "Iris is a generative design studio: an editorial, motion-first experience for visionaries shaping tomorrow's digital landscapes.",
      },
      { property: "og:title", content: "Iris — The clarity your business has been missing" },
      {
        property: "og:description",
        content: "A scroll-driven editorial experience: generative art, translucent form, quiet clarity.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

/** Figure choreography, one entry per act of the scroll sequence. */
const ACTS: { pose: Pose; figX: string; blur: number; opacity: number }[] = [
  { pose: POSES.hero!, figX: "26%", blur: 0, opacity: 1 },
  { pose: POSES.reach!, figX: "18%", blur: 0, opacity: 1 },
  { pose: POSES.close!, figX: "4%", blur: 0, opacity: 1 },
  { pose: POSES.kinetic!, figX: "-2%", blur: 1.5, opacity: 0.92 },
  { pose: POSES.kinetic!, figX: "8%", blur: 1.5, opacity: 0.92 },
  { pose: POSES.recede!, figX: "0%", blur: 10, opacity: 0.85 },
  { pose: POSES.tall!, figX: "-22%", blur: 0, opacity: 1 },
  { pose: POSES.brand!, figX: "24%", blur: 6, opacity: 0.6 },
  { pose: POSES.finale!, figX: "0%", blur: 0, opacity: 1 },
];

function Landing() {
  const wrap = useRef<HTMLDivElement>(null);
  const [act, setAct] = useState(0);
  const { scrollYProgress } = useScroll({ target: wrap, offset: ["start start", "end end"] });

  useMotionValueEvent(scrollYProgress, "change", (p) => {
    const i = Math.min(ACTS.length - 1, Math.max(0, Math.floor(p * ACTS.length + 0.001)));
    setAct(i);
  });

  const current = ACTS[act]!;

  return (
    <div ref={wrap} className="relative bg-canvas font-editorial text-editorial">
      <Atmosphere />
      <LandingNav />

      {/* pinned translucent figure layer */}
      <div className="pointer-events-none sticky top-0 z-0 -mb-[100svh] h-[100svh] overflow-hidden">
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{ x: current.figX, opacity: current.opacity }}
          transition={{ type: "spring", stiffness: 55, damping: 20 }}
        >
          <Humanoid pose={current.pose} blur={current.blur} className="h-[118svh] w-auto" />
        </motion.div>
      </div>

      <div className="relative z-10">
        <HeroAct />
        <VisionAct />
        <CloseAct />
        <KineticAct word="skill" index={0} />
        <KineticAct word="growth" index={1} />
        <StatsAct />
        <UnlockAct />
        <BrandAct />
        <FinaleAct />
      </div>
    </div>
  );
}

/* ------------------------------- 0s — hero ------------------------------- */

function HeroAct() {
  return (
    <Act className="items-center">
      <div className="mx-auto flex h-full max-w-[1600px] flex-col justify-center px-6 pt-28 pb-24 md:px-10">
        <div className="editorial-label mb-8 flex items-center gap-4">
          <span>Iris Studio</span>
          <span className="h-px w-16 bg-editorial-line" />
          <span>Generative Systems</span>
        </div>
        <h1 className="editorial-display max-w-[13ch] text-[clamp(2.9rem,9.2vw,9.5rem)]">
          The clarity
          <br />
          your business
          <br />
          has been
          <br />
          missing
        </h1>

        <div className="mt-12 flex flex-wrap items-end gap-6 md:mt-20">
          <MiniCard title="Composition" meta="Live preview" tone="cyan" />
          <MiniCard title="Palette 04" meta="Auto-tuned" bars={4} tone="pink" />
          <div className="hidden max-w-[220px] flex-col gap-2 sm:flex">
            <Tick label="Realtime rendering" />
            <Tick label="Editorial systems" />
            <Tick label="No templates" />
          </div>
        </div>
      </div>
      <EdgeMeta left="01 — Overture" right="Scroll" />
    </Act>
  );
}

/* --------------------------- 3.3s — vision line -------------------------- */

function VisionAct() {
  return (
    <Act>
      <div className="mx-auto max-w-[1600px] px-6 pt-32 md:px-10">
        <h2 className="editorial-display max-w-[16ch] text-[clamp(2.2rem,6.4vw,6.4rem)]">
          Empowering visionaries to shape tomorrow&rsquo;s digital landscapes
        </h2>
        <div className="mt-10 flex max-w-[520px] flex-col gap-3">
          <p className="max-w-[38ch] text-sm leading-relaxed font-light text-editorial-muted">
            We build identity, motion and interface as one continuous material — translucent, adaptive,
            unmistakably yours.
          </p>
        </div>
      </div>
      <EdgeMeta left="02 — Intent" right="Studio / 2026" />
    </Act>
  );
}

/* ---------------------------- 5s — close crop ---------------------------- */

function CloseAct() {
  return (
    <Act>
      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col justify-between px-6 py-32 md:px-10">
        <div className="max-w-[280px]">
          <div className="editorial-label mb-3">Material study</div>
          <p className="text-sm leading-relaxed font-light text-editorial-muted">
            Glass, light and structure. Every surface refracts the brief it was made for.
          </p>
        </div>
        <div className="ml-auto max-w-[240px] text-right">
          <div className="editorial-display text-[clamp(2rem,4vw,3.4rem)]">Form</div>
          <div className="editorial-label mt-2">Figure 03 / translucency index 0.62</div>
        </div>
      </div>
      <EdgeMeta left="03 — Material" right="Refraction" />
    </Act>
  );
}

/* ----------------------- 6.7–8.3s — kinetic words ----------------------- */

function KineticAct({ word, index }: { word: string; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const dir = index % 2 === 0 ? 1 : -1;
  const x = useTransform(scrollYProgress, [0, 1], [`${18 * dir}%`, `${-18 * dir}%`]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.86, 1.04, 0.86]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

  return (
    <section ref={ref} className="relative flex min-h-screen items-center overflow-hidden">
      <motion.div style={{ x, scale, opacity }} className="w-full text-center">
        <span className="editorial-display block text-[clamp(5rem,24vw,22rem)] leading-[0.8]">{word}</span>
      </motion.div>
      <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-between px-6 md:px-10">
        <span className="editorial-label">{index === 0 ? "04 — Skill" : "05 — Growth"}</span>
        <span className="editorial-label">Kinetic sequence</span>
      </div>
    </section>
  );
}

/* ------------------------------ 10s — stats ----------------------------- */

function StatsAct() {
  const stats = [
    { k: "200+", l: "Systems shipped for founders and studios" },
    { k: "97%", l: "Client retention across multi-year engagements" },
    { k: "10X", l: "Faster from first sketch to living product" },
  ];
  return (
    <Act className="items-center">
      <div className="mx-auto flex min-h-screen max-w-[1600px] items-center px-6 md:px-10">
        <div className="glass-panel w-full rounded-[28px] px-7 py-10 md:px-14 md:py-16">
          <div className="editorial-label mb-10">Measured outcomes</div>
          <div className="grid gap-10 md:grid-cols-3 md:gap-6">
            {stats.map((s) => (
              <div key={s.k} className="border-t border-editorial-line pt-6">
                <div className="editorial-display text-[clamp(3rem,7vw,7rem)]">{s.k}</div>
                <p className="mt-3 max-w-[26ch] text-xs leading-relaxed font-light text-editorial-muted">
                  {s.l}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <EdgeMeta left="06 — Evidence" right="Index of results" />
    </Act>
  );
}

/* ---------------------------- 11.6s — unlock ---------------------------- */

function UnlockAct() {
  return (
    <Act>
      <div className="mx-auto flex min-h-screen max-w-[1600px] items-center justify-end px-6 md:px-10">
        <div className="max-w-[440px]">
          <div className="editorial-label mb-5">Product</div>
          <h2 className="editorial-display text-[clamp(1.9rem,3.6vw,3.4rem)]">
            Iris unlocks a faster, smarter way to create
          </h2>
          <p className="mt-5 max-w-[34ch] text-sm leading-relaxed font-light text-editorial-muted">
            Describe the feeling. Iris composes the system — type, colour, motion and surface — then hands you
            the source.
          </p>
          <Link
            to="/auth"
            className="press mt-8 inline-flex items-center gap-2 rounded-full bg-editorial px-5 py-2.5 text-[11px] tracking-[0.14em] text-canvas uppercase"
          >
            Start creating
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
      <EdgeMeta left="07 — Instrument" right="Iris v4" />
    </Act>
  );
}

/* --------------------------- 14–15s — brand ---------------------------- */

function BrandAct() {
  return (
    <Act>
      <div className="relative mx-auto flex min-h-screen max-w-[1600px] flex-col justify-between px-6 py-28 md:px-10">
        <h2 className="editorial-display max-w-[14ch] text-[clamp(2rem,4.6vw,4.4rem)]">
          The pinnacle of generative art
        </h2>

        <div className="flex flex-col items-center justify-center gap-6">
          <LoopMark className="h-16 w-16 opacity-90 md:h-24 md:w-24" />
          <div
            className="text-[clamp(3.4rem,13vw,12rem)] leading-[0.85] font-extralight tracking-[-0.05em]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 30% 20%, var(--iris-cyan), var(--iris-blue) 42%, var(--iris-pink) 78%, var(--iris-orange))",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            Clarix
          </div>
          <div className="editorial-label">A generative identity by Iris Studio</div>
        </div>

        <div className="editorial-display ml-auto text-right text-[clamp(1.2rem,2.4vw,2.2rem)]">
          Designed for visionaries
        </div>
      </div>
      <EdgeMeta left="08 — Identity" right="Clarix / dotted gradient" />
    </Act>
  );
}

/* --------------------------- 16.6s — finale ---------------------------- */

function FinaleAct() {
  const columns = [
    { h: "Studio", items: ["About", "Process", "Careers"] },
    { h: "Work", items: ["Index", "Generative", "Identity"] },
    { h: "Contact", items: ["hello@iris.studio", "Instagram", "Dribbble"] },
  ];
  return (
    <section className="relative flex min-h-screen flex-col justify-between pt-32 pb-8">
      <div className="mx-auto w-full max-w-[1600px] px-6 text-center md:px-10">
        <div className="editorial-label mb-6">Iris × Clarix</div>
        <h2 className="editorial-display mx-auto max-w-[16ch] text-[clamp(2.6rem,8vw,8rem)]">
          The Future of digital art
        </h2>
      </div>

      <div className="mx-auto w-full max-w-[1600px] px-6 md:px-10">
        <div className="glass-panel flex flex-col gap-8 rounded-[28px] px-7 py-8 md:flex-row md:items-end md:justify-between md:px-12 md:py-10">
          <div className="grid flex-1 grid-cols-2 gap-8 sm:grid-cols-3">
            {columns.map((c) => (
              <div key={c.h}>
                <div className="editorial-label mb-3">{c.h}</div>
                <ul className="space-y-1.5">
                  {c.items.map((i) => (
                    <li key={i} className="text-xs font-light text-editorial-muted">
                      {i}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="flex flex-col items-start gap-4 md:items-end">
            <div className="editorial-label">Ready when you are</div>
            <Link
              to="/chats"
              className="press inline-flex items-center gap-2 rounded-full bg-editorial px-6 py-3 text-[11px] tracking-[0.14em] text-canvas uppercase"
            >
              Enter the studio
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
        <div className="editorial-label mt-6 flex justify-between">
          <span>© 2026 Iris Studio</span>
          <span>09 — Horizon</span>
        </div>
      </div>
    </section>
  );
}

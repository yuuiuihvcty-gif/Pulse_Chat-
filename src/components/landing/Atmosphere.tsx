import { motion } from "motion/react";

/** Pastel atmospheric blobs + grain over an off-white canvas. */
export function Atmosphere({ intensity = 1 }: { intensity?: number }) {
  const blobs = [
    { c: "var(--iris-cyan)", x: "6%", y: "8%", s: 620, d: 0 },
    { c: "var(--iris-blue)", x: "72%", y: "-6%", s: 720, d: 2 },
    { c: "var(--iris-pink)", x: "48%", y: "58%", s: 660, d: 4 },
    { c: "var(--iris-orange)", x: "84%", y: "70%", s: 540, d: 6 },
    { c: "var(--iris-violet)", x: "18%", y: "74%", s: 580, d: 8 },
  ];

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-canvas">
      {blobs.map((b) => (
        <motion.div
          key={b.x + b.y}
          className="absolute rounded-full"
          style={{
            left: b.x,
            top: b.y,
            width: b.s,
            height: b.s,
            background: `radial-gradient(circle at 40% 38%, ${b.c}, transparent 68%)`,
            opacity: 0.26 * intensity,
            filter: "blur(90px)",
          }}
          animate={{ x: [0, 34, -18, 0], y: [0, -26, 20, 0], scale: [1, 1.08, 0.96, 1] }}
          transition={{ duration: 26 + b.d * 2, repeat: Infinity, ease: "easeInOut", delay: b.d }}
        />
      ))}
      <div className="film-grain absolute inset-0" />
    </div>
  );
}

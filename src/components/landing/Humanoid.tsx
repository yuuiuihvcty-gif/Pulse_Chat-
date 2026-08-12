import { motion, useReducedMotion } from "motion/react";
import { useId } from "react";

/**
 * Procedural translucent glass humanoid.
 * Fully SVG: segmented torso, sphere head, articulated limbs, internal
 * wireframe layers, chromatic rim glow. Poses are interpolated with springs.
 */

export type Palette = "cyan" | "warm" | "violet";

export type Pose = {
  /** whole-figure framing */
  x: number;
  y: number;
  scale: number;
  rot: number;
  /** joints, degrees */
  head: number;
  torso: number;
  armL: [number, number];
  armR: [number, number];
  legL: [number, number];
  legR: [number, number];
  palette: Palette;
};

const base: Pose = {
  x: 0,
  y: 0,
  scale: 1,
  rot: 0,
  head: 0,
  torso: 0,
  armL: [8, 10],
  armR: [-8, -10],
  legL: [3, 4],
  legR: [-3, -4],
  palette: "cyan",
};

export const POSES = {
  /* 0s — hero, figure cropped on the right, contemplative lean */
  hero: {
    ...base,
    x: 6,
    y: 2,
    scale: 1.02,
    rot: -3,
    head: -6,
    torso: 3,
    armL: [-14, -10],
    armR: [16, 12],
    legL: [-4, 3],
    legR: [4, -3],
  },
  /* ~3.3s — warmer, rotated, reaching up */
  reach: {
    ...base,
    palette: "warm",
    x: -4,
    y: -3,
    scale: 1.06,
    rot: 6,
    head: 10,
    torso: -6,
    armL: [-150, -22],
    armR: [26, 30],
    legL: [-8, 6],
    legR: [10, -5],
  },
  /* ~5s — close crop, glossy cyan, arms folded low */
  close: {
    ...base,
    x: 2,
    y: 4,
    scale: 1.3,
    rot: -1,
    head: -3,
    torso: 2,
    armL: [-38, -58],
    armR: [40, 60],
    legL: [-3, 2],
    legR: [3, -2],
  },
  /* ~6.7–8.3s — kinetic, mid-stride behind giant type */
  kinetic: {
    ...base,
    palette: "violet",
    x: -8,
    y: 0,
    scale: 1.16,
    rot: -8,
    head: 8,
    torso: -10,
    armL: [-72, -46],
    armR: [58, 34],
    legL: [-30, 22],
    legR: [26, -16],
  },
  /* ~10s — blurred backdrop for the stats panel */
  recede: {
    ...base,
    x: 4,
    y: 6,
    scale: 1.24,
    rot: 2,
    head: -2,
    armL: [-18, -14],
    armR: [20, 16],
    legL: [-5, 4],
    legR: [5, -4],
  },
  /* ~11.6s — tall standing pose beside the statement */
  tall: {
    ...base,
    palette: "cyan",
    x: 10,
    y: -4,
    scale: 1.0,
    rot: 1,
    head: -10,
    torso: 1,
    armL: [-8, -6],
    armR: [9, 7],
    legL: [-2, 1],
    legR: [2, -1],
  },
  /* ~14–15s — brand section, gentle turn away */
  brand: {
    ...base,
    palette: "warm",
    x: -2,
    y: 8,
    scale: 1.12,
    rot: -5,
    head: 14,
    torso: 8,
    armL: [-34, -52],
    armR: [22, 18],
    legL: [-6, 5],
    legR: [7, -4],
  },
  /* ~16.6s — final composition, open arms */
  finale: {
    ...base,
    palette: "violet",
    x: 0,
    y: 0,
    scale: 1.08,
    rot: 0,
    head: 0,
    torso: 0,
    armL: [-58, -34],
    armR: [60, 36],
    legL: [-11, 7],
    legR: [11, -7],
  },
} satisfies Record<string, Pose>;

const PALETTES: Record<Palette, { a: string; b: string; c: string }> = {
  cyan: { a: "var(--iris-cyan)", b: "var(--iris-blue)", c: "var(--iris-violet)" },
  warm: { a: "var(--iris-pink)", b: "var(--iris-orange)", c: "var(--iris-blue)" },
  violet: { a: "var(--iris-violet)", b: "var(--iris-blue)", c: "var(--iris-pink)" },
};

const spring = { type: "spring" as const, stiffness: 60, damping: 18, mass: 1.1 };

/**
 * Two-segment limb solved with forward kinematics so joints never detach.
 * Angles are degrees from straight-down; positive swings toward +x.
 */
function Limb({
  upper,
  fore,
  origin,
  len = [96, 92],
  width = [23, 18],
}: {
  upper: number;
  fore: number;
  origin: [number, number];
  len?: [number, number];
  width?: [number, number];
}) {
  const [ox, oy] = origin;
  const r1 = (upper * Math.PI) / 180;
  const r2 = ((upper + fore) * Math.PI) / 180;
  const jx = ox + Math.sin(r1) * len[0];
  const jy = oy + Math.cos(r1) * len[0];
  const ex = jx + Math.sin(r2) * len[1];
  const ey = jy + Math.cos(r2) * len[1];

  return (
    <g>
      <motion.line
        animate={{ x1: ox, y1: oy, x2: jx, y2: jy }}
        transition={spring}
        stroke="url(#limbFill)"
        strokeWidth={width[0]}
        strokeLinecap="round"
      />
      <motion.line
        animate={{ x1: ox, y1: oy, x2: jx, y2: jy }}
        transition={spring}
        stroke="url(#edge)"
        strokeWidth={width[0] - 12}
        strokeLinecap="round"
        opacity={0.5}
      />
      <motion.line
        animate={{ x1: jx, y1: jy, x2: ex, y2: ey }}
        transition={spring}
        stroke="url(#limbFill)"
        strokeWidth={width[1]}
        strokeLinecap="round"
      />
      <motion.line
        animate={{ x1: jx, y1: jy, x2: ex, y2: ey }}
        transition={spring}
        stroke="url(#wire)"
        strokeWidth={1}
        strokeLinecap="round"
        opacity={0.6}
      />
      <motion.circle animate={{ cx: jx, cy: jy }} transition={spring} r={width[0] * 0.62} fill="url(#jointFill)" />
      <motion.circle animate={{ cx: ex, cy: ey }} transition={spring} r={width[1] * 0.7} fill="url(#jointFill)" />
      <motion.circle
        animate={{ cx: ex - 2, cy: ey - 3 }}
        transition={spring}
        r={width[1] * 0.26}
        fill="#fff"
        opacity={0.75}
      />
    </g>
  );
}

export function Humanoid({
  pose,
  className,
  blur = 0,
}: {
  pose: Pose;
  className?: string;
  blur?: number;
}) {
  const uid = useId().replace(/[:]/g, "");
  const reduce = useReducedMotion();
  const pal = PALETTES[pose.palette];
  const t = reduce ? { duration: 0 } : spring;

  return (
    <motion.svg
      viewBox="0 0 520 1000"
      className={className}
      aria-hidden="true"
      animate={{ x: `${pose.x}%`, y: `${pose.y}%`, scale: pose.scale, rotate: pose.rot }}
      transition={t}
      style={{ filter: blur ? `blur(${blur}px)` : undefined, overflow: "visible" }}
    >
      <defs>
        <linearGradient id="bodyFill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={pal.a} stopOpacity="0.62" />
          <stop offset="52%" stopColor={pal.b} stopOpacity="0.4" />
          <stop offset="100%" stopColor={pal.c} stopOpacity="0.55" />
        </linearGradient>
        <linearGradient id="limbFill" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={pal.b} stopOpacity="0.5" />
          <stop offset="45%" stopColor={pal.a} stopOpacity="0.28" />
          <stop offset="100%" stopColor={pal.c} stopOpacity="0.5" />
        </linearGradient>
        <radialGradient id="jointFill" cx="35%" cy="30%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.85" />
          <stop offset="60%" stopColor={pal.a} stopOpacity="0.45" />
          <stop offset="100%" stopColor={pal.b} stopOpacity="0.5" />
        </radialGradient>
        <radialGradient id="headFill" cx="32%" cy="26%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.95" />
          <stop offset="42%" stopColor={pal.a} stopOpacity="0.5" />
          <stop offset="100%" stopColor={pal.b} stopOpacity="0.62" />
        </radialGradient>
        <linearGradient id="gloss" x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0.12" />
        </linearGradient>
        <linearGradient id="edge" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0.15" />
        </linearGradient>
        <linearGradient id="wire" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="100%" stopColor={pal.c} stopOpacity="0.35" />
        </linearGradient>
        <filter id={`glow-${uid}`} x="-60%" y="-40%" width="220%" height="200%">
          <feGaussianBlur stdDeviation="34" result="b" />
          <feBlend in="SourceGraphic" in2="b" />
        </filter>
      </defs>

      {/* chromatic halo behind the figure */}
      <g opacity="0.75" filter={`url(#glow-${uid})`}>
        <ellipse cx="260" cy="430" rx="180" ry="330" fill={pal.a} opacity="0.28" />
        <ellipse cx="300" cy="640" rx="150" ry="220" fill={pal.c} opacity="0.22" />
      </g>

      <motion.g animate={{ rotate: pose.torso }} transition={t} style={{ originX: "260px", originY: "330px" }}>
        {/* torso: stacked translucent segments */}
        <g>
          <path
            d="M260 210c62 0 96 46 104 108 9 66 4 122-14 176-13 40-44 62-90 62s-77-22-90-62c-18-54-23-110-14-176 8-62 42-108 104-108z"
            fill="url(#bodyFill)"
            stroke="url(#edge)"
            strokeWidth="1.2"
          />
          {[268, 310, 352, 394, 436, 478].map((y, i) => (
            <ellipse
              key={y}
              cx="260"
              cy={y}
              rx={92 - Math.abs(i - 2) * 7}
              ry="12"
              fill="none"
              stroke="url(#wire)"
              strokeWidth="0.9"
              opacity={0.55}
            />
          ))}
          {/* internal organic core */}
          <ellipse cx="252" cy="360" rx="46" ry="96" fill={pal.c} opacity="0.28" />
          <ellipse cx="252" cy="360" rx="26" ry="62" fill="#fff" opacity="0.22" />
          {/* specular sheen */}
          <path
            d="M214 232c-24 34-32 96-26 158 4 44 12 78 26 104-30-24-44-72-46-134-2-58 12-104 46-128z"
            fill="url(#gloss)"
            opacity="0.5"
          />
          <line x1="260" y1="216" x2="260" y2="548" stroke="url(#wire)" strokeWidth="0.8" opacity="0.5" />
        </g>

        {/* shoulders */}
        <ellipse cx="176" cy="248" rx="26" ry="24" fill="url(#jointFill)" />
        <ellipse cx="344" cy="248" rx="26" ry="24" fill="url(#jointFill)" />

        {/* neck + head */}
        <rect x="244" y="176" width="32" height="46" rx="16" fill="url(#limbFill)" />
        <motion.g animate={{ rotate: pose.head }} transition={t} style={{ originX: "260px", originY: "200px" }}>
          <circle cx="260" cy="132" r="62" fill="url(#headFill)" stroke="url(#edge)" strokeWidth="1.2" />
          <ellipse cx="260" cy="132" rx="62" ry="20" fill="none" stroke="url(#wire)" strokeWidth="0.9" />
          <ellipse cx="260" cy="132" rx="22" ry="62" fill="none" stroke="url(#wire)" strokeWidth="0.9" />
          <ellipse cx="238" cy="106" rx="20" ry="14" fill="#fff" opacity="0.75" transform="rotate(-24 238 106)" />
          <circle cx="260" cy="150" r="9" fill="#fff" opacity="0.5" />
        </motion.g>
      </motion.g>

      {/* arms */}
      <Limb upper={pose.armL[0]} fore={pose.armL[1]} origin={[178, 252]} len={[104, 96]} width={[28, 22]} />
      <Limb upper={pose.armR[0]} fore={pose.armR[1]} origin={[342, 252]} len={[104, 96]} width={[28, 22]} />

      {/* hips + legs */}
      <ellipse cx="260" cy="552" rx="78" ry="34" fill="url(#bodyFill)" stroke="url(#edge)" strokeWidth="1" />
      <Limb upper={pose.legL[0]} fore={pose.legL[1]} origin={[224, 566]} len={[152, 140]} width={[34, 27]} />
      <Limb upper={pose.legR[0]} fore={pose.legR[1]} origin={[296, 566]} len={[152, 140]} width={[34, 27]} />

      {/* contact shadow */}
      <ellipse cx="260" cy="882" rx="132" ry="16" fill={pal.b} opacity="0.16" />
    </motion.svg>
  );
}

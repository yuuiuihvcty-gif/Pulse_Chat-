import { motion } from "motion/react";
import type { ReactNode } from "react";

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 220, damping: 24 }}
      className="mx-auto flex max-w-xs flex-col items-center px-6 py-16 text-center"
    >
      <div className="mb-5 grid h-16 w-16 place-items-center rounded-3xl bg-brand-soft text-accent-foreground shadow-soft">
        {icon}
      </div>
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      {description && <p className="mt-2 text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </motion.div>
  );
}

export function ListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <ul className="space-y-1 p-2" aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <li key={i} className="flex items-center gap-3 rounded-2xl p-3">
          <div className="h-12 w-12 rounded-full skeleton" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3 w-1/3 rounded-full skeleton" />
            <div className="h-3 w-2/3 rounded-full skeleton" />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function BubbleSkeleton() {
  return (
    <div className="space-y-4 p-4" aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className={i % 2 ? "flex justify-end" : "flex justify-start"}>
          <div
            className="h-10 rounded-3xl skeleton"
            style={{ width: `${45 + ((i * 17) % 35)}%` }}
          />
        </div>
      ))}
    </div>
  );
}

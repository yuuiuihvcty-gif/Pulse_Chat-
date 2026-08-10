import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/pulse/Navigation";

export const Route = createFileRoute("/chats")({
  head: () => ({
    meta: [
      { title: "Chats — Pulse" },
      { name: "description", content: "Pulse chats: a livelier, more expressive way to message." },
      { property: "og:title", content: "Chats — Pulse" },
      { property: "og:description", content: "Pulse chats: a livelier, more expressive way to message." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <AppShell>
      <div className="px-4 py-6">
        <h1 className="text-2xl font-semibold tracking-tight">Chats</h1>
        <p className="mt-2 text-sm text-muted-foreground">Coming up next in this build.</p>
      </div>
    </AppShell>
  );
}

import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import { toast } from "sonner";
import { LogOut, ShieldOff } from "lucide-react";
import { AppShell } from "@/components/pulse/AppShell";
import { ScreenHeader, BottomNav, SideRail } from "@/components/pulse/Navigation";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApp } from "@/lib/app-context";
import { signOutEverywhere } from "@/lib/auth";
import type { UserSettings } from "@/lib/types";
import { SPRING } from "@/lib/motion";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Pulse" },
      { name: "description", content: "Tune Pulse's look, notifications, and privacy to your taste." },
      { property: "og:title", content: "Settings — Pulse" },
      { property: "og:description", content: "Tune Pulse's look, notifications, and privacy to your taste." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AppShell>
      <SettingsPage />
    </AppShell>
  ),
});

function SettingsPage() {
  const { settings, saveSettings } = useApp();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [local, setLocal] = useState<UserSettings | null>(settings);
  const [pending, setPending] = useState<Set<string>>(new Set());

  const current = local ?? settings;

  const patch = async (key: keyof UserSettings, value: UserSettings[keyof UserSettings]) => {
    if (!settings) return;
    const previous = current;
    setLocal((prev) => ({ ...(prev ?? settings), [key]: value }) as UserSettings);
    setPending((p) => new Set(p).add(key));
    try {
      await saveSettings({ [key]: value } as Partial<UserSettings>);
    } catch (err) {
      setLocal(previous);
      toast.error(err instanceof Error ? err.message : `Couldn't save ${String(key)}`);
    } finally {
      setPending((p) => {
        const next = new Set(p);
        next.delete(key as string);
        return next;
      });
    }
  };

  const signOut = async () => {
    await signOutEverywhere();
    queryClient.clear();
    void navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="min-h-screen bg-background sm:flex">
      <SideRail />
      <div className="flex min-h-screen flex-1 flex-col pb-24 sm:pb-6">
        <ScreenHeader title="Settings" subtitle="Appearance, chats, notifications & privacy" />

        {!current ? (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            Loading settings…
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={SPRING.settle}
            className="mx-auto w-full max-w-md space-y-6 px-4 pt-4"
          >
            <Section title="Appearance">
              <SelectRow
                label="Theme"
                value={current.theme}
                onChange={(v) => patch("theme", v as UserSettings["theme"])}
                options={[
                  { value: "light", label: "Light" },
                  { value: "dark", label: "Dark" },
                  { value: "system", label: "System" },
                ]}
              />
              <SelectRow
                label="Wallpaper"
                value={current.wallpaper}
                onChange={(v) => patch("wallpaper", v)}
                options={[
                  { value: "aurora", label: "Aurora" },
                  { value: "plain", label: "Plain" },
                  { value: "mint", label: "Mint" },
                  { value: "dusk", label: "Dusk" },
                ]}
              />
              <SelectRow
                label="Bubble style"
                value={current.bubble_style}
                onChange={(v) => patch("bubble_style", v)}
                options={[
                  { value: "rounded", label: "Rounded" },
                  { value: "classic", label: "Classic" },
                  { value: "sharp", label: "Sharp" },
                ]}
              />
            </Section>

            <Section title="Chats">
              <ToggleRow
                label="Enter to send"
                description="Send messages with the Enter key"
                checked={current.enter_to_send}
                loading={pending.has("enter_to_send")}
                onChange={(v) => patch("enter_to_send", v)}
              />
              <ToggleRow
                label="Auto-download media"
                description="Download photos and videos automatically"
                checked={current.media_autodownload}
                loading={pending.has("media_autodownload")}
                onChange={(v) => patch("media_autodownload", v)}
              />
            </Section>

            <Section title="Notifications">
              <ToggleRow
                label="Message notifications"
                checked={current.notif_messages}
                loading={pending.has("notif_messages")}
                onChange={(v) => patch("notif_messages", v)}
              />
              <ToggleRow
                label="Sound"
                checked={current.notif_sound}
                loading={pending.has("notif_sound")}
                onChange={(v) => patch("notif_sound", v)}
              />
              <ToggleRow
                label="Vibrate"
                checked={current.notif_vibrate}
                loading={pending.has("notif_vibrate")}
                onChange={(v) => patch("notif_vibrate", v)}
              />
            </Section>

            <Section title="Privacy">
              <ToggleRow
                label="Show last seen"
                checked={current.show_last_seen}
                loading={pending.has("show_last_seen")}
                onChange={(v) => patch("show_last_seen", v)}
              />
              <ToggleRow
                label="Show online status"
                checked={current.show_online}
                loading={pending.has("show_online")}
                onChange={(v) => patch("show_online", v)}
              />
              <ToggleRow
                label="Read receipts"
                checked={current.read_receipts}
                loading={pending.has("read_receipts")}
                onChange={(v) => patch("read_receipts", v)}
              />
              <SelectRow
                label="Photo visibility"
                value={current.photo_visibility}
                onChange={(v) => patch("photo_visibility", v)}
                options={visibilityOptions}
              />
              <SelectRow
                label="Status visibility"
                value={current.status_visibility}
                onChange={(v) => patch("status_visibility", v)}
                options={visibilityOptions}
              />
            </Section>

            <Section title="More">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate({ to: "/contacts" })}
              >
                <ShieldOff className="mr-2 h-4 w-4" /> Blocked users
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-destructive"
                onClick={() => void signOut()}
              >
                <LogOut className="mr-2 h-4 w-4" /> Sign out
              </Button>
            </Section>
          </motion.div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}

const visibilityOptions = [
  { value: "everyone", label: "Everyone" },
  { value: "contacts", label: "Contacts" },
  { value: "nobody", label: "Nobody" },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      <div className="space-y-1 rounded-3xl border border-border bg-surface p-2 shadow-soft">
        {children}
      </div>
    </section>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  loading,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  loading?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl p-3">
      <div className="min-w-0">
        <div className="text-sm font-medium">{label}</div>
        {description && <div className="text-xs text-muted-foreground">{description}</div>}
      </div>
      <Switch checked={checked} disabled={loading} onCheckedChange={onChange} />
    </div>
  );
}

function SelectRow({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl p-3">
      <div className="text-sm font-medium">{label}</div>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-8 w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Camera, Check, LogOut, Pencil, Settings as SettingsIcon, X } from "lucide-react";
import { AppShell } from "@/components/pulse/AppShell";
import { ScreenHeader, BottomNav, SideRail } from "@/components/pulse/Navigation";
import { PulseAvatar } from "@/components/pulse/PulseAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useApp } from "@/lib/app-context";
import { useSignedUrl } from "@/hooks/use-signed-url";
import { updateProfile, isUsernameAvailable } from "@/lib/api";
import { uploadMedia, validateFile } from "@/lib/media";
import { signOutEverywhere, normalizeUsername } from "@/lib/auth";
import { MOODS } from "@/lib/types";
import { SPRING } from "@/lib/motion";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Pulse" },
      { name: "description", content: "Your Pulse profile: photo, mood, and how people find you." },
      { property: "og:title", content: "Profile — Pulse" },
      { property: "og:description", content: "Your Pulse profile: photo, mood, and how people find you." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AppShell>
      <ProfilePage />
    </AppShell>
  ),
});

function ProfilePage() {
  const { user, profile, refreshProfile } = useApp();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [about, setAbout] = useState("");
  const [phone, setPhone] = useState("");
  const [mood, setMood] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const { url: avatarUrl } = useSignedUrl(profile?.avatar_url);

  useEffect(() => {
    if (profile && !editing) {
      setDisplayName(profile.display_name);
      setUsername(profile.username);
      setAbout(profile.about ?? "");
      setPhone(profile.phone ?? "");
      setMood(profile.mood);
    }
  }, [profile, editing]);

  const startEdit = () => setEditing(true);
  const cancelEdit = () => {
    setEditing(false);
    setErrors({});
    if (profile) {
      setDisplayName(profile.display_name);
      setUsername(profile.username);
      setAbout(profile.about ?? "");
      setPhone(profile.phone ?? "");
      setMood(profile.mood);
    }
  };

  const validate = async () => {
    const errs: Record<string, string> = {};
    if (displayName.trim().length < 1) errs["displayName"] = "Add a display name.";
    const cleanUsername = normalizeUsername(username);
    if (cleanUsername.length < 3 || !/^[a-z0-9_]+$/.test(cleanUsername)) {
      errs["username"] = "3+ characters: lowercase letters, numbers, underscore.";
    } else if (profile) {
      const available = await isUsernameAvailable(cleanUsername, profile.id);
      if (!available) errs["username"] = "That username is taken.";
    }
    setErrors(errs);
    return { ok: Object.keys(errs).length === 0, cleanUsername };
  };

  const save = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const { ok, cleanUsername } = await validate();
      if (!ok) {
        setSaving(false);
        return;
      }
      let avatarPath = profile.avatar_url;
      if (pendingFile) {
        setUploading(true);
        setUploadError(null);
        try {
          avatarPath = await uploadMedia(user.id, pendingFile, pendingFile.name);
        } catch (err) {
          setUploadError(err instanceof Error ? err.message : "Upload failed");
          setUploading(false);
          setSaving(false);
          return;
        }
        setUploading(false);
      }
      await updateProfile(profile.id, {
        display_name: displayName.trim(),
        username: cleanUsername,
        about: about.trim() || null,
        phone: phone.trim() || null,
        mood,
        avatar_url: avatarPath,
      });
      refreshProfile();
      setPendingFile(null);
      setEditing(false);
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save profile");
    } finally {
      setSaving(false);
    }
  };

  const onPickFile = (file: File | null) => {
    if (!file) return;
    const error = validateFile(file, "photo");
    if (error) {
      toast.error(error);
      return;
    }
    setPendingFile(file);
    setUploadError(null);
  };

  const signOut = async () => {
    await signOutEverywhere();
    queryClient.clear();
    void navigate({ to: "/auth", replace: true });
  };

  const previewUrl = pendingFile ? URL.createObjectURL(pendingFile) : avatarUrl;
  const currentMood = MOODS.find((m) => m.key === profile?.mood);

  return (
    <div className="min-h-screen bg-background sm:flex">
      <SideRail />
      <div className="flex min-h-screen flex-1 flex-col pb-24 sm:pb-6">
        <ScreenHeader
          title="Profile"
          actions={
            !editing ? (
              <Button size="icon" variant="ghost" onClick={startEdit} aria-label="Edit profile">
                <Pencil className="h-4 w-4" />
              </Button>
            ) : undefined
          }
        />

        {!profile ? (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            Loading your profile…
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={SPRING.settle}
            className="mx-auto w-full max-w-md px-4 pt-6"
          >
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="h-28 w-28 overflow-hidden rounded-full ring-2 ring-border ring-offset-2 ring-offset-background">
                  {previewUrl ? (
                    <img src={previewUrl} alt={profile.display_name} className="h-full w-full object-cover" />
                  ) : (
                    <PulseAvatar profile={profile} size="xl" />
                  )}
                </div>
                {editing && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 grid h-9 w-9 place-items-center rounded-full bg-brand text-brand-foreground shadow-soft press"
                    aria-label="Change photo"
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
                />
              </div>
              {uploading && <p className="mt-2 text-xs text-muted-foreground">Uploading photo…</p>}
              {uploadError && (
                <div className="mt-2 flex items-center gap-2 text-xs text-destructive">
                  {uploadError}
                  <button
                    type="button"
                    className="underline"
                    onClick={() => pendingFile && onPickFile(pendingFile)}
                  >
                    Retry
                  </button>
                </div>
              )}
            </div>

            {!editing ? (
              <div className="mt-6 space-y-6 text-center">
                <div>
                  <h2 className="font-display text-xl font-semibold">{profile.display_name}</h2>
                  <p className="text-sm text-muted-foreground">@{profile.username}</p>
                  {currentMood && (
                    <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-brand-soft px-3 py-1 text-xs font-medium text-brand">
                      <span>{currentMood.emoji}</span> {currentMood.label}
                    </div>
                  )}
                </div>
                {profile.about && (
                  <p className="text-sm leading-relaxed text-muted-foreground">{profile.about}</p>
                )}
                {profile.phone && (
                  <div className="rounded-2xl bg-surface-2 p-3 text-left text-sm">
                    <span className="text-muted-foreground">Phone · </span>
                    {profile.phone}
                  </div>
                )}

                <div className="space-y-2 pt-2">
                  <Button variant="outline" className="w-full" onClick={() => navigate({ to: "/settings" })}>
                    <SettingsIcon className="mr-2 h-4 w-4" /> Settings
                  </Button>
                  <Button variant="ghost" className="w-full text-destructive" onClick={() => void signOut()}>
                    <LogOut className="mr-2 h-4 w-4" /> Sign out
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                <Field label="Display name" error={errors["displayName"]}>
                  <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                </Field>
                <Field label="Username" error={errors["username"]} hint="lowercase letters, numbers, underscore">
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-muted-foreground">@</span>
                    <Input
                      value={username}
                      onChange={(e) => setUsername(normalizeUsername(e.target.value))}
                    />
                  </div>
                </Field>
                <Field label="About">
                  <Textarea value={about} onChange={(e) => setAbout(e.target.value)} rows={3} />
                </Field>
                <Field label="Phone">
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" />
                </Field>
                <div>
                  <Label className="text-xs text-muted-foreground">Mood</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {MOODS.map((m) => (
                      <button
                        key={m.key}
                        type="button"
                        onClick={() => setMood(mood === m.key ? null : m.key)}
                        className={cn(
                          "flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium press",
                          mood === m.key
                            ? "border-brand bg-brand-soft text-brand"
                            : "border-border text-muted-foreground",
                        )}
                      >
                        <span>{m.emoji}</span> {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="flex-1" onClick={cancelEdit} disabled={saving}>
                    <X className="mr-2 h-4 w-4" /> Cancel
                  </Button>
                  <Button className="flex-1" onClick={() => void save()} disabled={saving || uploading}>
                    <Check className="mr-2 h-4 w-4" /> {saving ? "Saving…" : "Save"}
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string | undefined;
  error?: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="mt-1">{children}</div>
      {error ? (
        <p className="mt-1 text-xs text-destructive">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

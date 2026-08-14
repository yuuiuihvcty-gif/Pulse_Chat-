import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { MessageCircle, Search, ShieldOff, UserMinus, UserPlus, UserX, X } from "lucide-react";
import { AppShell } from "@/components/pulse/AppShell";
import { ScreenHeader, BottomNav, SideRail } from "@/components/pulse/Navigation";
import { PulseAvatar } from "@/components/pulse/PulseAvatar";
import { EmptyState, ListSkeleton } from "@/components/pulse/EmptyState";
import { ReportDialog } from "@/components/pulse/ReportDialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApp } from "@/lib/app-context";
import { SPRING } from "@/lib/motion";
import { lastSeenLabel } from "@/lib/format";
import { MOODS, type Profile } from "@/lib/types";
import {
  addContact,
  listBlocked,
  listContacts,
  removeContact,
  searchProfiles,
  setBlocked,
  startDirectConversation,
} from "@/lib/api";

export const Route = createFileRoute("/contacts")({
  head: () => ({
    meta: [
      { title: "Contacts — Pulse" },
      { name: "description", content: "Find people, manage your Pulse contacts, and control who can reach you." },
      { property: "og:title", content: "Contacts — Pulse" },
      { property: "og:description", content: "Find people, manage your Pulse contacts, and control who can reach you." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AppShell>
      <ContactsPage />
    </AppShell>
  ),
});

function useDebounced<T>(value: T, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useMemo(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return debounced;
}

function ContactsPage() {
  const { user } = useApp();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"contacts" | "blocked">("contacts");
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounced(query.trim());
  const [preview, setPreview] = useState<Profile | null>(null);
  const [reportTarget, setReportTarget] = useState<Profile | null>(null);

  const contactsQuery = useQuery({
    queryKey: ["contacts", user.id],
    queryFn: () => listContacts(user.id),
  });

  const blockedIdsQuery = useQuery({
    queryKey: ["blocked", user.id],
    queryFn: () => listBlocked(user.id),
  });

  const searchQuery = useQuery({
    queryKey: ["search-profiles", user.id, debouncedQuery],
    queryFn: () => searchProfiles(debouncedQuery, user.id),
    enabled: debouncedQuery.length > 0,
  });

  const contactIds = useMemo(
    () => new Set((contactsQuery.data ?? []).map((p) => p.id)),
    [contactsQuery.data],
  );
  const blockedIds = useMemo(() => new Set(blockedIdsQuery.data ?? []), [blockedIdsQuery.data]);

  const blockedProfilesQuery = useQuery({
    queryKey: ["blocked-profiles", user.id, [...blockedIds].join(",")],
    queryFn: async () => {
      const { getProfilesByIds } = await import("@/lib/api");
      return getProfilesByIds([...blockedIds]);
    },
    enabled: blockedIds.size > 0,
  });

  const invalidateAll = () => {
    void queryClient.invalidateQueries({ queryKey: ["contacts", user.id] });
    void queryClient.invalidateQueries({ queryKey: ["blocked", user.id] });
    void queryClient.invalidateQueries({ queryKey: ["blocked-profiles", user.id] });
    void queryClient.invalidateQueries({ queryKey: ["search-profiles", user.id] });
  };

  const addMutation = useMutation({
    mutationFn: (id: string) => addContact(user.id, id),
    onSuccess: () => {
      toast.success("Contact added");
      invalidateAll();
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Couldn't add contact"),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => removeContact(user.id, id),
    onSuccess: () => {
      toast.success("Contact removed");
      invalidateAll();
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Couldn't remove contact"),
  });

  const blockMutation = useMutation({
    mutationFn: ({ id, blocked }: { id: string; blocked: boolean }) => setBlocked(user.id, id, blocked),
    onSuccess: (_data, vars) => {
      toast.success(vars.blocked ? "Blocked" : "Unblocked");
      invalidateAll();
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Couldn't update block status"),
  });

  const messageMutation = useMutation({
    mutationFn: (id: string) => startDirectConversation(id),
    onSuccess: (conversationId) => {
      setPreview(null);
      void navigate({ to: "/chats/$id", params: { id: conversationId } });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Couldn't start chat"),
  });

  const contacts = contactsQuery.data ?? [];
  const results = (searchQuery.data ?? []).filter((p) => p.id !== user.id);

  return (
    <div className="min-h-screen bg-background sm:flex">
      <SideRail />
      <div className="flex min-h-screen flex-1 flex-col pb-20 sm:pb-0">
        <ScreenHeader title="Contacts" subtitle="Find and manage people on Pulse" />

        <div className="px-4 pt-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or @username"
              className="pl-9 pr-9"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          {debouncedQuery.length > 0 ? (
            <motion.div
              key="search"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={SPRING.settle}
              className="px-2 pt-3"
            >
              {searchQuery.isLoading ? (
                <ListSkeleton rows={4} />
              ) : searchQuery.isError ? (
                <ErrorRow onRetry={() => void searchQuery.refetch()} />
              ) : results.length === 0 ? (
                <EmptyState scene="search" title="No one found" description="Try a different name or username." />
              ) : (
                <ul className="space-y-1 p-2">
                  {results.map((p) => (
                    <PersonRow
                      key={p.id}
                      profile={p}
                      isContact={contactIds.has(p.id)}
                      onOpen={() => setPreview(p)}
                      onAdd={() => addMutation.mutate(p.id)}
                      onMessage={() => messageMutation.mutate(p.id)}
                    />
                  ))}
                </ul>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="main"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={SPRING.settle}
              className="flex-1"
            >
              <div className="px-4 pt-4">
                <Tabs value={tab} onValueChange={(v) => setTab(v as "contacts" | "blocked")}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="contacts">Contacts</TabsTrigger>
                    <TabsTrigger value="blocked">
                      Blocked{blockedIds.size > 0 ? ` (${blockedIds.size})` : ""}
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {tab === "contacts" ? (
                contactsQuery.isLoading ? (
                  <ListSkeleton />
                ) : contactsQuery.isError ? (
                  <ErrorRow onRetry={() => void contactsQuery.refetch()} />
                ) : contacts.length === 0 ? (
                  <EmptyState
                    scene="contacts"
                    title="No contacts yet"
                    description="Search for people above to start connecting."
                  />
                ) : (
                  <ul className="space-y-1 p-2">
                    <AnimatePresence initial={false}>
                      {contacts.map((p) => (
                        <PersonRow
                          key={p.id}
                          profile={p}
                          isContact
                          showPresence
                          onOpen={() => setPreview(p)}
                          onRemove={() => removeMutation.mutate(p.id)}
                          onMessage={() => messageMutation.mutate(p.id)}
                        />
                      ))}
                    </AnimatePresence>
                  </ul>
                )
              ) : blockedIds.size === 0 ? (
                <EmptyState
                  scene="contacts"
                  title="No blocked users"
                  description="People you block will show up here so you can review or unblock them."
                />
              ) : blockedProfilesQuery.isLoading ? (
                <ListSkeleton rows={3} />
              ) : (
                <ul className="space-y-1 p-2">
                  <AnimatePresence initial={false}>
                    {(blockedProfilesQuery.data ?? []).map((p) => (
                      <motion.li
                        key={p.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="flex items-center gap-3 rounded-3xl p-3"
                      >
                        <PulseAvatar profile={p} />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium">{p.display_name}</div>
                          <div className="truncate text-xs text-muted-foreground">@{p.username}</div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => blockMutation.mutate({ id: p.id, blocked: false })}
                        >
                          Unblock
                        </Button>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <BottomNav />

      <ProfilePreviewSheet
        profile={preview}
        onOpenChange={(open) => !open && setPreview(null)}
        isContact={preview ? contactIds.has(preview.id) : false}
        isBlocked={preview ? blockedIds.has(preview.id) : false}
        onAdd={() => preview && addMutation.mutate(preview.id)}
        onRemove={() => preview && removeMutation.mutate(preview.id)}
        onBlock={(blocked) => preview && blockMutation.mutate({ id: preview.id, blocked })}
        onMessage={() => preview && messageMutation.mutate(preview.id)}
        onReport={() => {
          if (preview) {
            setReportTarget(preview);
            setPreview(null);
          }
        }}
      />

      {reportTarget && (
        <ReportDialog
          open={!!reportTarget}
          onOpenChange={(open) => !open && setReportTarget(null)}
          reporterId={user.id}
          reportedId={reportTarget.id}
          reportedName={reportTarget.display_name}
        />
      )}
    </div>
  );
}

function ErrorRow({ onRetry }: { onRetry: () => void }) {
  return (
    <EmptyState
      scene="error"
      title="Something went wrong"
      description="We couldn't load this right now."
      action={
        <Button variant="outline" onClick={onRetry}>
          Try again
        </Button>
      }
    />
  );
}

function PersonRow({
  profile,
  isContact,
  showPresence,
  onOpen,
  onAdd,
  onRemove,
  onMessage,
}: {
  profile: Profile;
  isContact: boolean;
  showPresence?: boolean | undefined;
  onOpen: () => void;
  onAdd?: () => void;
  onRemove?: () => void;
  onMessage: () => void;
}) {
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={SPRING.settle}
      className="flex items-center gap-3 rounded-3xl p-2 press hover:bg-secondary/60"
    >
      <button type="button" onClick={onOpen} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <PulseAvatar profile={profile} showPresence={!!showPresence} showMood={!!showPresence} />
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">{profile.display_name}</div>
          <div className="truncate text-xs text-muted-foreground">
            @{profile.username}
            {showPresence && (
              <> · {profile.is_online ? "online" : lastSeenLabel(profile.last_seen)}</>
            )}
          </div>
        </div>
      </button>
      <div className="flex shrink-0 items-center gap-1">
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onMessage} aria-label="Message">
          <MessageCircle className="h-4 w-4" />
        </Button>
        {isContact ? (
          onRemove && (
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onRemove} aria-label="Remove contact">
              <UserMinus className="h-4 w-4" />
            </Button>
          )
        ) : (
          onAdd && (
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onAdd} aria-label="Add contact">
              <UserPlus className="h-4 w-4" />
            </Button>
          )
        )}
      </div>
    </motion.li>
  );
}

function ProfilePreviewSheet({
  profile,
  onOpenChange,
  isContact,
  isBlocked,
  onAdd,
  onRemove,
  onBlock,
  onMessage,
  onReport,
}: {
  profile: Profile | null;
  onOpenChange: (open: boolean) => void;
  isContact: boolean;
  isBlocked: boolean;
  onAdd: () => void;
  onRemove: () => void;
  onBlock: (blocked: boolean) => void;
  onMessage: () => void;
  onReport: () => void;
}) {
  const mood = MOODS.find((m) => m.key === profile?.mood);

  return (
    <Sheet open={!!profile} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto max-w-md rounded-t-3xl">
        {profile && (
          <>
            <SheetHeader className="items-center text-center">
              <PulseAvatar profile={profile} size="xl" showPresence showMood />
              <SheetTitle className="mt-3 font-display text-xl">{profile.display_name}</SheetTitle>
              <div className="text-sm text-muted-foreground">@{profile.username}</div>
              {mood && (
                <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-brand-soft px-3 py-1 text-xs font-medium text-brand">
                  <span>{mood.emoji}</span> {mood.label}
                </div>
              )}
              {profile.about && (
                <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">{profile.about}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {profile.is_online ? "Online now" : lastSeenLabel(profile.last_seen)}
              </p>
            </SheetHeader>

            <div className="mt-6 space-y-2 px-1 pb-4">
              <Button className="w-full" onClick={onMessage}>
                <MessageCircle className="mr-2 h-4 w-4" /> Message
              </Button>
              <div className="grid grid-cols-2 gap-2">
                {isContact ? (
                  <Button variant="outline" onClick={onRemove}>
                    <UserMinus className="mr-2 h-4 w-4" /> Remove
                  </Button>
                ) : (
                  <Button variant="outline" onClick={onAdd}>
                    <UserPlus className="mr-2 h-4 w-4" /> Add contact
                  </Button>
                )}
                <Button variant="outline" onClick={() => onBlock(!isBlocked)}>
                  <ShieldOff className="mr-2 h-4 w-4" /> {isBlocked ? "Unblock" : "Block"}
                </Button>
              </div>
              <Button variant="ghost" className="w-full text-destructive" onClick={onReport}>
                <UserX className="mr-2 h-4 w-4" /> Report
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

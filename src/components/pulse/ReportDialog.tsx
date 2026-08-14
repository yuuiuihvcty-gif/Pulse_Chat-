import { useState } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { reportUser } from "@/lib/api";

const REASONS = [
  { key: "spam", label: "Spam" },
  { key: "harassment", label: "Harassment or bullying" },
  { key: "impersonation", label: "Impersonation" },
  { key: "inappropriate", label: "Inappropriate content" },
  { key: "other", label: "Something else" },
] as const;

export function ReportDialog({
  open,
  onOpenChange,
  reporterId,
  reportedId,
  reportedName,
  conversationId,
  messageId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reporterId: string;
  reportedId: string;
  reportedName?: string;
  conversationId?: string | null;
  messageId?: string | null;
}) {
  const [reason, setReason] = useState<string>("spam");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    try {
      await reportUser({
        reporterId,
        reportedId,
        reason,
        details: details.trim() || null,
        conversationId: conversationId ?? null,
        messageId: messageId ?? null,
      });
      toast.success("Thanks — we received your report.");
      onOpenChange(false);
      setDetails("");
      setReason("spam");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send report. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Report {reportedName ?? "this user"}</DialogTitle>
          <DialogDescription>
            Tell us what's going on. Your report stays private.
          </DialogDescription>
        </DialogHeader>
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <RadioGroup value={reason} onValueChange={setReason} className="space-y-2">
            {REASONS.map((r) => (
              <div key={r.key} className="flex items-center gap-2 rounded-2xl border border-border p-3">
                <RadioGroupItem value={r.key} id={`reason-${r.key}`} />
                <Label htmlFor={`reason-${r.key}`} className="flex-1 cursor-pointer text-sm">
                  {r.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
          <div className="space-y-1.5">
            <Label htmlFor="report-details" className="text-xs text-muted-foreground">
              Additional details (optional)
            </Label>
            <Textarea
              id="report-details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Add context that could help us review this…"
              rows={3}
            />
          </div>
        </motion.div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={() => void submit()} disabled={submitting}>
            {submitting ? "Sending…" : "Submit report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

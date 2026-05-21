"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ReportResolution, reportResolutionLabels } from "@/types/report/report-resolution";

export type ReportActionType = "assign" | "resolve" | "dismiss" | "escalate";

export interface ReportActionPayload {
  note?: string;
  resolution?: ReportResolution;
  resolutionNote?: string;
  escalationReason?: string;
}

interface ReportActionDialogProps {
  open: boolean;
  action: ReportActionType;
  isPending: boolean;
  onClose: () => void;
  onConfirm: (payload: ReportActionPayload) => void;
}

const closeResolutions = [
  ReportResolution.ViolationConfirmed,
  ReportResolution.NoViolation,
  ReportResolution.Duplicate,
  ReportResolution.InsufficientEvidence,
  ReportResolution.HandledElsewhere,
];

function getCopy(action: ReportActionType) {
  switch (action) {
    case "assign":
      return {
        title: "Assign report",
        description: "Take ownership and move this report into review.",
        button: "Assign to me",
      };
    case "resolve":
      return {
        title: "Resolve report",
        description: "Close this report as handled. Review and verify the final resolution before submitting.",
        button: "Resolve",
      };
    case "dismiss":
      return {
        title: "Dismiss report",
        description: "Close this report without moderation action.",
        button: "Dismiss",
      };
    case "escalate":
      return {
        title: "Escalate report",
        description: "Send this report to admins for further review.",
        button: "Escalate",
      };
  }
}

export function ReportActionDialog({
  open,
  action,
  isPending,
  onClose,
  onConfirm,
}: ReportActionDialogProps) {
  const [note, setNote] = useState("");
  const [resolutionNote, setResolutionNote] = useState("");
  const [resolution, setResolution] = useState<ReportResolution>(
    action === "resolve" ? ReportResolution.ViolationConfirmed : ReportResolution.NoViolation,
  );

  const copy = getCopy(action);
  const needsResolution = action === "resolve" || action === "dismiss";

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && !isPending && onClose()}>
      <DialogContent className="sm:max-w-md bg-page border-default">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-heading">{copy.title}</DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm leading-relaxed">{copy.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-2">
          {action === "resolve" && (
            <div className="rounded-lg border border-amber-200 bg-amber-50/40 p-3 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-300 font-medium">
              <span className="font-bold uppercase tracking-wider block mb-1">Ticket State Separation Warning</span>
              Resolving a report only updates the moderation ticket state. Hiding, rejecting, or deleting the underlying profile/content must be performed through separate content actions.
            </div>
          )}

          {needsResolution && (
            <div className="space-y-2">
              <Label htmlFor="report-action-resolution" className="text-heading font-semibold text-xs uppercase tracking-wider">Resolution</Label>
              <Select
                value={String(resolution)}
                onValueChange={(value) => setResolution(Number(value) as ReportResolution)}
                disabled={isPending}
              >
                <SelectTrigger id="report-action-resolution" className="h-10 border-default bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-default bg-card">
                  {closeResolutions.map((item) => (
                    <SelectItem key={item} value={String(item)} className="cursor-pointer">
                      {reportResolutionLabels[item]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="report-action-note" className="text-heading font-semibold text-xs uppercase tracking-wider">
              {action === "escalate" ? "Escalation reason" : "Moderator note"}
            </Label>
            <Textarea
              id="report-action-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              disabled={isPending}
              maxLength={1000}
              className="min-h-24 border-default bg-background text-body text-sm"
              placeholder={action === "escalate" ? "Explain why admin intervention is required..." : "Add internal log details..."}
            />
          </div>

          {action === "resolve" && (
            <div className="space-y-2">
              <Label htmlFor="report-action-resolution-note" className="text-heading font-semibold text-xs uppercase tracking-wider">Resolution note</Label>
              <Textarea
                id="report-action-resolution-note"
                value={resolutionNote}
                onChange={(event) => setResolutionNote(event.target.value)}
                disabled={isPending}
                maxLength={1000}
                className="min-h-20 border-default bg-background text-body text-sm"
                placeholder="Explain the public resolution outcome..."
              />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending} className="border-default text-body">
            Cancel
          </Button>
          <Button type="button" onClick={() => onConfirm({
            note: note.trim() || undefined,
            resolution: needsResolution ? resolution : undefined,
            resolutionNote: resolutionNote.trim() || undefined,
            escalationReason: action === "escalate" ? note.trim() || undefined : undefined,
          })} disabled={isPending} className="font-bold">
            {isPending ? "Processing..." : copy.button}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

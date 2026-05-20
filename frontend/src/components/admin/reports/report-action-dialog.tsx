"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
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
        description: "Close this report as handled. This does not hide, reject, or suspend the reported target — content actions must be done separately.",
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {needsResolution && (
            <div className="space-y-2">
              <Label htmlFor="report-action-resolution">Resolution</Label>
              <Select
                value={String(resolution)}
                onValueChange={(value) => setResolution(Number(value) as ReportResolution)}
                disabled={isPending}
              >
                <SelectTrigger id="report-action-resolution" className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {closeResolutions.map((item) => (
                    <SelectItem key={item} value={String(item)}>
                      {reportResolutionLabels[item]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="report-action-note">
              {action === "escalate" ? "Escalation reason" : "Moderator note"}
            </Label>
            <Textarea
              id="report-action-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              disabled={isPending}
              maxLength={1000}
              className="min-h-24"
            />
          </div>

          {action === "resolve" && (
            <div className="space-y-2">
              <Label htmlFor="report-action-resolution-note">Resolution note</Label>
              <Textarea
                id="report-action-resolution-note"
                value={resolutionNote}
                onChange={(event) => setResolutionNote(event.target.value)}
                disabled={isPending}
                maxLength={1000}
                className="min-h-20"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button type="button" onClick={() => onConfirm({
            note: note.trim() || undefined,
            resolution: needsResolution ? resolution : undefined,
            resolutionNote: resolutionNote.trim() || undefined,
            escalationReason: action === "escalate" ? note.trim() || undefined : undefined,
          })} disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {copy.button}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

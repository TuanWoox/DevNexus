"use client";

import { useState, useMemo } from "react";
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
import { ReportTargetType } from "@/types/report/report-target-type";
import { ReportTargetAction, reportTargetActionLabels } from "@/types/report/report-target-action";

export type ReportActionType = "assign" | "resolve" | "dismiss" | "escalate";

export interface ReportActionPayload {
  note?: string;
  resolution?: ReportResolution;
  resolutionNote?: string;
  escalationReason?: string;
  targetAction?: ReportTargetAction;
  suspendDays?: number;
  targetActionReason?: string;
}

interface ReportActionDialogProps {
  open: boolean;
  action: ReportActionType;
  isPending: boolean;
  targetType?: ReportTargetType;
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

const suspensionPresets = [
  { value: 1, label: "1 day - Minor warning" },
  { value: 3, label: "3 days - Spam/disruption" },
  { value: 7, label: "7 days - Policy violation" },
  { value: 30, label: "30 days - Major violation" },
  { value: 90, label: "90 days - Repeat offender" },
  { value: 365, label: "1 year - Extreme violation" },
];

function getAvailableTargetActions(targetType?: ReportTargetType): ReportTargetAction[] {
  const actions: ReportTargetAction[] = [ReportTargetAction.None];

  switch (targetType) {
    case ReportTargetType.Post:
    case ReportTargetType.Question:
      actions.push(ReportTargetAction.HideContent);
      break;
    case ReportTargetType.Comment:
      actions.push(ReportTargetAction.DeleteComment);
      break;
    case ReportTargetType.Answer:
      actions.push(ReportTargetAction.DeleteAnswer);
      break;
    case ReportTargetType.Profile:
      actions.push(ReportTargetAction.SuspendUser);
      break;
  }

  return actions;
}

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
        description: "Close this report as handled. Choose a resolution and optionally enforce an action against the reported target.",
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
  targetType,
  onClose,
  onConfirm,
}: ReportActionDialogProps) {
  const [note, setNote] = useState("");
  const [resolutionNote, setResolutionNote] = useState("");
  const [resolution, setResolution] = useState<ReportResolution>(
    action === "resolve" ? ReportResolution.ViolationConfirmed : ReportResolution.NoViolation,
  );
  const [targetAction, setTargetAction] = useState<ReportTargetAction>(ReportTargetAction.None);
  const [suspendDays, setSuspendDays] = useState<number>(7);
  const [targetActionReason, setTargetActionReason] = useState("");

  const copy = getCopy(action);
  const needsResolution = action === "resolve" || action === "dismiss";
  const showTargetAction = action === "resolve" && resolution === ReportResolution.ViolationConfirmed;
  const availableActions = useMemo(() => getAvailableTargetActions(targetType), [targetType]);

  const showSuspendDays = showTargetAction && targetAction === ReportTargetAction.SuspendUser;
  const showActionReason = showTargetAction && targetAction === ReportTargetAction.HideContent;
  const showNoActionWarning = showTargetAction && targetAction === ReportTargetAction.None;

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && !isPending && onClose()}>
      <DialogContent className="sm:max-w-md bg-page border-default">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-heading">{copy.title}</DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm leading-relaxed">{copy.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-2">
          {needsResolution && (
            <div className="space-y-2">
              <Label htmlFor="report-action-resolution" className="text-heading font-semibold text-xs uppercase tracking-wider">Resolution</Label>
              <Select
                value={String(resolution)}
                onValueChange={(value) => {
                  const newResolution = Number(value) as ReportResolution;
                  setResolution(newResolution);
                  if (newResolution !== ReportResolution.ViolationConfirmed) {
                    setTargetAction(ReportTargetAction.None);
                  }
                }}
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

          {showTargetAction && (
            <div className="space-y-2">
              <Label htmlFor="report-target-action" className="text-heading font-semibold text-xs uppercase tracking-wider">Enforcement Action</Label>
              <Select
                value={String(targetAction)}
                onValueChange={(value) => setTargetAction(Number(value) as ReportTargetAction)}
                disabled={isPending}
              >
                <SelectTrigger id="report-target-action" className="h-10 border-default bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-default bg-card">
                  {availableActions.map((item) => (
                    <SelectItem key={item} value={String(item)} className="cursor-pointer">
                      {reportTargetActionLabels[item]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {showNoActionWarning && (
            <div className="rounded-lg border border-amber-200 bg-amber-50/40 p-3 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-300 font-medium">
              <span className="font-bold uppercase tracking-wider block mb-1">No Enforcement</span>
              Violation confirmed but no enforcement action will be taken. The target content remains unchanged.
            </div>
          )}

          {showSuspendDays && (
            <div className="space-y-2">
              <Label htmlFor="report-suspend-days" className="text-heading font-semibold text-xs uppercase tracking-wider">Suspension duration (days)</Label>
              <Select
                value={String(suspendDays)}
                onValueChange={(value) => setSuspendDays(Number(value))}
                disabled={isPending}
              >
                <SelectTrigger id="report-suspend-days" className="h-10 border-default bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-default bg-card">
                  {suspensionPresets.map((preset) => (
                    <SelectItem key={preset.value} value={String(preset.value)} className="cursor-pointer">
                      {preset.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-2xs text-muted-foreground">User will be suspended for {suspendDays} day{suspendDays !== 1 ? "s" : ""} from now.</p>
            </div>
          )}

          {showActionReason && (
            <div className="space-y-2">
              <Label htmlFor="report-action-reason" className="text-heading font-semibold text-xs uppercase tracking-wider">Reason for hiding</Label>
              <Textarea
                id="report-action-reason"
                value={targetActionReason}
                onChange={(event) => setTargetActionReason(event.target.value)}
                disabled={isPending}
                maxLength={1000}
                className="min-h-20 border-default bg-background text-body text-sm"
                placeholder="This reason will be shown as the moderation reason on the post..."
              />
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
          <Button
            type="button"
            onClick={() => onConfirm({
              note: note.trim() || undefined,
              resolution: needsResolution ? resolution : undefined,
              resolutionNote: resolutionNote.trim() || undefined,
              escalationReason: action === "escalate" ? note.trim() || undefined : undefined,
              targetAction: showTargetAction ? targetAction : undefined,
              suspendDays: showSuspendDays ? suspendDays : undefined,
              targetActionReason: showActionReason ? targetActionReason.trim() || undefined : undefined,
            })}
            disabled={isPending || (showActionReason && !targetActionReason.trim())}
            className="font-bold"
          >
            {isPending ? "Processing..." : copy.button}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

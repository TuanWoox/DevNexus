"use client";

import { useMemo, useState } from "react";
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
import { useCreateReport } from "@/hooks/report-hooks/use-create-report";
import { ReportReason, reportReasonLabels } from "@/types/report/report-reason";
import { ReportTargetType } from "@/types/report/report-target-type";

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetType: ReportTargetType;
  targetId: string;
  targetLabel: string;
}

const reasons = [
  ReportReason.Spam,
  ReportReason.Harassment,
  ReportReason.HateSpeech,
  ReportReason.SexualContent,
  ReportReason.Violence,
  ReportReason.Misinformation,
  ReportReason.Privacy,
  ReportReason.Impersonation,
  ReportReason.IllegalContent,
  ReportReason.Other,
];

export function ReportDialog({
  open,
  onOpenChange,
  targetType,
  targetId,
  targetLabel,
}: ReportDialogProps) {
  const [reason, setReason] = useState<ReportReason>(ReportReason.Spam);
  const [description, setDescription] = useState("");
  const createReport = useCreateReport();

  const title = useMemo(() => {
    switch (targetType) {
      case ReportTargetType.Profile:
        return "Report profile";
      case ReportTargetType.Question:
        return "Report question";
      case ReportTargetType.Comment:
        return "Report comment";
      case ReportTargetType.Answer:
        return "Report answer";
      default:
        return "Report post";
    }
  }, [targetType]);

  const handleSubmit = () => {
    createReport.mutate(
      {
        targetType,
        targetId,
        reason,
        description: description.trim() || undefined,
      },
      {
        onSuccess: () => {
          setDescription("");
          setReason(ReportReason.Spam);
          onOpenChange(false);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !createReport.isPending && onOpenChange(nextOpen)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Send this report to the moderation team for review.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
            {targetLabel}
          </div>

          <div className="space-y-2">
            <Label htmlFor="report-reason">Reason</Label>
            <Select
              value={String(reason)}
              onValueChange={(value) => setReason(Number(value) as ReportReason)}
              disabled={createReport.isPending}
            >
              <SelectTrigger id="report-reason" className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {reasons.map((item) => (
                  <SelectItem key={item} value={String(item)}>
                    {reportReasonLabels[item]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="report-description">Description</Label>
            <Textarea
              id="report-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={1000}
              disabled={createReport.isPending}
              placeholder="Add context for moderators"
              className="min-h-28"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createReport.isPending}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={createReport.isPending}>
            {createReport.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Submit report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

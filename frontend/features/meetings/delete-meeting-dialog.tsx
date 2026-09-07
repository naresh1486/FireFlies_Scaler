"use client";

import { Trash2, Loader2 } from "lucide-react";

import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useDeleteMeeting } from "@/hooks/use-meetings";
import { useToast } from "@/hooks/use-toast";

interface DeleteMeetingDialogProps {
  open: boolean;
  onClose: () => void;
  meetingId: number;
  meetingTitle: string;
  onDeleted?: () => void;
}

export function DeleteMeetingDialog({
  open,
  onClose,
  meetingId,
  meetingTitle,
  onDeleted,
}: DeleteMeetingDialogProps) {
  const remove = useDeleteMeeting();
  const toast = useToast();

  const onConfirm = () => {
    remove.mutate(meetingId, {
      onSuccess: () => {
        toast.success("Meeting deleted");
        onDeleted?.();
        onClose();
      },
      onError: (e) => toast.error(e.message),
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Delete meeting?"
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={remove.isPending}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={remove.isPending}
            aria-busy={remove.isPending}
          >
            {remove.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
            {remove.isPending ? "Deleting…" : "Delete"}
          </Button>
        </>
      }
    >
      <p className="text-sm text-ink">
        Are you sure you want to delete{" "}
        <span className="font-semibold">{meetingTitle}</span>? This will also remove
        its transcript, summary, notes, and action items. This cannot be undone.
      </p>
    </Modal>
  );
}
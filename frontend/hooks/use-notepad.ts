"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { api } from "@/lib/api-client";
import {
  type ActionItemCreatePayload,
  type ActionItemListResponse,
  type ActionItemRead,
  type ActionItemUpdatePayload,
  type NotesRead,
  type SummaryRead,
  type TranscriptRead,
  queryKeys,
} from "@/lib/query-keys";

export function useSummary(meetingId: number) {
  return useQuery<SummaryRead>({
    queryKey: queryKeys.meetings.summary(meetingId),
    queryFn: () => api.get<SummaryRead>(`/api/v1/meetings/${meetingId}/summary`),
    retry: false,
  });
}

export function useNotes(meetingId: number) {
  return useQuery<NotesRead>({
    queryKey: queryKeys.meetings.notes(meetingId),
    queryFn: () => api.get<NotesRead>(`/api/v1/meetings/${meetingId}/notes`),
  });
}

export function useTranscript(meetingId: number) {
  return useQuery<TranscriptRead>({
    queryKey: queryKeys.meetings.transcript(meetingId),
    queryFn: () => api.get<TranscriptRead>(`/api/v1/meetings/${meetingId}/transcript`),
  });
}

export function useActionItems(meetingId: number) {
  return useQuery<ActionItemListResponse>({
    queryKey: queryKeys.meetings.actionItems(meetingId),
    queryFn: () => api.get<ActionItemListResponse>(`/api/v1/meetings/${meetingId}/action-items`),
  });
}

export function useCreateActionItem(meetingId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ActionItemCreatePayload) =>
      api.post<ActionItemRead>(`/api/v1/meetings/${meetingId}/action-items`, { body: payload }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.meetings.actionItems(meetingId) });
    },
  });
}

export function useUpdateActionItem(meetingId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ActionItemUpdatePayload }) =>
      api.patch<ActionItemRead>(`/api/v1/action-items/${id}`, { body: payload }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.meetings.actionItems(meetingId) });
    },
  });
}

export function useDeleteActionItem(meetingId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete<void>(`/api/v1/action-items/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.meetings.actionItems(meetingId) });
    },
  });
}
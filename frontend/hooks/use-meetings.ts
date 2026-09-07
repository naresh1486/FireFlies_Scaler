"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { api } from "@/lib/api-client";
import {
  type MeetingCreatePayload,
  type MeetingListResponse,
  type MeetingRead,
  type MeetingUpdatePayload,
  type SortOption,
  queryKeys,
} from "@/lib/query-keys";

export interface MeetingsListFilters {
  q?: string;
  channel?: string;
  hosted_by_me?: boolean;
  bookmarked?: boolean;
  date_from?: string;
  date_to?: string;
  duration_min?: number;
  duration_max?: number;
  capture_source?: string;
  sort?: SortOption;
  page?: number;
  page_size?: number;
}

export function useMeetings(filters: MeetingsListFilters = {}) {
  return useQuery<MeetingListResponse>({
    queryKey: queryKeys.meetings.list(filters as Record<string, unknown>),
    queryFn: () =>
      api.get<MeetingListResponse>("/api/v1/meetings", {
        params: filters as Record<string, string | number | boolean | undefined | null>,
      }),
  });
}

export function useMeeting(id: number | null) {
  return useQuery<MeetingRead>({
    queryKey: id ? queryKeys.meetings.detail(id) : ["meetings", "detail", "none"],
    queryFn: () => api.get<MeetingRead>(`/api/v1/meetings/${id}`),
    enabled: id !== null,
  });
}

export function useCreateMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: MeetingCreatePayload) =>
      api.post<MeetingRead>("/api/v1/meetings", { body: payload }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.meetings.all });
    },
  });
}

export function useUpdateMeeting(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: MeetingUpdatePayload) =>
      api.patch<MeetingRead>(`/api/v1/meetings/${id}`, { body: payload }),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.meetings.detail(id), data);
      qc.invalidateQueries({ queryKey: queryKeys.meetings.all });
    },
  });
}

export function useDeleteMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete<void>(`/api/v1/meetings/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.meetings.all });
    },
  });
}
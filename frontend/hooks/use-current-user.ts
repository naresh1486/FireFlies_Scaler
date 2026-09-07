"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api-client";
import { type HealthResponse, type UserRead, queryKeys } from "@/lib/query-keys";

export function useHealth() {
  return useQuery<HealthResponse>({
    queryKey: queryKeys.health,
    queryFn: () => api.get<HealthResponse>("/api/v1/health"),
  });
}

export function useCurrentUser() {
  return useQuery<UserRead>({
    queryKey: queryKeys.currentUser,
    queryFn: () => api.get<UserRead>("/api/v1/users/me"),
  });
}
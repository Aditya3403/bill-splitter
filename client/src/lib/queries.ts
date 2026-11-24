
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { api } from "./api";

export const queryKeys = {
  members: (homeId: number) => ["members", homeId] as const,
  bills: (homeId: number) => ["bills", homeId] as const,
  balances: (homeId: number) => ["balances", homeId] as const,
};

export function useMembers(homeId: number) {
  return useQuery({
    queryKey: queryKeys.members(homeId),
    queryFn: ({ signal }) => api.getMembers(homeId, signal),
    enabled: Number.isSafeInteger(homeId) && homeId > 0,
    retry: 1,
  });
}

export function useBills(homeId: number) {
  return useQuery({
    queryKey: queryKeys.bills(homeId),
    queryFn: ({ signal }) => api.getBills(homeId, signal),
    enabled: Number.isSafeInteger(homeId) && homeId > 0,
    retry: 1,
  });
}

export function useBalances(homeId: number) {
  return useQuery({
    queryKey: queryKeys.balances(homeId),
    queryFn: ({ signal }) => api.getBalances(homeId, signal),
    enabled: Number.isSafeInteger(homeId) && homeId > 0,
    retry: 1,
  });
}

export function useAddMember(homeId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      name,
      email,
    }: {
      name: string;
      email: string;
    }) => api.addMember(homeId, name, email),

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.members(homeId),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.balances(homeId),
        }),
      ]);
    },
  });
}

export function useCreateBill(homeId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      title,
      totalCents,
    }: {
      title: string;
      totalCents: number;
    }) => api.createBill(homeId, title, totalCents),

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["bills"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["balances"],
        }),
      ]);
    },
  });
}

interface PaymentVariables {
  billId: number;
  shareId: number;
  idempotencyKey: string;
}

export function usePayShare(homeId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      billId,
      shareId,
      idempotencyKey,
    }: PaymentVariables) =>
      api.payShare(billId, shareId, idempotencyKey),

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["bills"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["balances"],
        }),
      ]);
    },
  });
}

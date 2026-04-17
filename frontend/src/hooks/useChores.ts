import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export function useMyChores() {
  return useQuery({
    queryKey: ["chores", "mine"],
    queryFn: async () => {
      const { data } = await api.get("/chores/instances/mine");
      return data;
    },
  });
}

export function usePendingChores() {
  return useQuery({
    queryKey: ["chores", "pending"],
    queryFn: async () => {
      const { data } = await api.get("/chores/instances/pending");
      return data;
    },
  });
}

export function useCompleteChore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      instanceId,
      difficulty,
    }: {
      instanceId: string;
      difficulty: string;
    }) => {
      const { data } = await api.post(
        `/chores/instances/${instanceId}/complete`,
        {
          difficulty,
        },
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chores"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

export function useChoreTemplates() {
  return useQuery({
    queryKey: ["chores", "templates"],
    queryFn: async () => {
      const { data } = await api.get("/chores");
      return data;
    },
  });
}

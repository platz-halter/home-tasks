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

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await api.get("/categories");
      return data;
    },
  });
}

export function useCreateChore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: object) => {
      const { data } = await api.post("/chores", payload);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["chores"] }),
  });
}

export function useDeleteChore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (templateId: string) => {
      await api.delete(`/chores/${templateId}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["chores"] }),
  });
}

export function useClaimChore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (instanceId: string) => {
      const { data } = await api.post(`/chores/instances/${instanceId}/claim`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chores"] });
    },
  });
}

export function useBulkComplete() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (instanceIds: string[]) => {
      const { data } = await api.post("/chores/instances/bulk-complete", {
        instance_ids: instanceIds,
        difficulty: "normal",
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chores"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

export function useQuickComplete() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (templateId: string) => {
      const { data: instance } = await api.post(`/chores/${templateId}/spawn`);
      const { data: completed } = await api.post(
        `/chores/instances/${instance.id}/complete`,
        { difficulty: "normal" },
      );
      return completed;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chores"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

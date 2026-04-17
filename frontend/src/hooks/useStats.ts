import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export function useMyStats() {
  return useQuery({
    queryKey: ["stats", "me"],
    queryFn: async () => {
      const { data } = await api.get("/stats/me");
      return data;
    },
  });
}

export function useLeaderboard() {
  return useQuery({
    queryKey: ["stats", "leaderboard"],
    queryFn: async () => {
      const { data } = await api.get("/stats/leaderboard");
      return data;
    },
  });
}

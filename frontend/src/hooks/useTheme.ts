import { useEffect } from "react";
import { useAuthStore } from "@/store/auth";

export function useTheme() {
  const { user } = useAuthStore();

  useEffect(() => {
    const root = document.documentElement;
    const theme = user?.theme ?? "light";
    root.classList.remove("light", "dark");
    root.classList.add(theme);
  }, [user?.theme]);
}

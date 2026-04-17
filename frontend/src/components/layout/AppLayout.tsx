import { Outlet } from "react-router-dom";
import { useTheme } from "@/hooks/useTheme";

export default function AppLayout() {
  useTheme();
  return (
    <div className="min-h-screen bg-background">
      <Outlet />
    </div>
  );
}

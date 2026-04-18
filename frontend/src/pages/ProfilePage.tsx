import { useState, useRef } from "react";
import { useAuthStore } from "@/store/auth";
import { useMyStats } from "@/hooks/useStats";
import api from "@/lib/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Trophy,
  CheckCircle2,
  Target,
  Camera,
  Save,
  Moon,
  Sun,
  Coffee,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const { user, setUser, fetchUser } = useAuthStore();
  const { data: stats } = useMyStats();

  const [username, setUsername] = useState(user?.username ?? "");
  const [language, setLanguage] = useState(user?.language ?? "en");
  const [theme, setTheme] = useState(user?.theme ?? "light");
  const [breakMode, setBreakMode] = useState(user?.break_mode ?? false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initials = user?.username?.slice(0, 2).toUpperCase() ?? "HQ";

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      const { data } = await api.patch("/users/me", {
        username,
        language,
        theme,
        break_mode: breakMode,
      });
      console.log("Save response:", data);
      setUser(data);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      document.documentElement.classList.remove("light", "dark");
      document.documentElement.classList.add(theme);
    } catch (err: any) {
      console.error("Save error:", err);
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        setSaveError(detail.map((d: any) => d.msg).join(", "));
      } else {
        setSaveError(detail ?? "Failed to save settings");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    setAvatarError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const { data } = await api.post("/users/me/avatar", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUser(data);
    } catch (err: any) {
      setAvatarError(err.response?.data?.detail ?? "Upload failed");
    } finally {
      setAvatarUploading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your account and preferences
        </p>
      </div>

      {/* Avatar */}
      <Card>
        <CardHeader>
          <CardTitle>Avatar</CardTitle>
          <CardDescription>
            Click your avatar to upload a new photo
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-6">
          <div className="relative">
            <Avatar
              className="h-20 w-20 cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <AvatarImage src={user?.avatar_path ?? undefined} />
              <AvatarFallback className="text-xl">{initials}</AvatarFallback>
            </Avatar>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 rounded-full bg-primary p-1.5 text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
            >
              <Camera className="h-3.5 w-3.5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
          <div className="space-y-1">
            <p className="font-medium">{user?.username}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            {avatarUploading && (
              <p className="text-xs text-muted-foreground">Uploading...</p>
            )}
            {avatarError && (
              <p className="text-xs text-destructive">{avatarError}</p>
            )}
            <p className="text-xs text-muted-foreground">
              JPEG, PNG or WebP · max 2MB
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Account settings */}
      <Card>
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
          <CardDescription>
            Update your display name and preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-6">
            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                minLength={2}
                maxLength={50}
              />
            </div>

            <Separator />

            {/* Language */}
            <div className="space-y-2">
              <Label>Language</Label>
              <div className="flex gap-2">
                {[
                  { value: "en", label: "English" },
                  { value: "de", label: "Deutsch" },
                ].map((lang) => (
                  <button
                    key={lang.value}
                    type="button"
                    onClick={() => setLanguage(lang.value)}
                    className={cn(
                      "flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors",
                      language === lang.value
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/50",
                    )}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Theme */}
            <div className="space-y-2">
              <Label>Theme</Label>
              <div className="flex gap-2">
                {[
                  { value: "light", label: "Light", icon: Sun },
                  { value: "dark", label: "Dark", icon: Moon },
                ].map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setTheme(value)}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors",
                      theme === value
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/50",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Break mode */}
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Coffee className="h-4 w-4 text-muted-foreground" />
                  <Label className="cursor-pointer" htmlFor="break-mode">
                    Break Mode
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Hide yourself from leaderboards and reports while on break
                </p>
              </div>
              <button
                id="break-mode"
                type="button"
                role="switch"
                aria-checked={breakMode}
                onClick={() => setBreakMode(!breakMode)}
                className={cn(
                  "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
                  breakMode ? "bg-primary" : "bg-muted",
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transition-transform",
                    breakMode ? "translate-x-5" : "translate-x-0",
                  )}
                />
              </button>
            </div>

            {saveError && (
              <p className="text-sm text-destructive">{saveError}</p>
            )}

            <Button type="submit" disabled={saving} className="gap-2">
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : saveSuccess ? "Saved!" : "Save changes"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Your Stats</CardTitle>
          <CardDescription>How you're doing this week</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Weekly goal */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 font-medium">
                <Target className="h-4 w-4 text-primary" />
                Weekly Goal
              </span>
              <span className="text-muted-foreground">
                {stats?.weekly_points ?? 0} / {stats?.weekly_goal ?? 100} pts
              </span>
            </div>
            <Progress
              value={stats?.completion_percentage ?? 0}
              className="h-2"
            />
            <p className="text-xs text-muted-foreground text-right">
              {stats?.completion_percentage ?? 0}% complete
            </p>
          </div>

          <Separator />

          {/* Stat grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-muted/50 p-4 space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Trophy className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-wide">
                  Total Points
                </span>
              </div>
              <p className="text-2xl font-bold">{user?.total_points ?? 0}</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-4 space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-wide">
                  Done This Week
                </span>
              </div>
              <p className="text-2xl font-bold">
                {stats?.completed_chores ?? 0}
              </p>
            </div>
          </div>

          {/* Break mode badge */}
          {user?.break_mode && (
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-4 py-3">
              <Coffee className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Break mode is active</p>
                <p className="text-xs text-muted-foreground">
                  You're hidden from leaderboards and reports
                </p>
              </div>
              <Badge variant="secondary" className="ml-auto">
                On break
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

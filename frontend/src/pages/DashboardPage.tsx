import { useAuthStore } from "@/store/auth";
import { useMyStats, useLeaderboard } from "@/hooks/useStats";
import { useMyChores, useCompleteChore } from "@/hooks/useChores";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Clock, Trophy, ListTodo, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface ChoreInstance {
  id: string;
  template_id: string;
  status: string;
  points_awarded: number | null;
  due_date: string | null;
  completed_at: string | null;
  assigned_to_id: string | null;
}

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  username: string;
  avatar_path: string | null;
  weekly_points: number;
  total_points: number;
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { data: stats, isLoading: statsLoading } = useMyStats();
  const { data: leaderboard, isLoading: lbLoading } = useLeaderboard();
  const { data: myChores, isLoading: choresLoading } = useMyChores();
  const completeChore = useCompleteChore();

  const todayChores = (myChores ?? []).filter(
    (c: ChoreInstance) =>
      c.status !== "completed" &&
      c.due_date &&
      new Date(c.due_date).toDateString() === new Date().toDateString(),
  );

  const pendingChores = (myChores ?? []).filter(
    (c: ChoreInstance) => c.status !== "completed",
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Good {getTimeOfDay()}, {user?.username} 👋
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Here's what's happening in your household today.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Weekly Points"
          value={statsLoading ? "..." : (stats?.weekly_points ?? 0)}
          icon={<Trophy className="h-4 w-4 text-muted-foreground" />}
          sub={`Goal: ${stats?.weekly_goal ?? 100} pts`}
        />
        <StatCard
          title="Completion"
          value={statsLoading ? "..." : `${stats?.completion_percentage ?? 0}%`}
          icon={<CheckCircle2 className="h-4 w-4 text-muted-foreground" />}
          sub={`${stats?.completed_chores ?? 0} chores done`}
        />
        <StatCard
          title="Assigned to Me"
          value={choresLoading ? "..." : pendingChores.length}
          icon={<ListTodo className="h-4 w-4 text-muted-foreground" />}
          sub="pending chores"
        />
        <StatCard
          title="Total Points"
          value={user?.total_points ?? 0}
          icon={<Trophy className="h-4 w-4 text-muted-foreground" />}
          sub="all time"
        />
      </div>

      {/* Weekly progress bar */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Weekly Goal Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{stats?.weekly_points ?? 0} pts</span>
            <span className="text-muted-foreground">
              {stats?.weekly_goal ?? 100} pts
            </span>
          </div>
          <Progress value={stats?.completion_percentage ?? 0} className="h-2" />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              This Week's Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lbLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : leaderboard?.entries?.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No data yet this week.
              </p>
            ) : (
              <div className="space-y-3">
                {leaderboard?.entries?.map((entry: LeaderboardEntry) => (
                  <div
                    key={entry.user_id}
                    className={cn(
                      "flex items-center gap-3 rounded-lg p-2 transition-colors",
                      entry.user_id === user?.id && "bg-primary/5",
                    )}
                  >
                    <span
                      className={cn(
                        "w-6 text-center text-sm font-bold",
                        entry.rank === 1 && "text-yellow-500",
                        entry.rank === 2 && "text-slate-400",
                        entry.rank === 3 && "text-amber-600",
                      )}
                    >
                      {entry.rank === 1
                        ? "🥇"
                        : entry.rank === 2
                          ? "🥈"
                          : entry.rank === 3
                            ? "🥉"
                            : entry.rank}
                    </span>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={entry.avatar_path ?? undefined} />
                      <AvatarFallback className="text-xs">
                        {entry.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {entry.username}
                        {entry.user_id === user?.id && (
                          <span className="text-xs text-muted-foreground ml-1">
                            (you)
                          </span>
                        )}
                      </p>
                    </div>
                    <span className="text-sm font-semibold tabular-nums">
                      {entry.weekly_points} pts
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Today's timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Due Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            {choresLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : todayChores.length === 0 ? (
              <div className="text-center py-8 space-y-1">
                <CheckCircle2 className="h-8 w-8 text-muted-foreground mx-auto" />
                <p className="text-sm text-muted-foreground">
                  Nothing due today!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayChores.map((chore: ChoreInstance) => (
                  <div
                    key={chore.id}
                    className="flex items-center gap-3 rounded-lg border border-border p-3"
                  >
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-sm font-medium truncate">
                        Chore #{chore.id.slice(0, 8)}
                      </p>
                      {chore.due_date && (
                        <p className="text-xs text-muted-foreground">
                          Due {format(new Date(chore.due_date), "h:mm a")}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant={
                        chore.status === "claimed" ? "secondary" : "outline"
                      }
                    >
                      {chore.status}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={completeChore.isPending}
                      onClick={() =>
                        completeChore.mutate({
                          instanceId: chore.id,
                          difficulty: "normal",
                        })
                      }
                    >
                      Done
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  sub,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  sub: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{sub}</p>
      </CardContent>
    </Card>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 18) return "afternoon";
  return "evening";
}

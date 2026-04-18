import { useState, useMemo } from "react";
import {
  useChoreTemplates,
  useDeleteChore,
  useCategories,
  useMyChores,
  usePendingChores,
  useCompleteChore,
  useClaimChore,
  useBulkComplete,
  useQuickComplete,
} from "@/hooks/useChores";
import ChoreCard from "@/components/chores/ChoreCard";
import CreateChoreDialog from "@/components/chores/CreateChoreDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Trash2,
  Search,
  Zap,
  Loader2,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface ChoreTemplate {
  id: string;
  name: string;
  description: string | null;
  base_points: number;
  difficulty: string;
  recurrence: string;
  is_active: boolean;
  category_id: string | null;
}

interface ChoreInstance {
  id: string;
  template_id: string;
  status: string;
  points_awarded: number | null;
  due_date: string | null;
  completed_at: string | null;
  assigned_to_id: string | null;
}

interface Category {
  id: string;
  name: string;
  icon_slug: string;
  color: string;
}

const difficultyColors: Record<string, string> = {
  normal:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  hard: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  extreme: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const statusColors: Record<string, string> = {
  pending:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  claimed: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  completed:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  skipped:
    "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400",
};

type Tab = "templates" | "instances" | "pending";

export default function ChoresPage() {
  const { data: chores, isLoading: choresLoading } = useChoreTemplates();
  const { data: myChores, isLoading: instancesLoading } = useMyChores();
  const { data: pendingChores, isLoading: pendingLoading } = usePendingChores();
  const { data: categories } = useCategories();
  const deleteChore = useDeleteChore();
  const completeChore = useCompleteChore();
  const claimChore = useClaimChore();
  const bulkComplete = useBulkComplete();
  const quickComplete = useQuickComplete();

  const [tab, setTab] = useState<Tab>("templates");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<Set<string>>(
    new Set(),
  );
  const [selectedInstanceIds, setSelectedInstanceIds] = useState<Set<string>>(
    new Set(),
  );
  const [selectedPendingIds, setSelectedPendingIds] = useState<Set<string>>(
    new Set(),
  );
  const [createOpen, setCreateOpen] = useState(false);

  const filteredTemplates = useMemo(() => {
    return (chores ?? []).filter((c: ChoreTemplate) => {
      const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = selectedCategory
        ? c.category_id === selectedCategory
        : true;
      return matchesSearch && matchesCategory;
    });
  }, [chores, search, selectedCategory]);

  const filteredInstances = useMemo(() => {
    return (myChores ?? []).filter((c: ChoreInstance) => {
      return (
        c.status !== "completed" &&
        (search ? c.id.toLowerCase().includes(search.toLowerCase()) : true)
      );
    });
  }, [myChores, search]);

  const isLoading =
    tab === "templates"
      ? choresLoading
      : tab === "instances"
        ? instancesLoading
        : pendingLoading;

  function resetTabs(t: Tab) {
    setTab(t);
    setSearch("");
    setSelectedCategory(null);
    setSelectedTemplateIds(new Set());
    setSelectedInstanceIds(new Set());
    setSelectedPendingIds(new Set());
  }

  function toggleTemplateSelect(id: string) {
    setSelectedTemplateIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleInstanceSelect(id: string) {
    setSelectedInstanceIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function togglePendingSelect(id: string) {
    setSelectedPendingIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleBulkDelete() {
    for (const id of selectedTemplateIds) {
      await deleteChore.mutateAsync(id);
    }
    setSelectedTemplateIds(new Set());
  }

  async function handleBulkComplete() {
    await bulkComplete.mutateAsync(Array.from(selectedInstanceIds));
    setSelectedInstanceIds(new Set());
  }

  async function handleBulkCompletePending() {
    await bulkComplete.mutateAsync(Array.from(selectedPendingIds));
    setSelectedPendingIds(new Set());
  }

  async function handleBulkQuickComplete() {
    for (const id of selectedTemplateIds) {
      await quickComplete.mutateAsync(id);
    }
    setSelectedTemplateIds(new Set());
  }

  async function handleDelete(id: string) {
    await deleteChore.mutateAsync(id);
    setSelectedTemplateIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  async function handleComplete(instanceId: string) {
    await completeChore.mutateAsync({ instanceId, difficulty: "normal" });
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Chores</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {tab === "templates"
              ? `${chores?.length ?? 0} chores defined`
              : tab === "instances"
                ? `${filteredInstances.length} chores assigned to you`
                : `${(pendingChores ?? []).length} pending in household`}
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          Add Chore
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {(["templates", "instances", "pending"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => resetTabs(t)}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
              tab === t
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t === "templates"
              ? "All Chores"
              : t === "instances"
                ? "My Chores"
                : "Pending"}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={
            tab === "templates"
              ? "Search chores..."
              : tab === "instances"
                ? "Search my chores..."
                : "Search pending chores..."
          }
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Category filters — horizontal scroll */}
      {tab === "templates" && (categories ?? []).length > 0 && (
        <div className="overflow-x-auto pb-1 -mx-1 px-1">
          <div className="flex gap-2 w-max">
            <Button
              variant={selectedCategory === null ? "secondary" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(null)}
              className="shrink-0"
            >
              All
            </Button>
            {(categories ?? []).map((cat: Category) => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id ? "secondary" : "outline"}
                size="sm"
                onClick={() =>
                  setSelectedCategory(
                    selectedCategory === cat.id ? null : cat.id,
                  )
                }
                className="shrink-0 gap-1.5"
                style={{
                  borderColor:
                    selectedCategory === cat.id ? cat.color : undefined,
                }}
              >
                <span>{cat.icon_slug}</span>
                {cat.name}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Bulk action — templates */}
      {tab === "templates" && selectedTemplateIds.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/50 px-4 py-2">
          <span className="text-sm font-medium">
            {selectedTemplateIds.size} selected
          </span>
          <Button
            variant="destructive"
            size="sm"
            className="gap-2 ml-auto"
            onClick={handleBulkDelete}
            disabled={deleteChore.isPending}
          >
            <Trash2 className="h-4 w-4" />
            Delete selected
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleBulkQuickComplete()}
            disabled={quickComplete.isPending}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Complete selected
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedTemplateIds(new Set())}
          >
            Clear
          </Button>
        </div>
      )}

      {/* Bulk action — my chores */}
      {tab === "instances" && selectedInstanceIds.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/50 px-4 py-2">
          <span className="text-sm font-medium">
            {selectedInstanceIds.size} selected
          </span>
          <Button
            variant="default"
            size="sm"
            className="gap-2 ml-auto"
            onClick={handleBulkComplete}
            disabled={bulkComplete.isPending}
          >
            <CheckCircle2 className="h-4 w-4" />
            Complete selected
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedInstanceIds(new Set())}
          >
            Clear
          </Button>
        </div>
      )}

      {/* Bulk action — pending */}
      {tab === "pending" && selectedPendingIds.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/50 px-4 py-2">
          <span className="text-sm font-medium">
            {selectedPendingIds.size} selected
          </span>
          <Button
            variant="default"
            size="sm"
            className="gap-2 ml-auto"
            onClick={handleBulkCompletePending}
            disabled={bulkComplete.isPending}
          >
            <CheckCircle2 className="h-4 w-4" />
            Complete selected
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedPendingIds(new Set())}
          >
            Clear
          </Button>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Templates tab */}
      {!isLoading && tab === "templates" && (
        <>
          <div className="hidden md:block rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Points</TableHead>
                  <TableHead>Difficulty</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead className="w-36"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTemplates.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-12 text-muted-foreground"
                    >
                      No chores found. Create one to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTemplates.map((chore: ChoreTemplate) => {
                    const category = (categories ?? []).find(
                      (c: Category) => c.id === chore.category_id,
                    );
                    return (
                      <TableRow
                        key={chore.id}
                        className={cn(
                          "cursor-pointer",
                          selectedTemplateIds.has(chore.id) && "bg-primary/10",
                        )}
                        onClick={() => toggleTemplateSelect(chore.id)}
                      >
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedTemplateIds.has(chore.id)}
                            onChange={() => toggleTemplateSelect(chore.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="rounded border-border"
                          />
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">{chore.name}</p>
                          {chore.description && (
                            <p className="text-xs text-muted-foreground truncate max-w-xs">
                              {chore.description}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          {category ? (
                            <Badge variant="outline" className="gap-1">
                              <span>{category.icon_slug}</span>
                              {category.name}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              —
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="flex items-center gap-1 text-sm font-medium">
                            <Zap className="h-3 w-3 text-yellow-500" />
                            {chore.base_points}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={cn(
                              "border-0",
                              difficultyColors[chore.difficulty],
                            )}
                          >
                            {chore.difficulty}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{chore.recurrence}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1.5"
                              disabled={quickComplete.isPending}
                              onClick={(e) => {
                                e.stopPropagation();
                                quickComplete.mutate(chore.id);
                              }}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Done
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(chore.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <div className="grid grid-cols-1 gap-3 md:hidden">
            {filteredTemplates.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                No chores found. Create one to get started.
              </div>
            ) : (
              filteredTemplates.map((chore: ChoreTemplate) => (
                <ChoreCard
                  key={chore.id}
                  chore={chore}
                  selected={selectedTemplateIds.has(chore.id)}
                  onSelect={toggleTemplateSelect}
                  onDelete={handleDelete}
                  onQuickComplete={(id) => quickComplete.mutate(id)}
                />
              ))
            )}
          </div>
        </>
      )}

      {/* My Chores tab */}
      {!isLoading && tab === "instances" && (
        <>
          <div className="hidden md:block rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Chore</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInstances.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-12 text-muted-foreground"
                    >
                      <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      No pending chores assigned to you.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInstances.map((instance: ChoreInstance) => {
                    const template = (chores ?? []).find(
                      (t: ChoreTemplate) => t.id === instance.template_id,
                    );
                    const isOverdue =
                      instance.due_date &&
                      new Date(instance.due_date) < new Date();
                    return (
                      <TableRow
                        key={instance.id}
                        className={cn(
                          "cursor-pointer",
                          selectedInstanceIds.has(instance.id) &&
                            "bg-primary/10",
                        )}
                        onClick={() => toggleInstanceSelect(instance.id)}
                      >
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedInstanceIds.has(instance.id)}
                            onChange={() => toggleInstanceSelect(instance.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="rounded border-border"
                          />
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">
                            {template?.name ??
                              `Chore #${instance.id.slice(0, 8)}`}
                          </p>
                          {template?.base_points && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                              <Zap className="h-3 w-3 text-yellow-500" />
                              {template.base_points} pts
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={cn(
                              "border-0",
                              statusColors[instance.status],
                            )}
                          >
                            {instance.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {instance.due_date ? (
                            <span
                              className={cn(
                                "flex items-center gap-1 text-sm",
                                isOverdue
                                  ? "text-destructive"
                                  : "text-muted-foreground",
                              )}
                            >
                              <Clock className="h-3 w-3" />
                              {format(new Date(instance.due_date), "MMM d")}
                              {isOverdue && " (overdue)"}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              No deadline
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5"
                            disabled={completeChore.isPending}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleComplete(instance.id);
                            }}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Done
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <div className="grid grid-cols-1 gap-3 md:hidden">
            {filteredInstances.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-40" />
                No pending chores assigned to you.
              </div>
            ) : (
              filteredInstances.map((instance: ChoreInstance) => {
                const template = (chores ?? []).find(
                  (t: ChoreTemplate) => t.id === instance.template_id,
                );
                const isOverdue =
                  instance.due_date && new Date(instance.due_date) < new Date();
                return (
                  <div
                    key={instance.id}
                    className={cn(
                      "rounded-lg border border-border bg-card p-4 space-y-3 cursor-pointer transition-colors",
                      selectedInstanceIds.has(instance.id) &&
                        "ring-2 ring-primary",
                    )}
                    onClick={() => toggleInstanceSelect(instance.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <p className="font-medium">
                          {template?.name ??
                            `Chore #${instance.id.slice(0, 8)}`}
                        </p>
                        {instance.due_date && (
                          <p
                            className={cn(
                              "text-xs flex items-center gap-1",
                              isOverdue
                                ? "text-destructive"
                                : "text-muted-foreground",
                            )}
                          >
                            <Clock className="h-3 w-3" />
                            Due {format(new Date(instance.due_date), "MMM d")}
                            {isOverdue && " (overdue)"}
                          </p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 shrink-0"
                        disabled={completeChore.isPending}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleComplete(instance.id);
                        }}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Done
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge
                        className={cn(
                          "border-0",
                          statusColors[instance.status],
                        )}
                      >
                        {instance.status}
                      </Badge>
                      {template?.base_points && (
                        <Badge variant="secondary" className="gap-1">
                          <Zap className="h-3 w-3" />
                          {template.base_points} pts
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* Pending tab */}
      {!isLoading && tab === "pending" && (
        <>
          <div className="hidden md:block rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Chore</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(pendingChores ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-12 text-muted-foreground"
                    >
                      <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      No pending chores in the household.
                    </TableCell>
                  </TableRow>
                ) : (
                  (pendingChores ?? []).map((instance: ChoreInstance) => {
                    const template = (chores ?? []).find(
                      (t: ChoreTemplate) => t.id === instance.template_id,
                    );
                    const isOverdue =
                      instance.due_date &&
                      new Date(instance.due_date) < new Date();
                    return (
                      <TableRow
                        key={instance.id}
                        className={cn(
                          "cursor-pointer",
                          selectedPendingIds.has(instance.id) &&
                            "bg-primary/10",
                        )}
                        onClick={() => togglePendingSelect(instance.id)}
                      >
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedPendingIds.has(instance.id)}
                            onChange={() => togglePendingSelect(instance.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="rounded border-border"
                          />
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">
                            {template?.name ??
                              `Chore #${instance.id.slice(0, 8)}`}
                          </p>
                          {template?.base_points && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                              <Zap className="h-3 w-3 text-yellow-500" />
                              {template.base_points} pts
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={cn(
                              "border-0",
                              statusColors[instance.status],
                            )}
                          >
                            {instance.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {instance.due_date ? (
                            <span
                              className={cn(
                                "flex items-center gap-1 text-sm",
                                isOverdue
                                  ? "text-destructive"
                                  : "text-muted-foreground",
                              )}
                            >
                              <Clock className="h-3 w-3" />
                              {format(new Date(instance.due_date), "MMM d")}
                              {isOverdue && " (overdue)"}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              No deadline
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5"
                            disabled={completeChore.isPending}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleComplete(instance.id);
                            }}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Done
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <div className="grid grid-cols-1 gap-3 md:hidden">
            {(pendingChores ?? []).length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-40" />
                No pending chores in the household.
              </div>
            ) : (
              (pendingChores ?? []).map((instance: ChoreInstance) => {
                const template = (chores ?? []).find(
                  (t: ChoreTemplate) => t.id === instance.template_id,
                );
                const isOverdue =
                  instance.due_date && new Date(instance.due_date) < new Date();
                return (
                  <div
                    key={instance.id}
                    className={cn(
                      "rounded-lg border border-border bg-card p-4 space-y-3 cursor-pointer transition-colors",
                      selectedPendingIds.has(instance.id) &&
                        "ring-2 ring-primary",
                    )}
                    onClick={() => togglePendingSelect(instance.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <p className="font-medium">
                          {template?.name ??
                            `Chore #${instance.id.slice(0, 8)}`}
                        </p>
                        {instance.due_date && (
                          <p
                            className={cn(
                              "text-xs flex items-center gap-1",
                              isOverdue
                                ? "text-destructive"
                                : "text-muted-foreground",
                            )}
                          >
                            <Clock className="h-3 w-3" />
                            Due {format(new Date(instance.due_date), "MMM d")}
                            {isOverdue && " (overdue)"}
                          </p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 shrink-0"
                        disabled={completeChore.isPending}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleComplete(instance.id);
                        }}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Done
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge
                        className={cn(
                          "border-0",
                          statusColors[instance.status],
                        )}
                      >
                        {instance.status}
                      </Badge>
                      {template?.base_points && (
                        <Badge variant="secondary" className="gap-1">
                          <Zap className="h-3 w-3" />
                          {template.base_points} pts
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      <CreateChoreDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />
    </div>
  );
}

import { useState } from "react";
import { useCreateChore, useCategories } from "@/hooks/useChores";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  open: boolean;
  onClose: () => void;
}

const RECURRENCE_OPTIONS = ["once", "weekly", "monthly"];
const DIFFICULTY_OPTIONS = ["normal", "hard", "extreme"];

export default function CreateChoreDialog({ open, onClose }: Props) {
  const createChore = useCreateChore();
  const { data: categories } = useCategories();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [basePoints, setBasePoints] = useState(10);
  const [recurrence, setRecurrence] = useState("once");
  const [difficulty, setDifficulty] = useState("normal");
  const [categoryId, setCategoryId] = useState("");
  const [durationDays, setDurationDays] = useState<number | "">("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await createChore.mutateAsync({
        name,
        description: description || null,
        base_points: basePoints,
        recurrence,
        difficulty,
        category_id: categoryId || null,
        suggested_duration_days: durationDays || null,
      });
      handleClose();
    } catch (err: any) {
      setError(err.response?.data?.detail ?? "Failed to create chore");
    }
  }

  function handleClose() {
    setName("");
    setDescription("");
    setBasePoints(10);
    setRecurrence("once");
    setDifficulty("normal");
    setCategoryId("");
    setDurationDays("");
    setError(null);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Chore</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Vacuum living room"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Include corners and under couch"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="points">Points</Label>
              <Input
                id="points"
                type="number"
                min={1}
                max={1000}
                value={basePoints}
                onChange={(e) => setBasePoints(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Deadline (days)</Label>
              <Input
                id="duration"
                type="number"
                min={1}
                placeholder="Optional"
                value={durationDays}
                onChange={(e) =>
                  setDurationDays(e.target.value ? Number(e.target.value) : "")
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="recurrence">Schedule</Label>
              <select
                id="recurrence"
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                {RECURRENCE_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty</Label>
              <select
                id="difficulty"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                {DIFFICULTY_OPTIONS.map((d) => (
                  <option key={d} value={d}>
                    {d.charAt(0).toUpperCase() + d.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {categories?.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="category">Category (optional)</Label>
              <select
                id="category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                <option value="">No category</option>
                {categories.map((c: { id: string; name: string }) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createChore.isPending}>
              {createChore.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

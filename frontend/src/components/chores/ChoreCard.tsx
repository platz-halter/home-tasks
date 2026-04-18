import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

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

interface Props {
  chore: ChoreTemplate;
  selected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

const difficultyColors: Record<string, string> = {
  normal:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  hard: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  extreme: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export default function ChoreCard({
  chore,
  selected,
  onSelect,
  onDelete,
}: Props) {
  return (
    <Card
      className={cn(
        "transition-colors cursor-pointer",
        selected && "ring-2 ring-primary",
      )}
      onClick={() => onSelect(chore.id)}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <p className="font-medium leading-tight">{chore.name}</p>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(chore.id);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {chore.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {chore.description}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="gap-1">
            <Zap className="h-3 w-3" />
            {chore.base_points} pts
          </Badge>
          <Badge className={cn("border-0", difficultyColors[chore.difficulty])}>
            {chore.difficulty}
          </Badge>
          <Badge variant="outline">{chore.recurrence}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}

import { cn } from "@/lib/utils";
import type { TaskStatus } from "@/types";

const map: Record<TaskStatus, { label: string; cls: string }> = {
  todo: { label: "Todo", cls: "bg-muted text-muted-foreground" },
  "in-progress": { label: "In progress", cls: "bg-info/10 text-info" },
  done: { label: "Done", cls: "bg-success/10 text-success" },
};

export function StatusBadge({ status, className }: { status: TaskStatus; className?: string }) {
  const m = map[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium", m.cls, className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {m.label}
    </span>
  );
}

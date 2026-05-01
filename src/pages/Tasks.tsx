import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { tasksApi } from "@/services/api/tasks";
import { projectsApi } from "@/services/api/projects";
import { usersApi } from "@/services/api/users";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Pencil, CheckSquare, MoreVertical } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RowSkeleton } from "@/components/Skeletons";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";
import { UserBadge } from "@/components/AvatarStack";
import { format, isPast, isToday } from "date-fns";
import { useAuth } from "@/context/AuthContext";
import { TaskFormDialog } from "@/components/TaskFormDialog";
import { toast } from "sonner";
import type { Task, TaskStatus } from "@/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

type Filter = "all" | "pending" | "completed" | "overdue";

export default function Tasks() {
  const { user, isAdmin } = useAuth();
  const qc = useQueryClient();
  const { data: tasks = [], isLoading } = useQuery({ queryKey: ["tasks"], queryFn: tasksApi.list });
  const { data: projects = [] } = useQuery({ queryKey: ["projects"], queryFn: projectsApi.list });
  const { data: users = [] } = useQuery({ queryKey: ["users"], queryFn: usersApi.list });

  const [filter, setFilter] = useState<Filter>("all");
  const [scope, setScope] = useState<"mine" | "all">("mine");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Task | undefined>();
  const [deleting, setDeleting] = useState<Task | undefined>();

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) => tasksApi.update(id, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Status updated");
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => tasksApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task deleted");
      setDeleting(undefined);
    },
  });

  const filtered = useMemo(() => {
    let list = tasks;
    if (scope === "mine" && user) list = list.filter((t) => t.assigneeId === user.id);
    if (filter === "pending") list = list.filter((t) => t.status !== "done");
    if (filter === "completed") list = list.filter((t) => t.status === "done");
    if (filter === "overdue") list = list.filter((t) => t.status !== "done" && isPast(new Date(t.dueDate)) && !isToday(new Date(t.dueDate)));
    return list;
  }, [tasks, filter, scope, user]);

  const counts = useMemo(() => ({
    all: tasks.length,
    pending: tasks.filter((t) => t.status !== "done").length,
    completed: tasks.filter((t) => t.status === "done").length,
    overdue: tasks.filter((t) => t.status !== "done" && isPast(new Date(t.dueDate)) && !isToday(new Date(t.dueDate))).length,
  }), [tasks]);

  const openCreate = () => { setEditing(undefined); setDialogOpen(true); };
  const openEdit = (t: Task) => { setEditing(t); setDialogOpen(true); };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tasks</h1>
          <p className="text-sm text-muted-foreground mt-1">Track everything on your plate.</p>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={scope} onValueChange={(v) => setScope(v as "mine" | "all")}>
            <TabsList>
              <TabsTrigger value="mine">My tasks</TabsTrigger>
              <TabsTrigger value="all">All tasks</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button onClick={openCreate}><Plus className="h-4 w-4 mr-1.5" /> New task</Button>
        </div>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
        <TabsList className="bg-muted/60">
          <TabsTrigger value="all">All <span className="ml-1.5 text-muted-foreground">{counts.all}</span></TabsTrigger>
          <TabsTrigger value="pending">Pending <span className="ml-1.5 text-muted-foreground">{counts.pending}</span></TabsTrigger>
          <TabsTrigger value="completed">Completed <span className="ml-1.5 text-muted-foreground">{counts.completed}</span></TabsTrigger>
          <TabsTrigger value="overdue">Overdue <span className="ml-1.5 text-destructive">{counts.overdue}</span></TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="hidden md:grid grid-cols-[1fr_180px_140px_140px_60px] gap-4 px-5 py-3 border-b border-border bg-muted/40 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          <span>Task</span>
          <span>Project</span>
          <span>Assignee</span>
          <span>Due</span>
          <span></span>
        </div>

        {isLoading ? (
          <>{[0,1,2,3,4].map((i) => <RowSkeleton key={i} />)}</>
        ) : filtered.length === 0 ? (
          <div className="p-2"><EmptyState
            icon={<CheckSquare className="h-6 w-6" />}
            title="No tasks here"
            description="When tasks are added, they'll show up in this list."
            action={<Button onClick={openCreate} variant="outline"><Plus className="h-4 w-4 mr-1.5" /> Create task</Button>}
          /></div>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((t) => {
              const project = projects.find((p) => p.id === t.projectId);
              const assignee = users.find((u) => u.id === t.assigneeId);
              const due = new Date(t.dueDate);
              const overdue = t.status !== "done" && isPast(due) && !isToday(due);
              const canModify = isAdmin || t.assigneeId === user?.id;
              return (
                <li key={t.id} className="grid grid-cols-1 md:grid-cols-[1fr_180px_140px_140px_60px] gap-2 md:gap-4 px-5 py-3 items-center hover:bg-muted/30 transition-colors">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{t.title}</p>
                    <div className="md:hidden flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      {project && <span>{project.name}</span>}
                      <span>·</span>
                      <span className={cn(overdue && "text-destructive font-medium")}>{format(due, "MMM d")}</span>
                    </div>
                  </div>
                  <div className="hidden md:flex items-center gap-2 min-w-0">
                    {project && <span className="h-2 w-2 rounded-full shrink-0" style={{ background: `hsl(${project.color})` }} />}
                    <span className="text-sm text-muted-foreground truncate">{project?.name ?? "—"}</span>
                  </div>
                  <div className="hidden md:flex items-center gap-2">
                    {assignee ? (<><UserBadge name={assignee.name} /><span className="text-sm truncate">{assignee.name.split(" ")[0]}</span></>) : (<span className="text-sm text-muted-foreground">Unassigned</span>)}
                  </div>
                  <div className="flex items-center gap-3 md:gap-2">
                    <Select value={t.status} onValueChange={(v) => canModify && updateStatus.mutate({ id: t.id, status: v as TaskStatus })} disabled={!canModify}>
                      <SelectTrigger className="h-8 w-[130px] border-0 bg-transparent px-1 hover:bg-muted [&>svg]:opacity-50">
                        <StatusBadge status={t.status} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todo">Todo</SelectItem>
                        <SelectItem value="in-progress">In progress</SelectItem>
                        <SelectItem value="done">Done</SelectItem>
                      </SelectContent>
                    </Select>
                    <span className={cn("hidden md:inline text-sm whitespace-nowrap", overdue ? "text-destructive font-medium" : "text-muted-foreground")}>
                      {format(due, "MMM d")}
                    </span>
                  </div>
                  <div className="hidden md:flex justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(t)} disabled={!canModify}>
                          <Pencil className="h-4 w-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDeleting(t)} disabled={!isAdmin} className="text-destructive focus:text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <TaskFormDialog open={dialogOpen} onOpenChange={setDialogOpen} task={editing} />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this task?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleting && removeMutation.mutate(deleting.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

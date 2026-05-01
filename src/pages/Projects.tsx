import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { projectsApi } from "@/services/api/projects";
import { tasksApi } from "@/services/api/tasks";
import { usersApi } from "@/services/api/users";
import { Button } from "@/components/ui/button";
import { Plus, MoreVertical, Pencil, Trash2, FolderKanban } from "lucide-react";
import { CardSkeleton } from "@/components/Skeletons";
import { EmptyState } from "@/components/EmptyState";
import { AvatarStack } from "@/components/AvatarStack";
import { Progress } from "@/components/ui/progress";
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
import { useAuth } from "@/context/AuthContext";
import { ProjectFormDialog } from "@/components/ProjectFormDialog";
import { toast } from "sonner";
import type { Project } from "@/types";
import { formatDistanceToNow } from "date-fns";

export default function Projects() {
  const { isAdmin } = useAuth();
  const qc = useQueryClient();
  const { data: projects = [], isLoading } = useQuery({ queryKey: ["projects"], queryFn: projectsApi.list });
  const { data: tasks = [] } = useQuery({ queryKey: ["tasks"], queryFn: tasksApi.list });
  const { data: users = [] } = useQuery({ queryKey: ["users"], queryFn: usersApi.list });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Project | undefined>();
  const [deleting, setDeleting] = useState<Project | undefined>();

  const removeMutation = useMutation({
    mutationFn: (id: string) => projectsApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Project deleted");
      setDeleting(undefined);
    },
  });

  const openCreate = () => { setEditing(undefined); setDialogOpen(true); };
  const openEdit = (p: Project) => { setEditing(p); setDialogOpen(true); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground mt-1">All work in flight, organized by initiative.</p>
        </div>
        <Button onClick={openCreate} disabled={!isAdmin} title={!isAdmin ? "Admins only" : undefined}>
          <Plus className="h-4 w-4 mr-1.5" /> New project
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[0,1,2,3,4,5].map(i => <CardSkeleton key={i} />)}</div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={<FolderKanban className="h-6 w-6" />}
          title="No projects yet"
          description="Create your first project to start organizing tasks and collaborating with your team."
          action={isAdmin ? <Button onClick={openCreate}><Plus className="h-4 w-4 mr-1.5" /> New project</Button> : undefined}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => {
            const projectTasks = tasks.filter((t) => t.projectId === p.id);
            const done = projectTasks.filter((t) => t.status === "done").length;
            const progress = projectTasks.length ? Math.round((done / projectTasks.length) * 100) : 0;
            return (
              <div key={p.id} className="group rounded-xl border border-border bg-card p-5 hover:shadow-elevated hover:border-primary/30 transition-all">
                <div className="flex items-start justify-between">
                  <Link to={`/projects/${p.id}`} className="flex items-center gap-2 min-w-0 hover:text-primary transition-colors">
                    <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: `hsl(${p.color})` }} />
                    <h3 className="font-semibold truncate">{p.name}</h3>
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link to={`/projects/${p.id}`}>Open project</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openEdit(p)} disabled={!isAdmin}>
                        <Pencil className="h-4 w-4 mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setDeleting(p)} disabled={!isAdmin} className="text-destructive focus:text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2 min-h-[40px]">{p.description}</p>
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                    <span>{done}/{projectTasks.length} tasks</span>
                    <span className="font-medium text-foreground">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-1.5" />
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                  <AvatarStack ids={p.memberIds} users={users} />
                  <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(p.createdAt), { addSuffix: true })}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ProjectFormDialog open={dialogOpen} onOpenChange={setDialogOpen} project={editing} />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this project?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <span className="font-medium text-foreground">{deleting?.name}</span> and all of its tasks. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleting && removeMutation.mutate(deleting.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { projectsApi } from "@/services/api/projects";
import { tasksApi } from "@/services/api/tasks";
import { usersApi } from "@/services/api/users";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  ArrowLeft,
  UserPlus,
  Trash2,
  Repeat,
  CheckCircle2,
  Clock,
  Circle,
  AlertCircle,
} from "lucide-react";
import { UserBadge } from "@/components/AvatarStack";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { CardSkeleton } from "@/components/Skeletons";
import { AddMemberDialog, ReplaceMemberDialog } from "@/components/MemberDialogs";
import { toast } from "sonner";
import type { Role, Task, User } from "@/types";
import { formatDistanceToNow } from "date-fns";

type WorkloadMetric = "assigned" | "completed" | "overdue";

const isOverdue = (t: Task) => t.status !== "done" && new Date(t.dueDate).getTime() < Date.now();

function MemberRowSkeleton() {
  return (
    <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 p-4">
      <div className="flex items-center gap-3 min-w-0 md:w-64">
        <Skeleton className="h-9 w-9 rounded-full" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-3.5 w-32" />
          <Skeleton className="h-3 w-40" />
        </div>
      </div>
      <div className="flex-1 grid grid-cols-3 gap-3 md:gap-6">
        <Skeleton className="h-8 w-12" />
        <Skeleton className="h-8 w-12" />
        <Skeleton className="h-8 w-full max-w-[160px]" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-[110px]" />
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-8" />
      </div>
    </div>
  );
}

export default function ProjectDetails() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { isAdmin } = useAuth();

  const projectQuery = useQuery({
    queryKey: ["project", id],
    queryFn: () => projectsApi.get(id),
  });
  const tasksQuery = useQuery({ queryKey: ["tasks"], queryFn: tasksApi.list });
  const usersQuery = useQuery({ queryKey: ["users"], queryFn: usersApi.list });

  const project = projectQuery.data;
  const tasks = tasksQuery.data ?? [];
  const users = usersQuery.data ?? [];

  const [addOpen, setAddOpen] = useState(false);
  const [replaceTarget, setReplaceTarget] = useState<User | undefined>();
  const [removeTarget, setRemoveTarget] = useState<User | undefined>();
  const [workloadMetric, setWorkloadMetric] = useState<WorkloadMetric>("assigned");

  const removeMutation = useMutation({
    mutationFn: (userId: string) => {
      if (!isAdmin) throw new Error("Admins only");
      return projectsApi.removeMember(id, userId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project", id] });
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Member removed");
      setRemoveTarget(undefined);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: Role }) => {
      if (!isAdmin) throw new Error("Admins only");
      const targetUser = users.find(u => u.id === userId);
      if (!targetUser) throw new Error("User not found");
      if (targetUser.role === "admin") throw new Error("Cannot change role of another admin");
      return usersApi.updateRole(userId, role);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      toast.success("Role updated");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  if (projectQuery.isLoading) {
    return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[0,1,2].map(i => <CardSkeleton key={i} />)}</div>;
  }

  if (!project) {
    return (
      <EmptyState
        title="Project not found"
        description="It may have been deleted or you don't have access."
        action={<Button onClick={() => navigate("/projects")}><ArrowLeft className="h-4 w-4 mr-1.5" /> Back to projects</Button>}
      />
    );
  }

  const projectTasks = tasks.filter((t) => t.projectId === project.id);
  const done = projectTasks.filter((t) => t.status === "done").length;
  const inProgress = projectTasks.filter((t) => t.status === "in-progress").length;
  const todo = projectTasks.filter((t) => t.status === "todo").length;
  const progress = projectTasks.length ? Math.round((done / projectTasks.length) * 100) : 0;

  const members = project.memberIds
    .map((mid) => users.find((u) => u.id === mid))
    .filter(Boolean) as User[];

  // Per-member counts
  const memberStats = members.map((m) => {
    const mTasks = projectTasks.filter((t) => t.assigneeId === m.id);
    return {
      user: m,
      assigned: mTasks.length,
      completed: mTasks.filter((t) => t.status === "done").length,
      overdue: mTasks.filter(isOverdue).length,
    };
  });

  const metricLabel: Record<WorkloadMetric, string> = {
    assigned: "Assigned",
    completed: "Completed",
    overdue: "Overdue",
  };

  // Max for the currently selected workload metric (avoid divide-by-zero)
  const maxForMetric = Math.max(1, ...memberStats.map((s) => s[workloadMetric]));

  const supportingDataLoading = tasksQuery.isLoading || usersQuery.isLoading;
  const supportingDataError = tasksQuery.isError || usersQuery.isError;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/projects" className="hover:text-foreground transition-colors">Projects</Link>
        <span>/</span>
        <span className="text-foreground font-medium truncate">{project.name}</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="h-10 w-10 rounded-lg shrink-0" style={{ background: `hsl(${project.color})` }} />
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight truncate">{project.name}</h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{project.description}</p>
            <p className="text-xs text-muted-foreground mt-2">
              Created {formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" onClick={() => navigate("/projects")}>
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Back
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />} label="Completed" value={done} />
        <StatCard icon={<Clock className="h-4 w-4 text-amber-600" />} label="In progress" value={inProgress} />
        <StatCard icon={<Circle className="h-4 w-4 text-muted-foreground" />} label="To do" value={todo} />
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground">Overall progress</div>
          <div className="mt-2 flex items-center gap-3">
            <div className="text-xl font-semibold">{progress}%</div>
            <Progress value={progress} className="h-1.5 flex-1" />
          </div>
        </div>
      </div>

      <Tabs defaultValue="members">
        <TabsList>
          <TabsTrigger value="members">Members ({members.length})</TabsTrigger>
          <TabsTrigger value="tasks">Tasks ({projectTasks.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="mt-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">Project members</h2>
              <p className="text-xs text-muted-foreground">Manage who can collaborate on this project.</p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <ToggleGroup
                type="single"
                size="sm"
                value={workloadMetric}
                onValueChange={(v) => v && setWorkloadMetric(v as WorkloadMetric)}
                className="border border-border rounded-md p-0.5"
              >
                <ToggleGroupItem value="assigned" className="h-7 px-2.5 text-xs">Assigned</ToggleGroupItem>
                <ToggleGroupItem value="completed" className="h-7 px-2.5 text-xs">Completed</ToggleGroupItem>
                <ToggleGroupItem value="overdue" className="h-7 px-2.5 text-xs">Overdue</ToggleGroupItem>
              </ToggleGroup>
              {isAdmin && (
                <Button onClick={() => setAddOpen(true)}>
                  <UserPlus className="h-4 w-4 mr-1.5" /> Add member
                </Button>
              )}
            </div>
          </div>

          {supportingDataError ? (
            <EmptyState
              icon={<AlertCircle className="h-6 w-6 text-destructive" />}
              title="Couldn't load member data"
              description="Something went wrong fetching tasks or users. Please try again."
              action={
                <Button
                  variant="outline"
                  onClick={() => {
                    tasksQuery.refetch();
                    usersQuery.refetch();
                  }}
                >
                  Retry
                </Button>
              }
            />
          ) : supportingDataLoading ? (
            <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
              {[0, 1, 2].map((i) => <MemberRowSkeleton key={i} />)}
            </div>
          ) : members.length === 0 ? (
            <EmptyState
              icon={<UserPlus className="h-6 w-6" />}
              title="No members yet"
              description="Add teammates to start assigning work on this project."
              action={isAdmin ? <Button onClick={() => setAddOpen(true)}><UserPlus className="h-4 w-4 mr-1.5" /> Add member</Button> : undefined}
            />
          ) : (
            <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
              {memberStats.map(({ user: m, assigned, completed, overdue }) => {
                const metricValue = workloadMetric === "assigned" ? assigned : workloadMetric === "completed" ? completed : overdue;
                const loadPct = Math.round((metricValue / maxForMetric) * 100);
                return (
                  <div key={m.id} className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 p-4">
                    <div className="flex items-center gap-3 min-w-0 md:w-64">
                      <UserBadge name={m.name} size="md" />
                      <div className="min-w-0">
                        <p className="font-medium truncate">{m.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                      </div>
                    </div>

                    <div className="flex-1 grid grid-cols-3 gap-3 md:gap-6 text-sm">
                      <div>
                        <div className="text-xs text-muted-foreground">Assigned</div>
                        <div className="font-semibold">{assigned}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Completed</div>
                        <div className="font-semibold">{completed}</div>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-muted-foreground">{metricLabel[workloadMetric]}</span>
                          <span className="text-xs font-medium">{metricValue}</span>
                        </div>
                        <Progress value={loadPct} className="h-1.5" />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 md:w-auto">
                      {isAdmin ? (
                        m.role === "admin" ? (
                          <Badge variant="default" className="capitalize">Admin</Badge>
                        ) : (
                          <Select
                            value={m.role}
                            onValueChange={(v) => roleMutation.mutate({ userId: m.id, role: v as Role })}
                          >
                            <SelectTrigger className="h-8 w-[110px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="member">Member</SelectItem>
                            </SelectContent>
                          </Select>
                        )
                      ) : (
                        <Badge variant={m.role === "admin" ? "default" : "secondary"} className="capitalize">{m.role}</Badge>
                      )}
                      {isAdmin && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => setReplaceTarget(m)}>
                            <Repeat className="h-3.5 w-3.5 mr-1" /> Replace
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setRemoveTarget(m)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="tasks" className="mt-5">
          {projectTasks.length === 0 ? (
            <EmptyState title="No tasks yet" description="Tasks created for this project will show up here." />
          ) : (
            <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
              {projectTasks.map((t) => {
                const assignee = users.find((u) => u.id === t.assigneeId);
                return (
                  <div key={t.id} className="flex items-center gap-3 p-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{t.title}</p>
                      <p className="text-xs text-muted-foreground">
                        Due {formatDistanceToNow(new Date(t.dueDate), { addSuffix: true })}
                      </p>
                    </div>
                    <StatusBadge status={t.status} />
                    {assignee ? (
                      <div className="flex items-center gap-2">
                        <UserBadge name={assignee.name} />
                        <span className="text-xs text-muted-foreground hidden sm:inline">{assignee.name}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Unassigned</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {isAdmin && (
        <>
          <AddMemberDialog open={addOpen} onOpenChange={setAddOpen} project={project} />
          <ReplaceMemberDialog
            open={!!replaceTarget}
            onOpenChange={(o) => !o && setReplaceTarget(undefined)}
            project={project}
            oldMember={replaceTarget}
          />

          <AlertDialog open={!!removeTarget} onOpenChange={(o) => !o && setRemoveTarget(undefined)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove {removeTarget?.name} from project?</AlertDialogTitle>
                <AlertDialogDescription>
                  They will lose access to <span className="font-medium text-foreground">{project.name}</span> and their assigned tasks here will be unassigned.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => removeTarget && removeMutation.mutate(removeTarget.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Remove
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">{icon} {label}</div>
      <div className="text-xl font-semibold mt-2">{value}</div>
    </div>
  );
}

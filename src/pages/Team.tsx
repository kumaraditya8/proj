import { useQuery } from "@tanstack/react-query";
import { usersApi } from "@/services/api/users";
import { tasksApi } from "@/services/api/tasks";
import { CardSkeleton } from "@/components/Skeletons";
import { UserBadge } from "@/components/AvatarStack";
import { Badge } from "@/components/ui/badge";

export default function Team() {
  const { data: users = [], isLoading } = useQuery({ queryKey: ["users"], queryFn: usersApi.list });
  const { data: tasks = [] } = useQuery({ queryKey: ["tasks"], queryFn: tasksApi.list });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Team</h1>
        <p className="text-sm text-muted-foreground mt-1">Everyone in your workspace.</p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[0,1,2,3].map(i => <CardSkeleton key={i} />)}</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {users.map((u) => {
            const open = tasks.filter((t) => t.assigneeId === u.id && t.status !== "done").length;
            const done = tasks.filter((t) => t.assigneeId === u.id && t.status === "done").length;
            return (
              <div key={u.id} className="rounded-xl border border-border bg-card p-5 hover:shadow-elevated transition-shadow">
                <div className="flex items-center gap-3">
                  <UserBadge name={u.name} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold truncate">{u.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                  </div>
                  <Badge variant={u.role === "admin" ? "default" : "secondary"} className="capitalize">{u.role}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-border">
                  <div>
                    <div className="text-lg font-semibold">{open}</div>
                    <div className="text-xs text-muted-foreground">Open tasks</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold">{done}</div>
                    <div className="text-xs text-muted-foreground">Completed</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

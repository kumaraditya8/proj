import { useQuery } from "@tanstack/react-query";
import { tasksApi } from "@/services/api/tasks";
import { projectsApi } from "@/services/api/projects";
import { usersApi } from "@/services/api/users";
import { CheckCircle2, Clock, AlertTriangle, ListTodo, ArrowUpRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { CardSkeleton } from "@/components/Skeletons";
import { StatusBadge } from "@/components/StatusBadge";
import { UserBadge } from "@/components/AvatarStack";
import { format, isPast, isToday } from "date-fns";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const STATUS_COLORS: Record<string, string> = {
  todo: "hsl(220 9% 60%)",
  "in-progress": "hsl(217 91% 60%)",
  done: "hsl(142 71% 45%)",
};

function StatCard({ icon: Icon, label, value, trend, tint }: { icon: any; label: string; value: number | string; trend?: string; tint: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 hover:shadow-elevated transition-shadow">
      <div className="flex items-center justify-between">
        <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${tint}`}>
          <Icon className="h-4 w-4" />
        </div>
        {trend && <span className="text-xs text-muted-foreground inline-flex items-center gap-1"><ArrowUpRight className="h-3 w-3" />{trend}</span>}
      </div>
      <div className="mt-4">
        <div className="text-2xl font-semibold tracking-tight">{value}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data: tasks = [], isLoading: tLoading } = useQuery({ queryKey: ["tasks"], queryFn: tasksApi.list });
  const { data: projects = [] } = useQuery({ queryKey: ["projects"], queryFn: projectsApi.list });
  const { data: users = [] } = useQuery({ queryKey: ["users"], queryFn: usersApi.list });

  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "done").length;
  const pending = tasks.filter((t) => t.status !== "done").length;
  const overdue = tasks.filter((t) => t.status !== "done" && isPast(new Date(t.dueDate)) && !isToday(new Date(t.dueDate))).length;

  const statusData = [
    { name: "Todo", value: tasks.filter((t) => t.status === "todo").length, key: "todo" },
    { name: "In progress", value: tasks.filter((t) => t.status === "in-progress").length, key: "in-progress" },
    { name: "Done", value: done, key: "done" },
  ];

  const perProject = projects.map((p) => ({
    name: p.name.length > 14 ? p.name.slice(0, 14) + "…" : p.name,
    done: tasks.filter((t) => t.projectId === p.id && t.status === "done").length,
    open: tasks.filter((t) => t.projectId === p.id && t.status !== "done").length,
  }));

  const dueToday = tasks.filter((t) => isToday(new Date(t.dueDate)) && t.status !== "done");
  const mine = tasks.filter((t) => t.assigneeId === user?.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back, {user?.name.split(" ")[0]} 👋</h1>
          <p className="text-sm text-muted-foreground mt-1">Here's what's happening across your workspace today.</p>
        </div>
        <Button asChild><Link to="/projects">View all projects</Link></Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tLoading ? (
          <>{[0,1,2,3].map((i) => <CardSkeleton key={i} />)}</>
        ) : (
          <>
            <StatCard icon={ListTodo} label="Total tasks" value={total} tint="bg-accent text-accent-foreground" />
            <StatCard icon={CheckCircle2} label="Completed" value={done} tint="bg-success/10 text-success" trend={total ? `${Math.round((done/total)*100)}%` : undefined} />
            <StatCard icon={Clock} label="Pending" value={pending} tint="bg-info/10 text-info" />
            <StatCard icon={AlertTriangle} label="Overdue" value={overdue} tint="bg-destructive/10 text-destructive" />
          </>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">Tasks by project</h3>
            <span className="text-xs text-muted-foreground">Open vs done</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={perProject} margin={{ left: -20, right: 8, top: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="open" stackId="a" fill="hsl(var(--info))" radius={[0,0,0,0]} />
                <Bar dataKey="done" stackId="a" fill="hsl(var(--success))" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold mb-4">Status distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>
                  {statusData.map((d) => <Cell key={d.key} fill={STATUS_COLORS[d.key]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {statusData.map((s) => (
              <div key={s.key} className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: STATUS_COLORS[s.key] }} />
                <span className="text-xs text-muted-foreground truncate">{s.name}</span>
                <span className="text-xs font-medium ml-auto">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h3 className="text-sm font-semibold">Due today</h3>
            <span className="text-xs text-muted-foreground">{dueToday.length} tasks</span>
          </div>
          <div className="divide-y divide-border">
            {dueToday.length === 0 && <p className="p-6 text-sm text-muted-foreground text-center">Nothing due today. Enjoy the calm. 🌿</p>}
            {dueToday.map((t) => {
              const u = users.find((x) => x.id === t.assigneeId);
              return (
                <div key={t.id} className="px-5 py-3 flex items-center gap-3">
                  <StatusBadge status={t.status} />
                  <span className="text-sm font-medium truncate flex-1">{t.title}</span>
                  {u && <UserBadge name={u.name} />}
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h3 className="text-sm font-semibold">Assigned to me</h3>
            <Link to="/tasks" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-border">
            {mine.length === 0 && <p className="p-6 text-sm text-muted-foreground text-center">No tasks assigned to you yet.</p>}
            {mine.slice(0, 5).map((t) => (
              <div key={t.id} className="px-5 py-3 flex items-center gap-3">
                <StatusBadge status={t.status} />
                <span className="text-sm font-medium truncate flex-1">{t.title}</span>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{format(new Date(t.dueDate), "MMM d")}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

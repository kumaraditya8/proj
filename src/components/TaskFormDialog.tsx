import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { tasksApi } from "@/services/api/tasks";
import { projectsApi } from "@/services/api/projects";
import { usersApi } from "@/services/api/users";
import { toast } from "sonner";
import type { Task, TaskStatus } from "@/types";

const schema = z.object({
  title: z.string().trim().min(2, { message: "Title is required" }).max(120),
  projectId: z.string().min(1, { message: "Pick a project" }),
  assigneeId: z.string().optional(),
  status: z.enum(["todo", "in-progress", "done"]),
  dueDate: z.string().min(1, { message: "Pick a date" }),
});
type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  task?: Task;
  defaultProjectId?: string;
}

export function TaskFormDialog({ open, onOpenChange, task, defaultProjectId }: Props) {
  const qc = useQueryClient();
  const editing = !!task;
  const { data: projects = [] } = useQuery({ queryKey: ["projects"], queryFn: projectsApi.list });
  const { data: users = [] } = useQuery({ queryKey: ["users"], queryFn: usersApi.list });

  const today = new Date().toISOString().slice(0, 10);
  const [values, setValues] = useState<FormValues>({
    title: task?.title ?? "",
    projectId: task?.projectId ?? defaultProjectId ?? "",
    assigneeId: task?.assigneeId ?? "",
    status: (task?.status as TaskStatus) ?? "todo",
    dueDate: task ? task.dueDate.slice(0, 10) : today,
  });

  const { register, handleSubmit, formState: { errors }, setValue, watch, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values,
  });
  const w = watch();

  const mutation = useMutation({
    mutationFn: async (v: FormValues) => {
      const payload = {
        title: v.title,
        projectId: v.projectId,
        status: v.status,
        dueDate: new Date(v.dueDate).toISOString(),
        assigneeId: v.assigneeId || undefined,
      };
      if (editing && task) return tasksApi.update(task.id, payload);
      return tasksApi.create(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      toast.success(editing ? "Task updated" : "Task created");
      onOpenChange(false);
      reset();
      setValues({ title: "", projectId: defaultProjectId ?? "", assigneeId: "", status: "todo", dueDate: today });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Something went wrong"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit task" : "New task"}</DialogTitle>
          <DialogDescription>{editing ? "Update task details." : "Add a task to your project."}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="t-title">Title</Label>
            <Input id="t-title" placeholder="What needs to be done?" {...register("title")} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Project</Label>
              <Select value={w.projectId} onValueChange={(v) => setValue("projectId", v, { shouldValidate: true })}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.projectId && <p className="text-xs text-destructive">{errors.projectId.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={w.status} onValueChange={(v) => setValue("status", v as TaskStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">Todo</SelectItem>
                  <SelectItem value="in-progress">In progress</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Assignee</Label>
              <Select value={w.assigneeId || "none"} onValueChange={(v) => setValue("assigneeId", v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {users.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="t-due">Due date</Label>
              <Input id="t-due" type="date" {...register("dueDate")} />
              {errors.dueDate && <p className="text-xs text-destructive">{errors.dueDate.message}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editing ? "Save" : "Create task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

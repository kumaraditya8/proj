import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { projectsApi } from "@/services/api/projects";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usersApi } from "@/services/api/users";
import { toast } from "sonner";
import type { Project } from "@/types";

const schema = z.object({
  name: z.string().trim().min(2, { message: "Name is required" }).max(80),
  description: z.string().trim().max(500).optional().default(""),
});
type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  project?: Project;
}

export function ProjectFormDialog({ open, onOpenChange, project }: Props) {
  const qc = useQueryClient();
  const editing = !!project;
  const { data: users = [] } = useQuery({ queryKey: ["users"], queryFn: usersApi.list });
  const [memberIds, setMemberIds] = useState<string[]>(project?.memberIds ?? []);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: { name: project?.name ?? "", description: project?.description ?? "" },
  });

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (editing && project) return projectsApi.update(project.id, { ...values, memberIds });
      return projectsApi.create({ name: values.name, description: values.description ?? "", memberIds });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      toast.success(editing ? "Project updated" : "Project created");
      onOpenChange(false);
      reset();
      setMemberIds([]);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Something went wrong"),
  });

  const toggleMember = (id: string) => {
    setMemberIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit project" : "New project"}</DialogTitle>
          <DialogDescription>{editing ? "Update project details and team." : "Spin up a new initiative for your team."}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="p-name">Name</Label>
            <Input id="p-name" placeholder="e.g. Q3 Marketing Site" {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-desc">Description</Label>
            <Textarea id="p-desc" rows={3} placeholder="What is this project about?" {...register("description")} />
          </div>
          <div className="space-y-2">
            <Label>Team members</Label>
            <div className="flex flex-wrap gap-1.5">
              {users.map((u) => {
                const active = memberIds.includes(u.id);
                return (
                  <button
                    type="button"
                    key={u.id}
                    onClick={() => toggleMember(u.id)}
                    className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${active ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:border-primary/50"}`}
                  >
                    {u.name}
                  </button>
                );
              })}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editing ? "Save changes" : "Create project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

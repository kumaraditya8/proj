import { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Search, UserPlus } from "lucide-react";
import { projectsApi } from "@/services/api/projects";
import { usersApi } from "@/services/api/users";
import { UserBadge } from "@/components/AvatarStack";
import { toast } from "sonner";
import type { Project, Role, User } from "@/types";
import { cn } from "@/lib/utils";

interface AddMemberDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  project: Project;
}

export function AddMemberDialog({ open, onOpenChange, project }: AddMemberDialogProps) {
  const qc = useQueryClient();
  const { data: users = [] } = useQuery({ queryKey: ["users"], queryFn: usersApi.list });
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<User | null>(null);
  const [role, setRole] = useState<Role>("member");

  const candidates = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users
      .filter((u) => !project.memberIds.includes(u.id))
      .filter((u) => !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
      .slice(0, 6);
  }, [users, project.memberIds, query]);

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!selected) throw new Error("Select a user");
      await projectsApi.addMember(project.id, selected.id);
      if (selected.role !== role) {
        if (selected.role === "admin") throw new Error("Cannot change role of another admin");
        await usersApi.updateRole(selected.id, role);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["users"] });
      toast.success(`${selected?.name} added to project`);
      onOpenChange(false);
      setSelected(null);
      setQuery("");
      setRole("member");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to add member"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add member</DialogTitle>
          <DialogDescription>Search by name or email and assign a workspace role.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="search-user">Search</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search-user"
                placeholder="Type a name or email…"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelected(null);
                }}
                className="pl-8"
              />
            </div>
            <div className="border border-border rounded-md divide-y divide-border max-h-56 overflow-auto">
              {candidates.length === 0 ? (
                <p className="text-xs text-muted-foreground p-3 text-center">No matching users</p>
              ) : (
                candidates.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      setSelected(u);
                      setRole(u.role);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 p-2.5 text-left hover:bg-muted transition-colors",
                      selected?.id === u.id && "bg-accent"
                    )}
                  >
                    <UserBadge name={u.name} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{u.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                    </div>
                    <span className="text-[11px] text-muted-foreground capitalize">{u.role}</span>
                  </button>
                ))
              )}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Workspace role</Label>
            <Select 
              value={selected ? (selected.role === "admin" ? "admin" : role) : role} 
              onValueChange={(v) => setRole(v as Role)}
              disabled={selected?.role === "admin"}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            {selected?.role === "admin" && (
              <p className="text-xs text-muted-foreground">Cannot change role of an admin</p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => addMutation.mutate()} disabled={!selected || addMutation.isPending}>
            {addMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <UserPlus className="h-4 w-4 mr-1.5" /> Add member
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface ReplaceMemberDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  project: Project;
  oldMember?: User;
}

export function ReplaceMemberDialog({ open, onOpenChange, project, oldMember }: ReplaceMemberDialogProps) {
  const qc = useQueryClient();
  const { data: users = [] } = useQuery({ queryKey: ["users"], queryFn: usersApi.list });
  const [newUserId, setNewUserId] = useState<string>("");
  const [transfer, setTransfer] = useState(true);

  // Exclude current project members AND the member being replaced
  const candidates = users.filter(
    (u) => !project.memberIds.includes(u.id) && u.id !== oldMember?.id,
  );

  const mutation = useMutation({
    mutationFn: async () => {
      if (!oldMember) throw new Error("No member selected to replace");
      if (!newUserId) throw new Error("Pick a replacement teammate");
      if (newUserId === oldMember.id) throw new Error("Replacement must be a different user");
      if (project.memberIds.includes(newUserId)) throw new Error("That user is already a project member");
      const exists = users.some((u) => u.id === newUserId);
      if (!exists) throw new Error("Selected user no longer exists");
      await projectsApi.replaceMember(project.id, oldMember.id, newUserId, { transferTasks: transfer });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["project", project.id] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Member replaced");
      onOpenChange(false);
      setNewUserId("");
      setTransfer(true);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to replace"),
  });

  const sameUser = !!newUserId && newUserId === oldMember?.id;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Replace {oldMember?.name}</DialogTitle>
          <DialogDescription>
            Swap a member out of this project and optionally hand off their tasks.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>New member</Label>
            <Select value={newUserId} onValueChange={setNewUserId}>
              <SelectTrigger><SelectValue placeholder="Pick a teammate…" /></SelectTrigger>
              <SelectContent>
                {candidates.length === 0 ? (
                  <div className="px-2 py-1.5 text-xs text-muted-foreground">No available users</div>
                ) : candidates.map((u) => (
                  <SelectItem key={u.id} value={u.id}>{u.name} — {u.email}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {sameUser && (
              <p className="text-xs text-destructive">Replacement must be a different user.</p>
            )}
          </div>
          <div className="flex items-center justify-between rounded-md border border-border p-3">
            <div>
              <p className="text-sm font-medium">Transfer assigned tasks</p>
              <p className="text-xs text-muted-foreground">Reassign {oldMember?.name}'s tasks to the new member.</p>
            </div>
            <Switch checked={transfer} onCheckedChange={setTransfer} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={!newUserId || sameUser || mutation.isPending}
          >
            {mutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Replace
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

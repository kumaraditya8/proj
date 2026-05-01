import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

export default function Settings() {
  const { user } = useAuth();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your workspace preferences.</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h3 className="font-semibold">Profile</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><div className="text-muted-foreground text-xs">Name</div><div className="mt-0.5">{user?.name}</div></div>
          <div><div className="text-muted-foreground text-xs">Email</div><div className="mt-0.5">{user?.email}</div></div>
          <div><div className="text-muted-foreground text-xs">Role</div><div className="mt-0.5 capitalize">{user?.role}</div></div>
        </div>
      </div>

    </div>
  );
}

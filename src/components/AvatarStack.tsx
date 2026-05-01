import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface AvatarStackProps {
  ids: string[];
  users: { id: string; name: string }[];
  max?: number;
  size?: "sm" | "md";
}

const palette = [
  "from-indigo-500 to-violet-500",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
  "from-pink-500 to-rose-500",
  "from-sky-500 to-blue-500",
  "from-fuchsia-500 to-purple-500",
];

function initials(name: string) {
  return name.split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

export function UserBadge({ name, size = "sm" }: { name: string; size?: "sm" | "md" }) {
  const idx = useMemo(() => {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
    return h % palette.length;
  }, [name]);
  return (
    <div
      className={cn(
        "rounded-full bg-gradient-to-br text-white flex items-center justify-center font-medium ring-2 ring-background",
        palette[idx],
        size === "sm" ? "h-7 w-7 text-[11px]" : "h-9 w-9 text-xs"
      )}
      title={name}
    >
      {initials(name)}
    </div>
  );
}

export function AvatarStack({ ids, users, max = 4, size = "sm" }: AvatarStackProps) {
  const visible = ids.slice(0, max);
  const overflow = ids.length - visible.length;
  return (
    <div className="flex -space-x-2">
      {visible.map((id) => {
        const u = users.find((x) => x.id === id);
        return <UserBadge key={id} name={u?.name ?? "?"} size={size} />;
      })}
      {overflow > 0 && (
        <div
          className={cn(
            "rounded-full bg-muted text-muted-foreground flex items-center justify-center ring-2 ring-background font-medium",
            size === "sm" ? "h-7 w-7 text-[11px]" : "h-9 w-9 text-xs"
          )}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}

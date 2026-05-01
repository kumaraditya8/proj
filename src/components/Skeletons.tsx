import { Skeleton } from "@/components/ui/skeleton";

export function CardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-3">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-4/5" />
      <div className="flex justify-between pt-2">
        <Skeleton className="h-7 w-24 rounded-full" />
        <Skeleton className="h-2 w-20" />
      </div>
    </div>
  );
}

export function RowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b border-border">
      <Skeleton className="h-4 w-4 rounded" />
      <Skeleton className="h-4 flex-1 max-w-md" />
      <Skeleton className="h-7 w-20 rounded-full" />
      <Skeleton className="h-4 w-24" />
    </div>
  );
}

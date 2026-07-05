import React from "react";
import { Loader2 } from "lucide-react";

interface InfiniteScrollLoaderProps {
  loading: boolean;
  hasMore: boolean;
  sentinelRef: (node: HTMLDivElement | null) => void;
}

export default function InfiniteScrollLoader({
  loading,
  hasMore,
  sentinelRef,
}: InfiniteScrollLoaderProps) {
  if (!hasMore) return null;

  return (
    <div ref={sentinelRef} className="p-6 flex justify-center items-center border-t bg-muted/5 w-full">
      {loading ? (
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span>Loading more items...</span>
        </div>
      ) : (
        <div className="h-6 w-full" />
      )}
    </div>
  );
}

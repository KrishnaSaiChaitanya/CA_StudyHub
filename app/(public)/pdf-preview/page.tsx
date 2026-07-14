"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const PdfPreviewContent = dynamic(() => import("./PdfPreviewContent"), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center gap-4 mt-20">
      <Loader2 className="h-10 w-10 animate-spin text-accent" />
      <p className="text-sm font-medium text-muted-foreground animate-pulse">
        Loading PDF Viewer...
      </p>
    </div>
  ),
});

export default function PdfPreviewPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex flex-1 flex-col">
        <Suspense
          fallback={
            <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-background">
              <Loader2 className="h-10 w-10 animate-spin text-accent" />
            </div>
          }
        >
          <PdfPreviewContent />
        </Suspense>
      </main>
    </div>
  );
}
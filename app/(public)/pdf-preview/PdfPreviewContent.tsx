"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  FileWarning,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Download,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getOfflineItem } from "@/utils/offline-db";

// 1. Import react-pdf components and styles
// 1. Import react-pdf components and styles
import { Document, Page, pdfjs } from "react-pdf";
import 'react-pdf/dist/Page/AnnotationLayer.css'; // Removed /esm/
import 'react-pdf/dist/Page/TextLayer.css';       // Removed /esm/

// 2. Set up the PDF worker
// 2. Set up the PDF worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

export default function PdfPreviewContent() {
  const searchParams = useSearchParams();
  const url = searchParams.get("url");
  const offlineId = searchParams.get("offlineId");

  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [loadingOffline, setLoadingOffline] = useState(!!offlineId);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);

  // Ref for responsive resizing
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>();

  // Fetch offline or URL file
  useEffect(() => {
    let active = true;
    let localBlobUrl = "";

    if (offlineId) {
      setLoadingOffline(true);
      getOfflineItem(offlineId)
        .then((item) => {
          if (!active) return;
          if (item?.pdfBlob) {
            localBlobUrl = URL.createObjectURL(item.pdfBlob);
            setFileUrl(localBlobUrl);
          } else {
            console.error("No pdfBlob found for offline planner");
          }
        })
        .catch(console.error)
        .finally(() => {
          if (active) setLoadingOffline(false);
        });
    } else if (url) {
      setFileUrl(url);
    }

    return () => {
      active = false;
      if (localBlobUrl) {
        URL.revokeObjectURL(localBlobUrl);
      }
    };
  }, [url, offlineId]);

  // Handle responsive resize for mobile
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width) setContainerWidth(width);
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  if (!url && !offlineId) {
    return (
      <div className="flex h-[calc(100dvh-4rem)] flex-col items-center justify-center bg-background px-4 text-center">
        <div className="rounded-full bg-muted p-6 mb-4">
          <FileWarning className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold tracking-tight">No PDF Selected</h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-sm">
          Please select a document from your library to preview it here.
        </p>
      </div>
    );
  }

  if (loadingOffline || !fileUrl) {
    return (
      <div className="flex h-[calc(100dvh-4rem)] flex-col items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-4 text-sm font-medium text-muted-foreground animate-pulse">
          Preparing document...
        </p>
      </div>
    );
  }

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setPageNumber(1);
  }

  const changePage = (offset: number) => {
    setPageNumber((prev) => Math.min(Math.max(1, prev + offset), numPages || 1));
  };

  const changeScale = (offset: number) => {
    setScale((prev) => Math.max(0.5, Math.min(prev + offset, 3.0)));
  };

  // Determine base width (padding on sides for mobile)
  const maxWidth = containerWidth ? Math.min(containerWidth - 32, 800) : 800;

  return (
    <div className="relative flex h-[calc(100dvh-4rem)] w-full flex-col bg-muted/30 overflow-hidden">

      {/* Top Action Bar (Minimal & Modern) */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between bg-background/80 backdrop-blur-xl border-b px-4 py-3 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground overflow-hidden">
          <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="truncate">Document Preview</span>
        </div>
        <Button size="sm" variant="default" asChild className="gap-1.5 rounded-full px-4">
          <a href={fileUrl} download target="_blank" rel="noopener noreferrer">
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Save</span>
          </a>
        </Button>
      </div>

      {/* PDF Viewer Container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto pt-16 pb-24 flex justify-center w-full relative"
      >
        <Document
          file={fileUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className="flex flex-col items-center gap-4 mt-32">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium text-muted-foreground">Rendering pages...</p>
            </div>
          }
          error={
            <div className="flex flex-col items-center gap-3 mt-32 text-destructive bg-destructive/10 p-6 rounded-xl">
              <FileWarning className="h-8 w-8" />
              <p className="text-sm font-medium">Failed to load the PDF</p>
            </div>
          }
        >
          <Page
            pageNumber={pageNumber}
            width={maxWidth * scale}
            renderTextLayer={true}
            renderAnnotationLayer={true}
            className="shadow-2xl rounded-sm bg-white overflow-hidden transition-all duration-200 ease-out"
          />
        </Document>
      </div>

      {/* Floating Bottom Toolbar (Mobile-friendly thumb reach) */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30">
        <div className="flex items-center gap-1 rounded-full bg-background/90 backdrop-blur-xl border shadow-xl p-1.5 ring-1 ring-border/50">

          {/* Zoom Controls */}
          <div className="flex items-center gap-1 pr-2 border-r">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground"
              onClick={() => changeScale(-0.25)}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-xs font-semibold w-10 text-center">
              {Math.round(scale * 100)}%
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground"
              onClick={() => changeScale(0.25)}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center gap-1 pl-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full"
              onClick={() => changePage(-1)}
              disabled={pageNumber <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs font-semibold w-16 text-center tabular-nums">
              {pageNumber} / {numPages || "--"}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full"
              onClick={() => changePage(1)}
              disabled={!numPages || pageNumber >= numPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

        </div>
      </div>
    </div>
  );
}
"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { FileWarning, Loader2, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

// 1. Import react-pdf components and styles
import { Document, Page, pdfjs } from "react-pdf";

// 2. Set up the PDF worker (Crucial for performance)
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function PdfPreviewContent() {
  const searchParams = useSearchParams();
  const url = searchParams.get("url");

  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);

  if (!url) {
    return (
      <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center bg-background text-foreground">
        <FileWarning className="mb-4 h-16 w-16 text-muted-foreground" />
        <h2 className="text-2xl font-semibold">No PDF URL provided</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Please select a document to preview.
        </p>
      </div>
    );
  }

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages as any);
    setPageNumber(1);
  }

  const changePage = (offset: number) => {
    setPageNumber((prevPageNumber) => prevPageNumber + offset);
  };

  const changeScale = (offset: number) => {
    setScale((prevScale) => Math.max(0.5, Math.min(prevScale + offset, 3.0))); // Limit zoom between 50% and 300%
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full flex-col bg-background">
      {/* Interactive Toolbar */}
      <div className="z-20 flex flex-wrap items-center justify-between gap-4 border-b bg-card px-4 py-3 text-card-foreground shadow-sm">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => changePage(-1)}
            disabled={pageNumber <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <p className="text-sm font-medium min-w-[80px] text-center">
            Page {pageNumber} of {numPages || "--"}
          </p>
          <Button
            variant="outline"
            size="icon"
            onClick={() => changePage(1)}
            disabled={!numPages || pageNumber >= numPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => changeScale(-0.2)}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium w-12 text-center">
            {Math.round(scale * 100)}%
          </span>
          <Button variant="ghost" size="icon" onClick={() => changeScale(0.2)}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          
          <div className="mx-2 h-6 w-px bg-border"></div> {/* Divider */}
          
          <Button size="sm" asChild className="gap-2">
            <a href={url} download target="_blank" rel="noopener noreferrer">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Download</span>
            </a>
          </Button>
        </div>
      </div>

      {/* PDF Viewer Container */}
      <div className="flex-1 overflow-auto bg-muted/30 p-4 md:p-8 flex justify-center">
        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className="flex flex-col items-center gap-4 mt-20">
              <Loader2 className="h-10 w-10 animate-spin text-accent" />
              <p className="text-sm font-medium text-muted-foreground animate-pulse">
                Rendering document...
              </p>
            </div>
          }
          error={
            <div className="flex flex-col items-center gap-2 mt-20 text-destructive">
              <FileWarning className="h-10 w-10" />
              <p>Failed to load the PDF. Please check the URL.</p>
            </div>
          }
        >
          {/* Render the specific page */}
          <Page
            pageNumber={pageNumber}
            scale={scale}
            renderTextLayer={true}
            renderAnnotationLayer={true}
            className="shadow-xl bg-white transition-transform duration-200"
          />
        </Document>
      </div>
    </div>
  );
}

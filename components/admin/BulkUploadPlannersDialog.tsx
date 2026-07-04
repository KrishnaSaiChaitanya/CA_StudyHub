"use client";

import { useState, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { SUBJECT_MAPPING, formatSubjectName } from "@/utils/subjects";
import { 
  UploadCloud, FolderOpen, FileText, Trash2, X, ArrowLeft, ArrowRight, 
  Loader2, CheckCircle2, AlertCircle, Sparkles, FileCheck, RefreshCw, ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface BulkUploadPlannersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface SelectedFile {
  id: string;
  file: File;
  name: string;
  size: number;
}

interface ProcessedPlanner {
  id: string;
  filename: string;
  title: string;
  pages: number;
  pdfUrl: string;
  status: "pending" | "processing_pdf" | "uploading" | "ready" | "failed";
  error?: string;
}

export default function BulkUploadPlannersDialog({
  open,
  onOpenChange,
  onSuccess
}: BulkUploadPlannersDialogProps) {
  const supabase = createClient();
  const { toast } = useToast();
  
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [categoryId, setCategoryId] = useState<string>("");
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [processedPlanners, setProcessedPlanners] = useState<ProcessedPlanner[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const allSubjects = [
    ...SUBJECT_MAPPING.foundation,
    ...SUBJECT_MAPPING.intermediate,
    ...SUBJECT_MAPPING.final
  ];

  const resetState = () => {
    setStep(1);
    setCategoryId("");
    setFiles([]);
    setProcessedPlanners([]);
    setIsDragging(false);
    setIsCreating(false);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (isCreating) return;
    if (!isOpen) resetState();
    onOpenChange(isOpen);
  };

  // Helper: Read files recursively from Directory Drop
  const readAllEntries = async (dirReader: any): Promise<any[]> => {
    const allEntries: any[] = [];
    const read = async (): Promise<any[]> => {
      const entries: any[] = await new Promise((resolve) => {
        dirReader.readEntries(resolve, (err: any) => {
          console.error("Directory reading error:", err);
          resolve([]);
        });
      });
      if (entries.length > 0) {
        allEntries.push(...entries);
        return read();
      }
      return allEntries;
    };
    return read();
  };

  const getAllFilesFromEntry = async (entry: any): Promise<File[]> => {
    if (entry.isFile) {
      return new Promise((resolve) => {
        entry.file((file: File) => {
          if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
            resolve([file]);
          } else {
            resolve([]);
          }
        });
      });
    } else if (entry.isDirectory) {
      const dirReader = entry.createReader();
      const entries = await readAllEntries(dirReader);
      const filePromises = entries.map((childEntry) => getAllFilesFromEntry(childEntry));
      const nestedFiles = await Promise.all(filePromises);
      return nestedFiles.flat();
    }
    return [];
  };

  // Handlers for drops
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const items = e.dataTransfer.items;
    if (!items) return;

    const promises: Promise<File[]>[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === "file") {
        const entry = item.webkitGetAsEntry();
        if (entry) {
          promises.push(getAllFilesFromEntry(entry));
        } else {
          const file = item.getAsFile();
          if (file && (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"))) {
            promises.push(Promise.resolve([file]));
          }
        }
      }
    }

    const filesArray = await Promise.all(promises);
    const pdfFiles = filesArray.flat();
    addPdfFiles(pdfFiles);
  };

  const addPdfFiles = (pdfFiles: File[]) => {
    if (pdfFiles.length === 0) {
      toast({
        title: "No PDF files found",
        description: "Please drop or select PDF files.",
        variant: "destructive"
      });
      return;
    }

    setFiles((prev) => {
      const updated = [...prev];
      pdfFiles.forEach((file) => {
        // Prevent adding exact duplicates by checking name and size
        if (!updated.some((f) => f.name === file.name && f.size === file.size)) {
          updated.push({
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            file,
            name: file.name,
            size: file.size
          });
        }
      });
      return updated;
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const pdfFiles = Array.from(e.target.files).filter(
        (file) => file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
      );
      addPdfFiles(pdfFiles);
    }
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  // Client-side PDF page calculations
  const calculatePdfPages = async (file: File): Promise<number> => {
    // Method 1: Extremely fast binary scanning (takes < 1ms, works on uncompressed structure)
    try {
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      const decoder = new TextDecoder("ascii");
      const text = decoder.decode(bytes);

      // Find all dictionaries in the PDF
      const dictPattern = /<<[\s\S]*?>>/g;
      const dicts = text.match(dictPattern) || [];
      
      const counts: number[] = [];
      for (const dict of dicts) {
        // Only inspect dictionaries that specify /Type /Pages
        if (dict.includes("/Type") && dict.includes("/Pages")) {
          const countMatch = dict.match(/\/Count\s*(\d+)/);
          if (countMatch) {
            const val = parseInt(countMatch[1], 10);
            if (!isNaN(val)) counts.push(val);
          }
        }
      }

      if (counts.length > 0) {
        const maxCount = Math.max(...counts);
        if (maxCount > 0) {
          console.log(`[Fast Scan] Page count for ${file.name}: ${maxCount}`);
          return maxCount;
        }
      }
      
      // Secondary fallback binary scan in case of formatted catalogs
      const countMatch = text.match(/\/Count\s*(\d+)/g);
      if (countMatch) {
        const simpleCounts = countMatch.map(m => {
          const val = m.match(/\/Count\s*(\d+)/);
          return val ? parseInt(val[1], 10) : 0;
        }).filter(c => !isNaN(c) && c > 0);
        if (simpleCounts.length > 0) {
          const maxVal = Math.max(...simpleCounts);
          if (maxVal > 0 && maxVal < 5000) {
            console.log(`[Simple Scan] Page count for ${file.name}: ${maxVal}`);
            return maxVal;
          }
        }
      }
    } catch (err) {
      console.warn("Fast scan failed, using PDFJS fallback:", err);
    }

    // Method 2: Fallback to dynamic PDF.js on the main thread
    try {
      console.log(`[Fallback] Loading PDFJS for ${file.name}`);
      const { pdfjs: dynamicPdfjs } = await import("react-pdf");
      
      // Attempt main thread parsing without external worker first
      dynamicPdfjs.GlobalWorkerOptions.workerSrc = "";

      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = dynamicPdfjs.getDocument({ 
        data: arrayBuffer,
        useWorkerFetch: false,
        isEvalSupported: false
      });
      const pdf = await loadingTask.promise;
      console.log(`[Fallback] PDFJS loaded page count for ${file.name}: ${pdf.numPages}`);
      return pdf.numPages;
    } catch (err) {
      console.error("PDFJS fallback failed, using final fallback 1:", err);
      return 1;
    }
  };

  // Upload a single file to API and return the URL
  const uploadFile = async (file: File, category: string): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", category);

    const res = await fetch("/api/admin/planners/upload", {
      method: "POST",
      body: formData
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || "Failed to upload file");
    }

    const data = await res.json();
    return data.url;
  };

  // Trigger uploads and page count parsing in Step 2 -> Step 3
  const startUploadAndProcessing = async () => {
    if (!categoryId) {
      toast({ title: "Please select a Category/Subject", variant: "destructive" });
      return;
    }
    if (files.length === 0) {
      toast({ title: "Please select files to upload", variant: "destructive" });
      return;
    }

    // Move to step 3
    setStep(3);

    // Initialize state
    const initialPlanners: ProcessedPlanner[] = files.map((f) => ({
      id: f.id,
      filename: f.name,
      title: f.name.replace(/\.[^/.]+$/, ""), // strip extension
      pages: 0,
      pdfUrl: "",
      status: "pending"
    }));
    setProcessedPlanners(initialPlanners);

    // Process files one by one (or in parallel batches to prevent client load bottlenecks)
    for (const fileObj of files) {
      const updateStatus = (
        status: ProcessedPlanner["status"], 
        updates: Partial<ProcessedPlanner> = {}
      ) => {
        setProcessedPlanners((prev) =>
          prev.map((item) => (item.id === fileObj.id ? { ...item, status, ...updates } : item))
        );
      };

      try {
        // 1. Calculate PDF Page count client-side
        updateStatus("processing_pdf");
        const pageCount = await calculatePdfPages(fileObj.file);

        // 2. Upload PDF to server storage
        updateStatus("uploading", { pages: pageCount });
        const uploadedUrl = await uploadFile(fileObj.file, categoryId);

        updateStatus("ready", { pdfUrl: uploadedUrl });
      } catch (err: any) {
        updateStatus("failed", { error: err.message || "An error occurred" });
      }
    }
  };

  // Bulk create Planners in Supabase study_planners table
  const handleBulkCreate = async () => {
    const readyPlanners = processedPlanners.filter((p) => p.status === "ready");
    if (readyPlanners.length === 0) {
      toast({
        title: "No ready files",
        description: "There are no successfully uploaded and parsed files to save.",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const payload = readyPlanners.map((p) => ({
        title: p.title,
        category: categoryId,
        faculty_id: null, // "faculty selection will be null always"
        planner_date: today,
        pages: p.pages,
        pdf_url: p.pdfUrl,
        downloads: 0,
        rating: 0.00,
        is_community: false
      }));

      const { error } = await supabase.from("study_planners").insert(payload);
      if (error) throw error;

      toast({
        title: "Success!",
        description: `Successfully created ${payload.length} study planners.`
      });
      onSuccess();
      handleOpenChange(false);
    } catch (err: any) {
      toast({
        title: "Failed to create planners",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const updatePlannerTitle = (id: string, newTitle: string) => {
    setProcessedPlanners((prev) =>
      prev.map((p) => (p.id === id ? { ...p, title: newTitle } : p))
    );
  };

  // Helper to format bytes
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-6 rounded-2xl bg-card border-border/80">
        <DialogHeader className="pb-2 border-b border-border/40">
          <DialogTitle className="text-2xl font-extrabold text-foreground flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" /> Bulk Upload Study Planners
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            Quickly upload multiple PDF planners for a subject. PDF page numbers will be parsed automatically.
          </DialogDescription>

          {/* Progress Indicator Stepper */}
          <div className="flex items-center justify-center pt-4">
            <div className="flex items-start max-w-md w-full justify-between relative">
              {/* Stepper connecting background lines */}
              <div className="absolute top-4 left-[10%] right-[10%] h-[2px] bg-muted -z-0">
                <div 
                  className={cn(
                    "h-full bg-gradient-to-r from-primary to-accent transition-all duration-500",
                    step === 1 ? "w-0" : step === 2 ? "w-1/2" : "w-full"
                  )} 
                />
              </div>

              {/* Stepper Step 1 */}
              <div className="flex flex-col items-center gap-1.5 z-10 bg-card px-2">
                <div 
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300",
                    step >= 1 
                      ? "bg-primary text-primary-foreground shadow-md ring-4 ring-primary/20" 
                      : "bg-muted text-muted-foreground border border-border"
                  )}
                >
                  1
                </div>
                <span className={cn("text-[10px] font-bold uppercase tracking-wider", step >= 1 ? "text-foreground" : "text-muted-foreground")}>
                  Select Subject & Files
                </span>
              </div>

              {/* Stepper Step 2 */}
              <div className="flex flex-col items-center gap-1.5 z-10 bg-card px-2">
                <div 
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300",
                    step >= 2 
                      ? "bg-primary text-primary-foreground shadow-md ring-4 ring-primary/20" 
                      : "bg-muted text-muted-foreground border border-border"
                  )}
                >
                  2
                </div>
                <span className={cn("text-[10px] font-bold uppercase tracking-wider", step >= 2 ? "text-foreground" : "text-muted-foreground")}>
                  Review Files
                </span>
              </div>

              {/* Stepper Step 3 */}
              <div className="flex flex-col items-center gap-1.5 z-10 bg-card px-2">
                <div 
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300",
                    step >= 3 
                      ? "bg-primary text-primary-foreground shadow-md ring-4 ring-primary/20" 
                      : "bg-muted text-muted-foreground border border-border"
                  )}
                >
                  3
                </div>
                <span className={cn("text-[10px] font-bold uppercase tracking-wider", step >= 3 ? "text-foreground" : "text-muted-foreground")}>
                  Preview & Save
                </span>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto py-4 min-h-0">
          <AnimatePresence mode="wait">
            
            {/* STEP 1: Select Subject & Drop Files */}
            {step === 1 && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Subject / Category Dropdown */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    1. Select Subject / Category
                  </label>
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger className="h-12 border-border focus:ring-primary/20 bg-muted/20">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {allSubjects.map((sub) => (
                        <SelectItem key={sub} value={sub}>
                          {formatSubjectName(sub as any)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Dropzone area */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">
                    2. Add PDF Files or Folders
                  </label>
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={cn(
                      "relative flex flex-col items-center justify-center w-full p-12 border-2 border-dashed rounded-2xl transition-all duration-300 cursor-pointer",
                      isDragging 
                        ? "border-primary bg-primary/5 ring-4 ring-primary/5 scale-[0.99]" 
                        : "border-muted-foreground/20 bg-muted/10 hover:border-primary/40 hover:bg-primary/5"
                    )}
                  >
                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className="p-4 bg-background dark:bg-muted/50 rounded-2xl shadow-sm border border-border/50 group-hover:scale-105 transition-transform">
                        <UploadCloud className="h-10 w-10 text-primary" />
                      </div>
                      <div>
                        <p className="text-base font-bold text-foreground">
                          Drag & drop PDF files or a folder here
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 max-w-md">
                          We will scan subfolders and extract all PDFs automatically. Maximum recommended file size is 20MB.
                        </p>
                      </div>

                      <div className="flex items-center gap-3 pt-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          className="gap-2 h-9 text-xs"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <FileText className="h-3.5 w-3.5" /> Select Files
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          className="gap-2 h-9 text-xs"
                          onClick={() => folderInputRef.current?.click()}
                        >
                          <FolderOpen className="h-3.5 w-3.5" /> Select Folder
                        </Button>
                      </div>
                    </div>

                    {/* Secret Input controls */}
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      multiple 
                      accept="application/pdf" 
                      className="hidden" 
                      onChange={handleFileChange} 
                    />
                    <input 
                      ref={folderInputRef}
                      type="file" 
                      multiple 
                      accept="application/pdf" 
                      className="hidden" 
                      onChange={handleFileChange} 
                      {...{
                        webkitdirectory: "",
                        directory: ""
                      } as any}
                    />
                  </div>
                </div>

                {/* Show mini summary of selected files in Step 1 */}
                {files.length > 0 && (
                  <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <FileCheck className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">
                          {files.length} PDF {files.length === 1 ? "file" : "files"} selected
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Ready to review and process.
                        </p>
                      </div>
                    </div>
                    <Button 
                      size="sm"
                      onClick={() => setStep(2)}
                      className="gap-1 bg-primary hover:bg-primary/95 shadow-sm text-xs h-8"
                    >
                      Review Files <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </motion.div>
            )}

            {/* STEP 2: Review files & Remove items */}
            {step === 2 && (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="text-base font-bold text-foreground">
                    Selected Files ({files.length})
                  </h3>
                  <span className="text-xs text-muted-foreground font-medium">
                    Category: <span className="font-bold text-primary">{formatSubjectName(categoryId as any)}</span>
                  </span>
                </div>

                {files.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground border border-dashed rounded-xl">
                    <FileText className="h-10 w-10 opacity-30 mb-2" />
                    <p className="text-sm font-medium">No files selected</p>
                    <Button variant="link" size="sm" onClick={() => setStep(1)} className="mt-1">
                      Go back to select files
                    </Button>
                  </div>
                ) : (
                  <div className="divide-y divide-border border rounded-xl overflow-hidden bg-muted/5 max-h-[350px] overflow-y-auto">
                    {files.map((fileObj) => (
                      <div 
                        key={fileObj.id} 
                        className="flex items-center justify-between p-3.5 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0 pr-4">
                          <FileText className="h-5 w-5 text-primary shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate max-w-md">
                              {fileObj.name}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {formatBytes(fileObj.size)}
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFile(fileObj.id)}
                          className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* STEP 3: Preview, Upload, & Edit Metadata */}
            {step === 3 && (
              <motion.div 
                key="step3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="text-base font-bold text-foreground">
                    Uploading & Preparing Planners
                  </h3>
                  <span className="text-xs text-muted-foreground font-medium">
                    Subject: <span className="font-bold text-primary">{formatSubjectName(categoryId as any)}</span>
                  </span>
                </div>

                <div className="border border-border rounded-xl bg-card divide-y overflow-hidden max-h-[380px] overflow-y-auto">
                  {processedPlanners.map((p) => (
                    <div key={p.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Name & Title Input */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase font-bold text-muted-foreground">Original File:</span>
                          <span className="text-xs text-foreground truncate font-mono block max-w-xs">{p.filename}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-foreground shrink-0 mt-1.5">Planner Title:</span>
                          <Input 
                            value={p.title}
                            onChange={(e) => updatePlannerTitle(p.id, e.target.value)}
                            disabled={p.status === "uploading" || p.status === "processing_pdf"}
                            className="h-8 py-1 px-2 border-border focus:ring-primary/10 text-xs font-medium"
                            placeholder="Enter planner title..."
                          />
                        </div>
                      </div>

                      {/* PDF Pages */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground">Pages:</span>
                        <span className="font-bold text-xs bg-muted border border-border px-2 py-0.5 rounded">
                          {p.status === "pending" || p.status === "processing_pdf" ? (
                            <Loader2 className="h-3 w-3 animate-spin inline-block text-primary" />
                          ) : (
                            p.pages
                          )}
                        </span>
                      </div>

                      {/* Status Badges & Controls */}
                      <div className="flex items-center gap-3 shrink-0 min-w-[150px] justify-end">
                        {p.status === "pending" && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-muted-foreground/30 animate-pulse" /> Pending
                          </span>
                        )}
                        {p.status === "processing_pdf" && (
                          <span className="text-xs text-primary flex items-center gap-1.5 font-medium">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Counting Pages
                          </span>
                        )}
                        {p.status === "uploading" && (
                          <span className="text-xs text-amber-500 flex items-center gap-1.5 font-medium">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading PDF
                          </span>
                        )}
                        {p.status === "ready" && (
                          <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-bold">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Uploaded
                            <a 
                              href={p.pdfUrl} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="text-primary hover:text-primary/80 transition-colors shrink-0"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          </span>
                        )}
                        {p.status === "failed" && (
                          <span 
                            title={p.error} 
                            className="text-xs text-destructive flex items-center gap-1.5 font-bold cursor-help"
                          >
                            <AlertCircle className="h-4 w-4 text-destructive shrink-0" /> Failed
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Footer */}
        <DialogFooter className="border-t pt-4 border-border/40 sm:justify-between">
          <Button 
            variant="ghost" 
            onClick={() => {
              if (step === 2) setStep(1);
              else if (step === 3) setStep(2);
              else handleOpenChange(false);
            }}
            disabled={isCreating || (step === 3 && processedPlanners.some(p => p.status === "uploading" || p.status === "processing_pdf"))}
          >
            {step === 1 ? "Cancel" : <><ArrowLeft className="h-4 w-4 mr-2" /> Back</>}
          </Button>

          <div className="flex gap-2">
            {step === 1 && (
              <Button 
                onClick={() => setStep(2)} 
                disabled={!categoryId || files.length === 0}
                className="gap-2 bg-primary hover:bg-primary/95 text-white font-semibold"
              >
                Next: Review Files <ArrowRight className="h-4 w-4" />
              </Button>
            )}
            {step === 2 && (
              <Button 
                onClick={startUploadAndProcessing} 
                disabled={files.length === 0}
                className="gap-2 bg-primary hover:bg-primary/95 text-white font-semibold"
              >
                Upload & Preview <ArrowRight className="h-4 w-4" />
              </Button>
            )}
            {step === 3 && (
              <Button 
                onClick={handleBulkCreate} 
                disabled={
                  isCreating || 
                  processedPlanners.some(p => p.status === "uploading" || p.status === "processing_pdf") ||
                  !processedPlanners.some(p => p.status === "ready")
                }
                className="gap-2 bg-primary hover:bg-primary/95 text-white font-bold"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-1" /> Creating Planners...
                  </>
                ) : (
                  <>
                    Create Planners ({processedPlanners.filter((p) => p.status === "ready").length})
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

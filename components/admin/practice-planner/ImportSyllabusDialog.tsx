"use client";

import React, { useState, useRef } from "react";
import * as XLSX from "xlsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Upload,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  FileDown,
  RefreshCcw,
  Sparkles,
  Layers,
  BookOpen,
  ListOrdered,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import {
  parseSyllabusWorkbook,
  ParseResult,
  ParsedSubject,
} from "./excel-parser";
import {
  getDefaultSyllabusBase64,
  importAndReplaceSyllabus,
  clearAllPlannerData,
} from "@/app/admin/practice-planner/actions";
import { StudentLevel } from "@/utils/supabase/types";

interface ImportSyllabusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => Promise<void>;
}

export function ImportSyllabusDialog({
  open,
  onOpenChange,
  onSuccess,
}: ImportSyllabusDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [clearingOnly, setClearingOnly] = useState(false);

  const [fileName, setFileName] = useState<string | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);

  const [confirmWipe, setConfirmWipe] = useState(false);
  const [activeLevelTab, setActiveLevelTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const resetState = () => {
    setFileName(null);
    setParseResult(null);
    setConfirmWipe(false);
    setActiveLevelTab("all");
    setSearchQuery("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleModalOpenChange = (nextOpen: boolean) => {
    if (!importing && !clearingOnly) {
      if (!nextOpen) {
        resetState();
      }
      onOpenChange(nextOpen);
    }
  };

  // Process ArrayBuffer or File
  const processBuffer = (buffer: ArrayBuffer, name: string) => {
    try {
      setParsing(true);
      const workbook = XLSX.read(buffer, { type: "array" });
      const result = parseSyllabusWorkbook(workbook);
      setFileName(name);
      setParseResult(result);

      if (result.success) {
        toast.success(
          `Parsed ${result.summary.totalSubjects} subjects, ${result.summary.totalChapters} chapters, ${result.summary.totalSubtopics} subtopics.`
        );
      } else {
        toast.error(
          `Found ${result.errors.length} parsing issue(s). Please review the errors below.`
        );
      }
    } catch (err: any) {
      console.error("Excel parse error:", err);
      toast.error(err.message || "Failed to parse the Excel file");
      setParseResult({
        success: false,
        errors: [
          {
            type: "error",
            message: `Workbook read failed: ${err.message || "Invalid Excel file format"}`,
          },
        ],
        warnings: [],
        subjects: [],
        summary: {
          totalSubjects: 0,
          totalChapters: 0,
          totalSubtopics: 0,
          levelCounts: {
            foundation: { subjects: 0, chapters: 0, subtopics: 0 },
            intermediate: { subjects: 0, chapters: 0, subtopics: 0 },
            final: { subjects: 0, chapters: 0, subtopics: 0 },
          },
        },
      });
    } finally {
      setParsing(false);
    }
  };

  // File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const buffer = evt.target?.result as ArrayBuffer;
      if (buffer) {
        processBuffer(buffer, file.name);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Load Built-in Syllabus Ledger.xlsx
  const handleLoadSystemDefault = async () => {
    setParsing(true);
    try {
      const res = await getDefaultSyllabusBase64();
      if (!res.success || !res.base64) {
        toast.error(res.error || "Failed to load default syllabus file");
        return;
      }

      // Convert base64 to binary ArrayBuffer
      const binaryString = window.atob(res.base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      processBuffer(bytes.buffer, res.filename || "Syllabus Ledger.xlsx");
    } catch (err: any) {
      toast.error(err.message || "Failed to load system default file");
    } finally {
      setParsing(false);
    }
  };

  // Import Action
  const handleImport = async () => {
    if (!parseResult || !parseResult.success || parseResult.subjects.length === 0) {
      toast.error("Please provide a valid Excel file without errors before importing.");
      return;
    }

    if (!confirmWipe) {
      toast.error("Please confirm that you understand this will erase existing planner data.");
      return;
    }

    setImporting(true);
    try {
      const res = await importAndReplaceSyllabus(parseResult.subjects);
      if (res.success && res.stats) {
        toast.success(
          `Successfully loaded ${res.stats.subjectsCount} subjects, ${res.stats.chaptersCount} chapters, and ${res.stats.subtopicsCount} subtopics!`
        );
        await onSuccess();
        handleModalOpenChange(false);
      } else {
        toast.error(res.error || "Failed to import syllabus");
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred during import.");
    } finally {
      setImporting(false);
    }
  };

  // Clear All Data Action (Stand-alone clear)
  const handleClearAll = async () => {
    if (
      !confirm(
        "CRITICAL WARNING: This will permanently delete ALL subjects, chapters, subtopics, and all student tracking progress from the database. Are you sure you want to proceed?"
      )
    ) {
      return;
    }

    setClearingOnly(true);
    try {
      const res = await clearAllPlannerData();
      if (res.success) {
        toast.success(res.message || "All planner data has been cleared.");
        await onSuccess();
        handleModalOpenChange(false);
      } else {
        toast.error(res.error || "Failed to clear data");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to clear planner data");
    } finally {
      setClearingOnly(false);
    }
  };

  // Filtered Subjects for Preview
  const filteredSubjects = (parseResult?.subjects || []).filter((sub) => {
    if (activeLevelTab !== "all" && sub.level !== activeLevelTab) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchSubject =
        sub.name.toLowerCase().includes(q) ||
        sub.short_name.toLowerCase().includes(q) ||
        sub.slug.toLowerCase().includes(q);
      const matchChapter = sub.chapters.some(
        (c) =>
          c.topic.toLowerCase().includes(q) ||
          c.subtopics.some((st) => st.name.toLowerCase().includes(q))
      );
      return matchSubject || matchChapter;
    }
    return true;
  });

  return (
    <Dialog open={open} onOpenChange={handleModalOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-card border-border">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b bg-muted/20 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                <FileSpreadsheet className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
                  Import Syllabus from Excel
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Safely parse, preview, and load CA curriculum master data into the database.
                </DialogDescription>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAll}
              disabled={importing || parsing || clearingOnly}
              className="text-xs text-destructive hover:bg-destructive/10 border-destructive/30 hover:border-destructive"
            >
              {clearingOnly ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
              ) : (
                <RefreshCcw className="h-3.5 w-3.5 mr-1.5" />
              )}
              Wipe All Data Only
            </Button>
          </div>
        </DialogHeader>

        {/* Scrollable Body Content */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-6">
          <div className="space-y-6">
            {/* 1. File Upload / Selection Area */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Custom File Upload Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2.5 ${
                  fileName && !fileName.includes("Default")
                    ? "border-primary/50 bg-primary/5"
                    : "border-border hover:border-primary/40 hover:bg-muted/30"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="p-3 rounded-full bg-background border shadow-xs text-primary">
                  <Upload className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {fileName ? fileName : "Upload Custom Excel (.xlsx, .xls)"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Click to browse files matching the Syllabus Ledger format
                  </p>
                </div>
              </div>

              {/* Quick Load System Default */}
              <div className="border rounded-xl p-5 flex flex-col justify-between bg-muted/10">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-lg bg-accent/20 text-accent shrink-0">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">
                      Built-in Syllabus Ledger
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      Instant one-click load from the bundled system master file (
                      <code>assets/Syllabus Ledger.xlsx</code>).
                    </p>
                  </div>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleLoadSystemDefault}
                  disabled={parsing || importing}
                  className="mt-3 w-full font-semibold text-xs border"
                >
                  {parsing ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  ) : (
                    <FileDown className="h-3.5 w-3.5 mr-1.5" />
                  )}
                  Load Bundled Master File
                </Button>
              </div>
            </div>

            {/* Parsing State */}
            {parsing && (
              <div className="flex items-center justify-center py-8 gap-3 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="text-sm font-medium">
                  Parsing and validating spreadsheet data...
                </span>
              </div>
            )}

            {/* 2. Validation / Issues Display */}
            {parseResult && !parsing && (
              <div className="space-y-4">
                {/* Errors List */}
                {parseResult.errors.length > 0 && (
                  <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-destructive font-bold text-sm">
                      <XCircle className="h-5 w-5 shrink-0" />
                      <span>
                        Found {parseResult.errors.length} Blocking Issue
                        {parseResult.errors.length > 1 ? "s" : ""}
                      </span>
                    </div>
                    <p className="text-xs text-destructive/90">
                      The file could not be imported due to formatting or validation issues.
                      Please fix these issues in your spreadsheet and try again.
                    </p>
                    <div className="max-h-36 overflow-y-auto space-y-1 mt-2 text-xs font-mono bg-destructive/15 p-2.5 rounded-lg border border-destructive/20 text-destructive-foreground">
                      {parseResult.errors.map((err, i) => (
                        <div key={i} className="flex gap-2 items-start">
                          <span className="text-destructive font-bold">•</span>
                          <span>{err.message}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Warnings List */}
                {parseResult.warnings.length > 0 && (
                  <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400 font-bold text-sm">
                      <AlertTriangle className="h-5 w-5 shrink-0" />
                      <span>
                        {parseResult.warnings.length} Non-blocking Warning
                        {parseResult.warnings.length > 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="max-h-24 overflow-y-auto space-y-1 text-xs font-mono text-muted-foreground">
                      {parseResult.warnings.map((w, i) => (
                        <div key={i} className="flex gap-2 items-start">
                          <span>⚠️</span>
                          <span>{w.message}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Success Summary Stats */}
                {parseResult.success && (
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                        <CheckCircle2 className="h-5 w-5 shrink-0" />
                        <span>Spreadsheet Validated Successfully</span>
                      </div>
                      <Badge variant="outline" className="text-xs bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                        Ready to Import
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-3 pt-1">
                      <div className="p-3 bg-background/80 rounded-lg border border-border/50 text-center">
                        <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground font-semibold mb-1">
                          <Layers className="h-3.5 w-3.5 text-primary" /> Subjects
                        </div>
                        <div className="text-xl font-extrabold text-foreground">
                          {parseResult.summary.totalSubjects}
                        </div>
                      </div>

                      <div className="p-3 bg-background/80 rounded-lg border border-border/50 text-center">
                        <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground font-semibold mb-1">
                          <BookOpen className="h-3.5 w-3.5 text-accent" /> Chapters
                        </div>
                        <div className="text-xl font-extrabold text-foreground">
                          {parseResult.summary.totalChapters}
                        </div>
                      </div>

                      <div className="p-3 bg-background/80 rounded-lg border border-border/50 text-center">
                        <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground font-semibold mb-1">
                          <ListOrdered className="h-3.5 w-3.5 text-emerald-500" /> Sub-topics
                        </div>
                        <div className="text-xl font-extrabold text-foreground">
                          {parseResult.summary.totalSubtopics}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Interactive Data Preview */}
                {parseResult.subjects.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <h4 className="text-sm font-bold text-foreground">
                        Parsed Syllabus Preview
                      </h4>

                      <div className="flex items-center gap-2">
                        <div className="relative w-48">
                          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                          <Input
                            placeholder="Filter topics..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-8 pl-8 text-xs"
                          />
                        </div>

                        <Tabs
                          value={activeLevelTab}
                          onValueChange={setActiveLevelTab}
                          className="h-8"
                        >
                          <TabsList className="h-8 p-0.5">
                            <TabsTrigger value="all" className="text-xs h-7 px-2.5">
                              All
                            </TabsTrigger>
                            <TabsTrigger value="foundation" className="text-xs h-7 px-2.5">
                              Foundation (
                              {parseResult.summary.levelCounts.foundation.subjects})
                            </TabsTrigger>
                            <TabsTrigger value="intermediate" className="text-xs h-7 px-2.5">
                              Inter (
                              {parseResult.summary.levelCounts.intermediate.subjects})
                            </TabsTrigger>
                            <TabsTrigger value="final" className="text-xs h-7 px-2.5">
                              Final (
                              {parseResult.summary.levelCounts.final.subjects})
                            </TabsTrigger>
                          </TabsList>
                        </Tabs>
                      </div>
                    </div>

                    <div className="max-h-[400px] overflow-y-auto border rounded-xl divide-y bg-card">
                      <Accordion type="multiple" className="w-full">
                        {filteredSubjects.map((sub, sIdx) => {
                          const subtopicsCount = sub.chapters.reduce(
                            (acc, c) => acc + c.subtopics.length,
                            0
                          );

                          return (
                            <AccordionItem
                              key={sub.slug || sIdx}
                              value={sub.slug}
                              className="px-4 border-b last:border-b-0"
                            >
                              <AccordionTrigger className="hover:no-underline py-3 text-left">
                                <div className="flex items-center justify-between w-full pr-4">
                                  <div className="flex items-center gap-2.5 truncate">
                                    <Badge
                                      variant="secondary"
                                      className={`text-[10px] font-bold uppercase tracking-wider ${
                                        sub.level === "foundation"
                                          ? "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                                          : sub.level === "intermediate"
                                            ? "bg-purple-500/15 text-purple-600 dark:text-purple-400"
                                            : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                                      }`}
                                    >
                                      {sub.level}
                                    </Badge>
                                    <span className="font-semibold text-xs text-foreground truncate">
                                      {sub.name}
                                    </span>
                                    {sub.paper_code && (
                                      <span className="text-[11px] text-muted-foreground font-mono">
                                        ({sub.paper_code})
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-3 shrink-0 text-[11px] text-muted-foreground">
                                    <span>
                                      <strong>{sub.chapters.length}</strong> chaps
                                    </span>
                                    <span>•</span>
                                    <span>
                                      <strong>{subtopicsCount}</strong> subtopics
                                    </span>
                                    <Badge variant="outline" className="text-[10px] ml-1">
                                      Wt: {sub.base_weight}
                                    </Badge>
                                  </div>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="pt-1 pb-3 text-xs">
                                <div className="space-y-2 bg-muted/20 p-3 rounded-lg border border-border/40">
                                  {sub.chapters.map((ch, cIdx) => (
                                    <div
                                      key={cIdx}
                                      className="p-2.5 rounded-md bg-card border border-border/60 space-y-1.5"
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="font-medium text-foreground">
                                          <span className="text-muted-foreground font-mono mr-1.5 text-[10px]">
                                            {ch.sort_order}.
                                          </span>
                                          {ch.topic}
                                          {ch.section && (
                                            <span className="ml-2 text-[10px] text-muted-foreground italic">
                                              ({ch.section})
                                            </span>
                                          )}
                                        </div>
                                        <span className="text-[10px] text-muted-foreground font-mono">
                                          {ch.subtopics.length} subtopic
                                          {ch.subtopics.length === 1 ? "" : "s"}
                                        </span>
                                      </div>

                                      {ch.subtopics.length > 0 && (
                                        <div className="pl-4 pt-1 border-l-2 border-border/70 space-y-1">
                                          {ch.subtopics.map((st, stIdx) => (
                                            <div
                                              key={stIdx}
                                              className="text-[11px] text-muted-foreground flex items-center justify-between"
                                            >
                                              <span>
                                                <span className="font-mono text-[9px] mr-1 text-muted-foreground/70">
                                                  {st.sort_order}.
                                                </span>
                                                {st.name}
                                              </span>
                                              {st.subtopic_no && (
                                                <span className="font-mono text-[9px] text-muted-foreground/60">
                                                  #{st.subtopic_no}
                                                </span>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          );
                        })}
                      </Accordion>
                    </div>
                  </div>
                )}

                {/* 4. Prominent Destructive Warning Notice */}
                {parseResult.success && (
                  <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 space-y-3 mt-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-destructive/20 text-destructive shrink-0 mt-0.5">
                        <AlertTriangle className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-destructive">
                          Warning: Existing Data Will Be Replaced
                        </h4>
                        <p className="text-xs text-destructive/90 leading-relaxed">
                          Executing this import will{" "}
                          <strong>permanently clear and wipe</strong> all existing planner
                          subjects, chapters, subtopics, and all associated student study
                          progress records before importing the new curriculum hierarchy.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 pt-2 border-t border-destructive/20">
                      <Checkbox
                        id="confirm-wipe-checkbox"
                        checked={confirmWipe}
                        onCheckedChange={(c) => setConfirmWipe(!!c)}
                        className="data-[state=checked]:bg-destructive data-[state=checked]:border-destructive"
                      />
                      <label
                        htmlFor="confirm-wipe-checkbox"
                        className="text-xs font-semibold text-foreground cursor-pointer select-none"
                      >
                        I understand and confirm that all existing planner data and student progress
                        will be wiped and replaced.
                      </label>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t bg-muted/20 flex items-center justify-between shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleModalOpenChange(false)}
            disabled={importing || parsing || clearingOnly}
            className="text-xs"
          >
            Cancel
          </Button>

          <div className="flex items-center gap-2">
            {parseResult && (
              <Button
                variant="outline"
                size="sm"
                onClick={resetState}
                disabled={importing || parsing || clearingOnly}
                className="text-xs"
              >
                Reset Selection
              </Button>
            )}

            <Button
              size="sm"
              onClick={handleImport}
              disabled={
                !parseResult ||
                !parseResult.success ||
                !confirmWipe ||
                importing ||
                parsing ||
                clearingOnly
              }
              className="font-bold text-xs bg-primary text-primary-foreground hover:bg-primary/90 min-w-36"
            >
              {importing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  Importing & Replacing...
                </>
              ) : (
                <>
                  <Upload className="h-3.5 w-3.5 mr-1.5" />
                  Wipe & Import Syllabus
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, UploadCloud, CheckCircle2, AlertCircle, ArrowRight, ArrowLeft, Info, FileJson } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface BulkUploadStepperProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  instructions: React.ReactNode;
  onParse: (jsonString: string) => { data: any; error: string | null };
  onPreviewRender: (data: any) => React.ReactNode;
  onSubmit: (data: any, state: 'draft' | 'published') => Promise<void>;
  onSuccess: () => void;
}

export default function BulkUploadStepper({
  open,
  onOpenChange,
  title,
  instructions,
  onParse,
  onPreviewRender,
  onSubmit,
  onSuccess,
}: BulkUploadStepperProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [jsonInput, setJsonInput] = useState("");
  const [parsedData, setParsedData] = useState<any>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [selectedState, setSelectedState] = useState<'draft' | 'published'>('draft');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetState = () => {
    setStep(1);
    setJsonInput("");
    setParsedData(null);
    setParseError(null);
    setSelectedState('draft');
    setIsSubmitting(false);
  };

  const handleOpenChange = (v: boolean) => {
    if (isSubmitting) return;
    if (!v) resetState();
    onOpenChange(v);
  };

  const handleNextToPreview = () => {
    if (!jsonInput.trim()) {
      setParseError("Please provide JSON data to parse.");
      return;
    }
    const { data, error } = onParse(jsonInput);
    if (error) {
      setParseError(error);
      setParsedData(null);
    } else {
      setParseError(null);
      setParsedData(data);
      setStep(2);
    }
  };

  const handleNextToPublish = () => {
    setStep(3);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit(parsedData, selectedState);
      toast({ title: "Bulk upload successful!" });
      resetState();
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader className="pb-0 space-y-0">
          <DialogTitle className="sr-only">{title}</DialogTitle>
          <DialogDescription className="sr-only">Bulk upload form</DialogDescription>
          
          {/* Visual Stepper */}
          <div className="flex items-start justify-center pt-2 pb-0">
            <div className="flex items-start max-w-sm w-full justify-between relative">
              {/* Lines in background */}
              <div className="absolute top-4 left-[15%] right-[15%] h-[2px] bg-muted -z-0">
                <div className={`h-full bg-primary transition-all duration-300 ${step === 1 ? 'w-0' : step === 2 ? 'w-1/2' : 'w-full'}`} />
              </div>
              
              <div className="flex flex-col items-center gap-1 z-10 bg-background px-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm transition-colors ${step >= 1 ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground border border-border"}`}>1</div>
                <span className={`text-[10px] font-medium uppercase tracking-wider ${step >= 1 ? "text-foreground" : "text-muted-foreground"}`}>Input</span>
              </div>
              <div className="flex flex-col items-center gap-1 z-10 bg-background px-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm transition-colors ${step >= 2 ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground border border-border"}`}>2</div>
                <span className={`text-[10px] font-medium uppercase tracking-wider ${step >= 2 ? "text-foreground" : "text-muted-foreground"}`}>Preview</span>
              </div>
              <div className="flex flex-col items-center gap-1 z-10 bg-background px-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm transition-colors ${step >= 3 ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground border border-border"}`}>3</div>
                <span className={`text-[10px] font-medium uppercase tracking-wider ${step >= 3 ? "text-foreground" : "text-muted-foreground"}`}>Publish</span>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col pt-4 pb-2 min-h-0">
          {step === 1 && (
            <div className="flex flex-col h-full gap-4 pt-2 animate-in fade-in duration-300">
              <div className="bg-muted/30 p-4 rounded-xl border border-border/50 flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold flex items-center gap-2 text-foreground">
                      <FileJson className="h-5 w-5 text-primary" />
                      {title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Paste your formatted JSON data below to import multiple records at once.
                    </p>
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2 h-8 border-primary/20 text-primary hover:bg-primary/5 transition-colors">
                        <Info className="h-4 w-4" /> View Format
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[450px] max-w-[90vw] text-sm p-0 overflow-hidden border-border/50 shadow-lg" align="end">
                      <div className="bg-muted/50 p-3 border-b border-border/50">
                        <h4 className="font-semibold text-primary flex items-center gap-2"><Info className="h-4 w-4" /> Format Instructions</h4>
                      </div>
                      <div className="p-4 bg-background">
                        {instructions}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {parseError && (
                <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg flex items-start gap-2 border border-destructive/20 shadow-sm animate-in slide-in-from-top-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span className="whitespace-pre-wrap font-medium">{parseError}</span>
                </div>
              )}

              <div className="flex-1 relative rounded-xl overflow-hidden border-2 border-dashed border-muted-foreground/30 focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10 transition-all bg-muted/5 group">
                {!jsonInput && (
                  <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center opacity-40 group-focus-within:opacity-20 transition-opacity">
                    <UploadCloud className="h-12 w-12 mb-3 text-muted-foreground" />
                    <span className="font-mono text-sm text-muted-foreground">{"[\n  { ... }\n]"}</span>
                  </div>
                )}
                <Textarea
                  className="w-full min-h-[200px] max-h-[400px] p-4 font-mono text-xs resize-none bg-transparent border-0 focus-visible:ring-0 focus-visible:outline-none"
                  placeholder=""
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  spellCheck={false}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col h-full gap-4 overflow-hidden min-h-0">
              <div className="text-sm font-medium flex items-center gap-2 shrink-0">
                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                Data parsed successfully. Please review the summary before proceeding:
              </div>
              <div className="flex-1 overflow-y-auto border rounded-md p-4 bg-muted/20 min-h-0">
                {parsedData && onPreviewRender(parsedData)}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col h-full gap-6">
              <div className="text-sm font-medium">
                Choose the initial state for the uploaded content:
              </div>
              
              <RadioGroup value={selectedState} onValueChange={(v) => setSelectedState(v as any)} className="gap-4">
                <div className="flex items-center space-x-3 border p-4 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setSelectedState('draft')}>
                  <RadioGroupItem value="draft" id="draft" />
                  <Label htmlFor="draft" className="flex flex-col cursor-pointer">
                    <span className="font-semibold text-base">Save as Draft</span>
                    <span className="text-muted-foreground text-sm font-normal">Content will be hidden from users until published.</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 border p-4 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setSelectedState('published')}>
                  <RadioGroupItem value="published" id="published" />
                  <Label htmlFor="published" className="flex flex-col cursor-pointer">
                    <span className="font-semibold text-base">Publish Immediately</span>
                    <span className="text-muted-foreground text-sm font-normal">Content will be visible to all users right away.</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-4 sm:justify-between">
          <Button variant="ghost" onClick={() => { if (step > 1) setStep((s) => (s - 1) as any); else handleOpenChange(false); }} disabled={isSubmitting}>
            {step > 1 ? <><ArrowLeft className="h-4 w-4 mr-2" /> Back</> : "Cancel"}
          </Button>
          
          {step === 1 && (
            <Button onClick={handleNextToPreview} className="gap-2">
              Next: Preview <ArrowRight className="h-4 w-4" />
            </Button>
          )}
          {step === 2 && (
            <Button onClick={handleNextToPublish} className="gap-2">
              Next: Settings <ArrowRight className="h-4 w-4" />
            </Button>
          )}
          {step === 3 && (
            <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-primary text-primary-foreground font-bold">
              {isSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploading...</> : <><UploadCloud className="h-4 w-4 mr-2" /> Complete Upload</>}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FileUp, Loader2, CheckCircle, ArrowLeft, Send, FileCheck, Sparkles, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { SUBJECT_MAPPING, formatSubjectName } from "@/utils/subjects";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export default function CommunityUploadPage() {
  const supabase = createClient();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [facultyList, setFacultyList] = useState<any[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<number | "">("");
  const [confirmed, setConfirmed] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [facultyId, setFacultyId] = useState("");
  const [plannerDate, setPlannerDate] = useState("");

  const allSubjects = [
    ...SUBJECT_MAPPING.foundation,
    ...SUBJECT_MAPPING.intermediate,
    ...SUBJECT_MAPPING.final
  ];

  useEffect(() => {
    const fetchFaculty = async () => {
      const { data } = await supabase.from('faculty').select('id, name');
      if (data) setFacultyList(data);
    };
    fetchFaculty();
  }, [supabase]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast({ title: "Please select a PDF file", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!uploadRes.ok) throw new Error('Failed to upload file');
      const { url } = await uploadRes.json();
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      const { error } = await supabase.from('community_submissions').insert({
        user_id: userData.user.id,
        title,
        category: categoryId,
        faculty_id: facultyId || null,
        planner_date: plannerDate,
        pdf_url: url,
        pages: pages,
        status: 'pending'
      });
      if (error) throw error;

      setSubmitted(true);
      toast({ title: "Submission successful!" });
    } catch (error: any) {
      toast({ title: "Error submitting", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#fcfcfd] dark:bg-background flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="max-w-md w-full text-center p-10 border-none shadow-2xl bg-white dark:bg-card">
            <div className="flex justify-center mb-6">
              <div className="h-24 w-24 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center border-4 border-emerald-500/20">
                <CheckCircle className="h-12 w-12 text-emerald-500" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold mb-2">Well Done!</CardTitle>
            <CardDescription className="text-base mb-8">
              Your contribution makes CAStudyHub better for everyone. Our admins are reviewing it now.
              <div className="mt-4 p-4 bg-muted/50 rounded-xl border border-border/50 flex items-start gap-3 text-left">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-xl">📧</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Stay tuned!</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Further details and approval status will be communicated to you via your registered email address.
                  </p>
                </div>
              </div>
            </CardDescription>
            <div className="flex flex-col gap-3">
              <Button asChild size="lg" className="w-full bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                <Link href="/community">Return to Library</Link>
              </Button>
              <Button variant="ghost" onClick={() => setSubmitted(false)} className="w-full text-muted-foreground">
                Upload Something Else
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfcfd] dark:bg-background py-16 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-10">
          <Link 
            href="/community" 
            className="group inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-all"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /> 
            Back to Community
          </Link>
        </div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-none shadow-xl shadow-black/5 bg-white dark:bg-card overflow-hidden">
            {/* Accent Top Bar */}
            <div className="h-2 w-full bg-gradient-to-r from-accent via-primary to-accent" />
            
            <CardHeader className="text-center pt-12 pb-6 px-8">
              <div className="flex justify-center mb-4">
                <div className="h-14 w-14 rounded-2xl bg-accent/10 flex items-center justify-center border border-accent/20">
                  <Sparkles className="h-7 w-7 text-accent" />
                </div>
              </div>
              <CardTitle className="text-3xl font-bold tracking-tight">
                Contribute <span className="text-accent">Resources</span>
              </CardTitle>
              <CardDescription className="mt-2 text-base">
                Help the community grow by sharing your study planners or notes.
              </CardDescription>
            </CardHeader>

            <CardContent className="px-8 pb-12 pt-4">
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* File Dropzone - Highlighted UI */}
                <div className="space-y-3">
                  <label className="text-sm font-semibold flex items-center gap-2">
                    <FileCheck className="h-4 w-4 text-accent" /> PDF Document
                  </label>
                  <div 
                    onClick={() => document.getElementById('file-upload')?.click()}
                    className={cn(
                      "group relative flex flex-col items-center justify-center w-full p-10 border-2 border-dashed rounded-2xl transition-all duration-300 cursor-pointer",
                      file 
                        ? "border-accent/40 bg-accent/5 ring-4 ring-accent/5" 
                        : "border-muted-foreground/20 bg-muted/30 hover:border-accent/40 hover:bg-accent/5"
                    )}
                  >
                    {file ? (
                      <div className="flex flex-col items-center text-center">
                        <div className="p-4 bg-accent/20 rounded-full mb-3 scale-110">
                           <FileCheck className="h-8 w-8 text-accent" /> 
                        </div>
                        <p className="text-sm font-bold text-foreground truncate max-w-xs">{file.name}</p>
                        <p className="text-xs text-accent font-medium mt-1 uppercase tracking-wider">File Selected</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-center">
                        <div className="p-4 bg-white dark:bg-muted/50 rounded-2xl shadow-sm mb-4 group-hover:shadow-accent/20 group-hover:-translate-y-1 transition-all">
                          <FileUp className="h-8 w-8 text-muted-foreground group-hover:text-accent" />
                        </div>
                        <p className="text-sm font-semibold">Click to upload PDF</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">Maximum size 10MB</p>
                      </div>
                    )}
                    <input id="file-upload" type="file" accept="application/pdf" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div className="space-y-2 sm:col-span-3">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Title</label>
                    <Input 
                      required 
                      value={title} 
                      onChange={e => setTitle(e.target.value)} 
                      placeholder="Title of your material" 
                      className="h-12 border-border focus:border-accent focus:ring-accent/20 bg-muted/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Subject</label>
                    <Select required value={categoryId} onValueChange={setCategoryId}>
                      <SelectTrigger className="h-12 border-border focus:ring-accent/20 bg-muted/20">
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {allSubjects.map(sub => (
                          <SelectItem key={sub} value={sub}>{formatSubjectName(sub as any)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Faculty (Optional)</label>
                    <Select 
                      value={facultyId} 
                      onValueChange={(value) => setFacultyId(value === "none" ? "" : value)}
                    >
                      <SelectTrigger className="h-12 border-border focus:ring-accent/20 bg-muted/20">
                        <SelectValue placeholder="No Faculty Selected" />
                      </SelectTrigger>
                      <SelectContent>
                        {facultyId && (
                          <Button 
                            variant="ghost" 
                            className="w-full justify-start px-2 text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFacultyId("");
                            }}
                          >
                            Clear Selection
                          </Button>
                        )}
                        {facultyList.map(f => (
                          <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div> */}

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Material Date</label>
                    <Input 
                      required type="date" value={plannerDate} 
                      onChange={e => setPlannerDate(e.target.value)} 
                      className="h-12 border-border focus:ring-accent/20 bg-muted/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Pages</label>
                    <Input 
                      required 
                      type="number" 
                      min="1"
                      value={pages} 
                      onChange={e => setPages(e.target.value ? parseInt(e.target.value) : "")} 
                      placeholder="e.g. 15" 
                      className="h-12 border-border focus:ring-accent/20 bg-muted/20"
                    />
                  </div>
                </div>

                <div className="pt-6">
                  <div className="flex items-start space-x-3 mb-6 p-4 rounded-xl bg-muted/30 border border-border/50">
                    <Checkbox 
                      id="confirm-original" 
                      checked={confirmed}
                      onCheckedChange={(checked) => setConfirmed(checked as boolean)}
                      className="mt-1 border-muted-foreground/30 data-[state=checked]:bg-accent data-[state=checked]:border-accent"
                    />
                    <Label 
                      htmlFor="confirm-original" 
                      className="text-sm font-medium leading-relaxed text-muted-foreground cursor-pointer select-none"
                    >
                      I confirm that the content I am submitting is my original work and does not infringe any third-party copyrights or come from unauthorized sources.
                    </Label>
                  </div>

                  <Button 
                    type="submit" 
                    size="lg"
                    className="w-full h-14 text-lg font-bold bg-accent hover:bg-accent/90 text-white shadow-lg shadow-accent/20 transition-all active:scale-[0.98]" 
                    disabled={loading || !confirmed}
                  >
                    {loading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      <span className="flex items-center gap-2">
                        Submit for Approval <Send className="h-5 w-5" />
                      </span>
                    )}
                  </Button>
                  <div className="flex items-center justify-center gap-2 mt-4 text-xs text-muted-foreground">
                    <ShieldCheck className="h-4 w-4" />
                    Secure upload verified by CAStudyHub Admin
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
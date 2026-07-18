"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  Trash2, 
  BookOpen, 
  Layers, 
  FileText, 
  CheckCircle2, 
  Search, 
  ExternalLink, 
  Calendar, 
  WifiOff, 
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { listOfflineItems, deleteOfflineItem, OfflineItem } from "@/utils/offline-db";
import { formatSubjectName } from "@/utils/subjects";
import { toast } from "sonner";

export default function Downloads() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  const [items, setItems] = useState<OfflineItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchOfflineData = async () => {
    setLoading(true);
    try {
      const allItems = await listOfflineItems();
      setItems(allItems);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load offline downloads");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOfflineData();
  }, []);

  const handleDeleteItem = async (id: string, title: string) => {
    try {
      await deleteOfflineItem(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
      toast.success(`Removed "${title}" from offline storage`);
    } catch (e) {
      console.error(e);
      toast.error("Failed to remove item");
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.subject.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === "all") return matchesSearch;
    return item.type === activeTab && matchesSearch;
  });

  const getSourceLabel = (item: OfflineItem) => {
    if (item.type === "planner") return "Study Planner";
    if (item.type === "flashcard") return "Flashcard Set";
    return "Mock Exam";
  };

  return (
    <div className="min-h-screen bg-background">
      <section className="bg-primary py-12 md:py-16">
        <div className="container max-w-5xl px-4">
          <motion.div 
            initial={{ opacity: 0, y: 16 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="flex flex-col justify-between items-start gap-4"
          >
            <div>
              <button
                onClick={() => router.push("/study")}
                className="mb-4 flex items-center gap-1.5 text-xs text-primary-foreground/50 hover:text-primary-foreground transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Study Tools
              </button>
              <h1 className="text-2xl md:text-3xl font-bold text-primary-foreground flex items-center gap-2">
                Offline <span className="text-accent">Downloads</span> <WifiOff className="h-5 w-5 text-accent" />
              </h1>
              <p className="mt-2 text-xs md:text-sm text-primary-foreground/50 max-w-2xl leading-relaxed">
                Access your saved materials and practice exams even without an active internet connection.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="container max-w-5xl py-8 px-4">
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex flex-col gap-4 mb-6">
            <div className="w-full">
              {/* Using CSS grid for equal column widths to prevent mobile layout overflow */}
              <TabsList className="grid grid-cols-4 w-full p-1 bg-muted/80 rounded-xl h-11">
                <TabsTrigger value="all" className="text-xs py-2 rounded-lg">All</TabsTrigger>
                <TabsTrigger value="planner" className="text-xs py-2 rounded-lg">Planners</TabsTrigger>
                <TabsTrigger value="flashcard" className="text-xs py-2 rounded-lg">Cards</TabsTrigger>
                <TabsTrigger value="mcq" className="text-xs py-2 rounded-lg">Exams</TabsTrigger>
              </TabsList>
            </div>
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search offline downloads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 w-full bg-card"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center bg-card/10">
              <BookOpen className="h-10 w-10 text-muted-foreground/30 animate-pulse" />
              <p className="mt-3 text-sm text-muted-foreground font-medium">No offline items found.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence>
                {filteredItems.map((item, i) => {
                  const ItemIcon = item.type === "planner" ? FileText : item.type === "flashcard" ? Layers : CheckCircle2;
                  
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: i * 0.03 }}
                    >
                      <Card className="h-full flex flex-col justify-between hover:border-accent/30 hover:shadow-sm transition-all group bg-card">
                        <CardHeader className="p-4 pb-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-accent group-hover:bg-accent/10 transition-all shrink-0">
                              <ItemIcon className="h-4.5 w-4.5" />
                            </div>
                            <div className="flex flex-col items-end gap-1 shrink-0 text-right">
                              <Badge variant="secondary" className="text-[9px] font-semibold py-0.5 capitalize max-w-[120px] truncate">
                                {formatSubjectName(item.subject)}
                              </Badge>
                              <span className="text-[9px] text-muted-foreground font-medium">
                                {getSourceLabel(item)}
                              </span>
                            </div>
                          </div>
                          <CardTitle className="mt-3 text-sm font-bold line-clamp-2 leading-snug tracking-tight text-card-foreground">
                            {item.title}
                          </CardTitle>
                        </CardHeader>

                        <CardContent className="p-4 pt-0 flex flex-col gap-4">
                          <div className="text-xs text-muted-foreground space-y-1">
                            {item.type === "planner" && item.metadata?.faculty_name && (
                              <p className="truncate">Faculty: {item.metadata.faculty_name}</p>
                            )}
                            {item.type === "flashcard" && item.metadata?.cardCount && (
                              <p>{item.metadata.cardCount} Cards</p>
                            )}
                            {item.type === "mcq" && item.metadata?.questions_count && (
                              <p>{item.metadata.questions_count} Questions • {item.metadata.duration ? `${item.metadata.duration}m` : "No limit"}</p>
                            )}
                            <p className="text-[10px] text-muted-foreground/60 flex items-center gap-1">
                              <Calendar className="h-3 w-3" /> Saved {new Date(item.downloadedAt).toLocaleDateString()}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 pt-2 border-t mt-auto">
                            {item.type === "planner" ? (
                              <Button
                                size="sm"
                                className="flex-1 text-xs gap-1.5 h-9"
                                onClick={() => router.push(`/pdf-preview?offlineId=${item.id}`)}
                              >
                                <ExternalLink className="h-3.5 w-3.5" /> View PDF
                              </Button>
                            ) : item.type === "flashcard" ? (
                              <Button
                                size="sm"
                                className="flex-1 text-xs gap-1.5 h-9"
                                onClick={() => router.push(`/study/flash-cards/set/${item.id}`)}
                              >
                                <Layers className="h-3.5 w-3.5" /> Practice Cards
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                className="flex-1 text-xs gap-1.5 h-9"
                                onClick={() => router.push(`/practice/mock-exams/${item.id}`)}
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" /> Start Exam
                              </Button>
                            )}
                            
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-9 w-9 text-destructive border-destructive/20 hover:bg-destructive/5 shrink-0"
                              onClick={() => handleDeleteItem(item.id, item.title)}
                              title="Delete offline cache"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </Tabs>
      </section>
    </div>
  );
}

"use client";

import { useEffect, useState, use } from "react";
import { createClient } from "@/utils/supabase/client";
import { Plus, Trash2, Loader2, RefreshCw, ChevronLeft, Pencil, Video, BookOpen, FileText } from "lucide-react";
import { TableFilters } from "@/components/admin/TableFilters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";
import { ConfirmModal } from "@/components/shared/ConfirmModal";

export default function FacultyDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const supabase = createClient();
  const { toast } = useToast();
  
  const [faculty, setFaculty] = useState<any>(null);
  const [allUnlinkedPlanners, setAllUnlinkedPlanners] = useState<any[]>([]);
  const [selectedPlannerToLink, setSelectedPlannerToLink] = useState("");
  const [showLinkPlanner, setShowLinkPlanner] = useState(false);
  
  // Videos state
  const [videos, setVideos] = useState<any[]>([]);
  const [showAddVideo, setShowAddVideo] = useState(false);
  const [videoName, setVideoName] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoDuration, setVideoDuration] = useState("");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const [videoFilters, setVideoFilters] = useState({ column: "name", value: "" });

  // Courses state
  const [courses, setCourses] = useState<any[]>([]);
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [courseName, setCourseName] = useState("");
  const [courseHours, setCourseHours] = useState("");
  const [courseViews, setCourseViews] = useState("");
  const [courseBatchType, setCourseBatchType] = useState("");
  const [coursePeriod, setCoursePeriod] = useState("");
  const [coursePrice, setCoursePrice] = useState("");
  const [courseLink, setCourseLink] = useState("");
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [courseFilters, setCourseFilters] = useState({ column: "name", value: "" });

  // Planners state
  const [planners, setPlanners] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string, type: 'video' | 'course' | 'planner', title?: string } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    
    const { data: fData } = await supabase.from('faculty').select('*').eq('id', id).single();
    if (fData) setFaculty(fData);

    const [vRes, cRes, pRes, unlinkedRes] = await Promise.all([
      supabase.from('faculty_videos').select('*').eq('faculty_id', id).order('created_at', { ascending: false }),
      supabase.from('faculty_courses').select('*').eq('faculty_id', id).order('created_at', { ascending: false }),
      supabase.from('study_planners').select('*').eq('faculty_id', id).order('created_at', { ascending: false }),
      supabase.from('study_planners').select('id, title').is('faculty_id', null).order('created_at', { ascending: false })
    ]);

    if (vRes.data) setVideos(vRes.data);
    if (cRes.data) setCourses(cRes.data);
    if (pRes.data) setPlanners(pRes.data);
    if (unlinkedRes.data) setAllUnlinkedPlanners(unlinkedRes.data);
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  // Handle Videos
  const handleEditVideo = (v: any) => {
    setVideoName(v.name);
    setVideoUrl(v.url);
    setVideoDuration(v.duration_minutes ? v.duration_minutes.toString() : "");
    setThumbnailUrl(v.thumbnail_url || "");
    setThumbnailFile(null);
    setEditingVideoId(v.id);
    setShowAddVideo(true);
  };

  const handleSaveVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload: any = {
      faculty_id: id,
      name: videoName,
      url: videoUrl,
      duration_minutes: videoDuration || null,
    };

    if (thumbnailFile) {
      try {
        const formData = new FormData();
        formData.append("file", thumbnailFile);
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        if (!uploadRes.ok) throw new Error("Failed to upload thumbnail");
        const uploadData = await uploadRes.json();
        payload.thumbnail_url = uploadData.url;
      } catch (uploadError: any) {
        toast({ title: "Thumbnail upload failed", description: uploadError.message, variant: "destructive" });
        setSaving(false);
        return;
      }
    } else if (thumbnailUrl) {
      payload.thumbnail_url = thumbnailUrl;
    } else {
      payload.thumbnail_url = null;
    }
    
    let error;
    if (editingVideoId) {
      const { error: err } = await supabase.from('faculty_videos').update(payload).eq('id', editingVideoId);
      error = err;
    } else {
      const { error: err } = await supabase.from('faculty_videos').insert(payload);
      error = err;
    }

    if (error) {
      toast({ title: "Error saving video", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Video saved securely!" });
      setVideoName(""); setVideoUrl(""); setVideoDuration("");
      setThumbnailFile(null); setThumbnailUrl("");
      setEditingVideoId(null);
      setShowAddVideo(false);
      fetchData();
    }
    setSaving(false);
  };

  const handleDeleteVideo = (vid: string) => {
    setItemToDelete({ id: vid, type: 'video' });
    setIsConfirmModalOpen(true);
  };

  const executeDeleteVideo = async (vid: string) => {
    await supabase.from('faculty_videos').delete().eq('id', vid);
    fetchData();
  };

  // Handle Courses
  const handleEditCourse = (c: any) => {
    setCourseName(c.name);
    setCourseHours(c.hours_count ? c.hours_count.toString() : "");
    setCourseViews(c.views || "");
    setCourseBatchType(c.batchtype || "");
    setCoursePeriod(c.period || "");
    setCoursePrice(c.price ? c.price.toString() : "");
    setCourseLink(c.course_link || "");
    setEditingCourseId(c.id);
    setShowAddCourse(true);
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      faculty_id: id,
      name: courseName,
      hours_count: courseHours ? parseInt(courseHours) : 0,
      views: courseViews,
      batchtype: courseBatchType,
      period: coursePeriod,
      price: coursePrice ? parseFloat(coursePrice) : 0,
      course_link: courseLink,
    };
    
    let error;
    if (editingCourseId) {
      const { error: err } = await supabase.from('faculty_courses').update(payload).eq('id', editingCourseId);
      error = err;
    } else {
      const { error: err } = await supabase.from('faculty_courses').insert(payload);
      error = err;
    }

    if (error) {
      toast({ title: "Error saving course", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Course saved successfully!" });
      setCourseName(""); setCourseHours(""); setCourseViews(""); setCourseBatchType(""); setCoursePeriod(""); setCoursePrice(""); setCourseLink("");
      setEditingCourseId(null);
      setShowAddCourse(false);
      fetchData();
    }
    setSaving(false);
  };

  const handleDeleteCourse = (cid: string) => {
    setItemToDelete({ id: cid, type: 'course' });
    setIsConfirmModalOpen(true);
  };

  const executeDeleteCourse = async (cid: string) => {
    await supabase.from('faculty_courses').delete().eq('id', cid);
    fetchData();
  };

  // Handle Linking Planner
  const handleLinkPlanner = async () => {
    if (!selectedPlannerToLink) return;
    setSaving(true);
    const { error } = await supabase.from('study_planners').update({ faculty_id: id }).eq('id', selectedPlannerToLink);
    if (error) {
      toast({ title: "Error linking planner", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Planner linked successfully!" });
      setShowLinkPlanner(false);
      setSelectedPlannerToLink("");
      fetchData();
    }
    setSaving(false);
  };

  const handleUnlinkPlanner = (pid: string) => {
    setItemToDelete({ id: pid, type: 'planner' });
    setIsConfirmModalOpen(true);
  };

  const executeUnlinkPlanner = async (pid: string) => {
    await supabase.from('study_planners').update({ faculty_id: null }).eq('id', pid);
    fetchData();
  };

  const handleConfirmAction = async () => {
    if (!itemToDelete) return;
    
    if (itemToDelete.type === 'video') {
      await executeDeleteVideo(itemToDelete.id);
    } else if (itemToDelete.type === 'course') {
      await executeDeleteCourse(itemToDelete.id);
    } else if (itemToDelete.type === 'planner') {
      await executeUnlinkPlanner(itemToDelete.id);
    }
    
    setItemToDelete(null);
    setIsConfirmModalOpen(false);
  };


  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 border-b border-border pb-6">
        <Link href="/admin/faculty">
          <Button variant="outline" size="icon"><ChevronLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{faculty?.name || "Faculty Details"}</h1>
          <p className="text-muted-foreground mt-1 text-sm">Manage extensive info seamlessly.</p>
        </div>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="icon" onClick={fetchData}><RefreshCw className="h-4 w-4" /></Button>
        </div>
      </div>

      <Tabs defaultValue="videos" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-xl">
          <TabsTrigger value="videos" className="gap-2"><Video className="h-4 w-4" /> Videos</TabsTrigger>
          <TabsTrigger value="courses" className="gap-2"><BookOpen className="h-4 w-4" /> Courses</TabsTrigger>
          <TabsTrigger value="planners" className="gap-2"><FileText className="h-4 w-4" /> Planners</TabsTrigger>
        </TabsList>
        
        {/* VIDEOS TAB */}
        <TabsContent value="videos" className="mt-6 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Demo Videos</h2>
            <Button onClick={() => {
              if (showAddVideo) {
                setEditingVideoId(null);
                setVideoName(""); setVideoUrl(""); setVideoDuration("");
                setThumbnailFile(null); setThumbnailUrl("");
              }
              setShowAddVideo(!showAddVideo);
            }} className="gap-2">
              <Plus className="h-4 w-4" /> {showAddVideo ? "Cancel" : "Add Video"}
            </Button>
          </div>

          <TableFilters 
            columns={[
              { key: "name", label: "Video Name" },
              { key: "url", label: "URL" },
              { key: "duration_minutes", label: "Duration" }
            ]} 
            onFilterChange={setVideoFilters}
            placeholder="Filter videos..."
          />
          
          {showAddVideo && (
            <Card>
              <CardHeader><CardTitle>{editingVideoId ? "Edit Video" : "Add New Video"}</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleSaveVideo} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Video Name</label>
                    <Input required value={videoName} onChange={e => setVideoName(e.target.value)} placeholder="Lesson Title" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Video URL / YouTube Link</label>
                    <Input required type="url" value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="https://..." />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Duration (e.g. 45 mins or 2.5 hr)</label>
                    <Input required value={videoDuration} onChange={e => setVideoDuration(e.target.value)} placeholder="E.g. 45 mins" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Thumbnail Image</label>
                    <div className="flex flex-col gap-2">
                      <Input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => {
                          const file = e.target.files?.[0] ?? null;
                          setThumbnailFile(file);
                          if (file) setThumbnailUrl(URL.createObjectURL(file));
                        }} 
                      />
                      {thumbnailUrl && (
                        <div className="relative h-20 w-32 overflow-hidden rounded-md border border-border">
                          <img src={thumbnailUrl} alt="Thumbnail preview" className="h-full w-full object-cover" />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="col-span-full pt-2">
                    <Button type="submit" disabled={saving}>
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Data"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Video Name</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {videos.filter(v => {
                  if (!videoFilters.value) return true;
                  const field = v[videoFilters.column];
                  return field?.toString().toLowerCase().includes(videoFilters.value.toLowerCase());
                }).length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">No videos found matching filter.</TableCell></TableRow>
                )}
                {videos.filter(v => {
                  if (!videoFilters.value) return true;
                  const field = v[videoFilters.column];
                  return field?.toString().toLowerCase().includes(videoFilters.value.toLowerCase());
                }).map(v => (
                  <TableRow key={v.id}>
                    <TableCell className="font-medium">{v.name}</TableCell>
                    <TableCell><a href={v.url} target="_blank" rel="noreferrer" className="text-primary hover:underline truncate max-w-[200px] block">{v.url}</a></TableCell>
                    <TableCell>{v.duration_minutes}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="icon" onClick={() => handleEditVideo(v)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteVideo(v.id)} className="text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* COURSES TAB */}
        <TabsContent value="courses" className="mt-6 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Premium Courses</h2>
            <Button onClick={() => setShowAddCourse(!showAddCourse)} className="gap-2">
              <Plus className="h-4 w-4" /> {showAddCourse ? "Cancel" : "Add Course"}
            </Button>
          </div>

          <TableFilters 
            columns={[
              { key: "name", label: "Course Name" },
              { key: "batchtype", label: "Batch Type" },
              { key: "period", label: "Period" },
              { key: "hours_count", label: "Hours" },
              { key: "views", label: "Views" },
              { key: "price", label: "Price" },
              { key: "course_link", label: "Link" }
            ]} 
            onFilterChange={setCourseFilters}
            placeholder="Filter courses..."
          />
          
          {showAddCourse && (
            <Card>
              <CardHeader><CardTitle>{editingCourseId ? "Edit Course" : "Add New Course"}</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleSaveCourse} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-full">
                    <label className="text-sm font-medium">Course Name</label>
                    <Input required value={courseName} onChange={e => setCourseName(e.target.value)} placeholder="Full Batch Course" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Total Hours</label>
                    <Input type="number" required value={courseHours} onChange={e => setCourseHours(e.target.value)} placeholder="e.g. 150" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Views</label>
                    <Input required value={courseViews} onChange={e => setCourseViews(e.target.value)} placeholder="e.g. 1.5 Views or Unlimited" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Batch Type</label>
                    <Input required value={courseBatchType} onChange={e => setCourseBatchType(e.target.value)} placeholder="e.g. Regular / Fasttrack" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Period / Validity</label>
                    <Input required value={coursePeriod} onChange={e => setCoursePeriod(e.target.value)} placeholder="e.g. 6 Months / May 2025" />
                  </div>
                  <div className="space-y-2 md:col-span-1">
                    <label className="text-sm font-medium">Price ($ or ₹)</label>
                    <Input type="number" step="0.01" required value={coursePrice} onChange={e => setCoursePrice(e.target.value)} />
                  </div>
                  <div className="space-y-2 col-span-full">
                    <label className="text-sm font-medium">Course Link (URL)</label>
                    <Input type="url" value={courseLink} onChange={e => setCourseLink(e.target.value)} placeholder="https://..." />
                  </div>
                  <div className="col-span-full pt-2">
                    <Button type="submit" disabled={saving}>
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Course"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course Name</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.length === 0 && (
                  <TableRow><TableCell colSpan={8} className="text-center py-6 text-muted-foreground">No courses available.</TableCell></TableRow>
                )}
                {courses.filter(c => {
                  if (!courseFilters.value) return true;
                  const field = c[courseFilters.column];
                  return field?.toString().toLowerCase().includes(courseFilters.value.toLowerCase());
                }).map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c.hours_count}h</TableCell>
                    <TableCell>{c.views}</TableCell>
                    <TableCell>{c.batchtype}</TableCell>
                    <TableCell>{c.period}</TableCell>
                    <TableCell>₹{c.price}</TableCell>
                    <TableCell>
                      {c.course_link ? (
                        <a href={c.course_link} target="_blank" rel="noreferrer" className="text-primary hover:underline truncate max-w-[100px] block text-xs">
                          View
                        </a>
                      ) : (
                        <span className="text-muted-foreground text-[10px]">No link</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="icon" onClick={() => handleEditCourse(c)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteCourse(c.id)} className="text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* PLANNERS TAB */}
        <TabsContent value="planners" className="mt-6 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Linked Study Planners</h2>
            <div className="flex gap-2">
              <Button onClick={() => setShowLinkPlanner(!showLinkPlanner)} className="gap-2">
                <Plus className="h-4 w-4" /> {showLinkPlanner ? "Cancel" : "Link Existing Planner"}
              </Button>
            </div>
          </div>
          
          {showLinkPlanner && (
            <Card>
              <CardHeader><CardTitle>Link Existing Planner</CardTitle></CardHeader>
              <CardContent>
                <div className="flex gap-4 items-end">
                  <div className="space-y-2 flex-1">
                    <label className="text-sm font-medium">Select Planner (Unlinked)</label>
                    <select 
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={selectedPlannerToLink} 
                      onChange={e => setSelectedPlannerToLink(e.target.value)}
                    >
                      <option value="">Select a planner to link...</option>
                      {allUnlinkedPlanners.map(p => (
                        <option key={p.id} value={p.id}>{p.title}</option>
                      ))}
                    </select>
                  </div>
                  <Button onClick={handleLinkPlanner} disabled={saving || !selectedPlannerToLink}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Link"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Linked Date</TableHead>
                  <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {planners.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
                       No planners linked to this faculty.{" "}
                       <Link href="/admin/planners" className="text-primary hover:underline">Go to Planners page to create one.</Link>
                    </TableCell>
                  </TableRow>
                ) : (
                  planners.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium text-primary"><a href={p.pdf_url} target="_blank" rel="noreferrer" className="hover:underline">{p.title}</a></TableCell>
                      <TableCell>{new Date(p.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-1 justify-end">
                          <Button variant="ghost" size="sm" onClick={() => handleUnlinkPlanner(p.id)} className="text-destructive hover:bg-destructive/10">Unlink</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
        
      </Tabs>
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmAction}
        title={`Confirm ${itemToDelete?.type === 'planner' ? 'Unlink' : 'Delete'}?`}
        description={`Are you sure you want to ${itemToDelete?.type === 'planner' ? 'unlink this planner' : `delete this ${itemToDelete?.type}`}?`}
        confirmText={itemToDelete?.type === 'planner' ? 'Unlink' : 'Delete'}
      />
    </div>
  );
}

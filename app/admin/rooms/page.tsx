"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  Video,
  Loader2,
  RefreshCw,
  Save,
  CheckCircle,
  Globe,
  Plus,
  Trash2,
  Edit,
  Sparkles,
  BookOpen,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { SUBJECT_MAPPING, formatSubjectName } from "@/utils/subjects";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface CustomRoom {
  id: string;
  title: string;
  subject: string | null;
  meet_link: string | null;
  description: string | null;
  is_creator_room: boolean;
  session_status: "idle" | "live" | "ended";
  created_at: string;
}

export default function StudyRoomsAdmin() {
  const supabase = createClient();
  const { toast } = useToast();

  // Subject Rooms State
  const [links, setLinks] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  // Custom Rooms State
  const [customRooms, setCustomRooms] = useState<CustomRoom[]>([]);
  const [customLoading, setCustomLoading] = useState(true);

  // Dialog & Form State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<CustomRoom | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formSubject, setFormSubject] = useState("");
  const [formMeetLink, setFormMeetLink] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formIsCreator, setFormIsCreator] = useState(false);
  const [formSessionStatus, setFormSessionStatus] = useState<"idle" | "live" | "ended">("idle");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Grouped Categories for Subject selector mapping
  const groupedSubjects = [
    { label: "General", options: [{ value: "general", label: "General" }] },
    {
      label: "Foundation",
      options: SUBJECT_MAPPING.foundation.map((s) => ({ value: s, label: formatSubjectName(s) })),
    },
    {
      label: "Intermediate",
      options: SUBJECT_MAPPING.intermediate.map((s) => ({ value: s, label: formatSubjectName(s) })),
    },
    {
      label: "Final",
      options: SUBJECT_MAPPING.final.map((s) => ({ value: s, label: formatSubjectName(s) })),
    },
  ];

  const fetchSubjectRooms = async () => {
    setLoading(true);
    const { data } = await supabase.from("subject_meet_links").select("*");

    if (data) {
      const linksMap: Record<string, string> = {};
      data.forEach((item) => {
        linksMap[item.subject_id] = item.meet_url;
      });
      setLinks(linksMap);
    }
    setLoading(false);
  };

  const fetchCustomRooms = async () => {
    setCustomLoading(true);
    const { data, error } = await supabase
      .from("study_rooms")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) {
      setCustomRooms(data as CustomRoom[]);
    }
    setCustomLoading(false);
  };

  const refreshAll = () => {
    fetchSubjectRooms();
    fetchCustomRooms();
  };

  useEffect(() => {
    refreshAll();
  }, []);

  const handleUpdateSubjectLink = async (subjectId: string) => {
    setSavingId(subjectId);
    const meetUrl = links[subjectId] || "https://meet.google.com/new";

    const { error } = await supabase
      .from("subject_meet_links")
      .upsert({
        subject_id: subjectId,
        meet_url: meetUrl,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      toast({
        title: "Error updating room link",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Link updated successfully!",
        description: `Updated link for ${formatSubjectName(subjectId as any)}`,
      });
    }
    setSavingId(null);
  };

  const handleSubjectInputChange = (subjectId: string, value: string) => {
    setLinks((prev) => ({
      ...prev,
      [subjectId]: value,
    }));
  };

  // Open Dialog for Add Room
  const handleAddCustomRoomClick = () => {
    setEditingRoom(null);
    setFormTitle("");
    setFormSubject("general");
    setFormMeetLink("https://meet.google.com/new");
    setFormDescription("");
    setFormIsCreator(false);
    setFormSessionStatus("idle");
    setDialogOpen(true);
  };

  // Open Dialog for Edit Room
  const handleEditCustomRoomClick = (room: CustomRoom) => {
    setEditingRoom(room);
    setFormTitle(room.title);
    setFormSubject(room.subject || "general");
    setFormMeetLink(room.meet_link || "");
    setFormDescription(room.description || "");
    setFormIsCreator(room.is_creator_room);
    setFormSessionStatus(room.session_status);
    setDialogOpen(true);
  };

  // Save (Create/Update) Custom Room
  const handleSaveCustomRoom = async () => {
    if (!formTitle.trim()) {
      toast({
        title: "Title is required",
        variant: "destructive",
      });
      return;
    }

    const payload = {
      title: formTitle.trim(),
      subject: formSubject || null,
      meet_link: formMeetLink.trim() || "https://meet.google.com/new",
      description: formDescription.trim() || null,
      is_creator_room: formIsCreator,
      session_status: formIsCreator ? formSessionStatus : "idle",
      updated_at: new Date().toISOString(),
    };

    let error;

    if (editingRoom) {
      const { error: err } = await supabase
        .from("study_rooms")
        .update(payload)
        .eq("id", editingRoom.id);
      error = err;
    } else {
      const { error: err } = await supabase
        .from("study_rooms")
        .insert({
          ...payload,
          created_at: new Date().toISOString(),
        });
      error = err;
    }

    if (error) {
      toast({
        title: "Failed to save room",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: `Room ${editingRoom ? "updated" : "created"} successfully!`,
      });
      setDialogOpen(false);
      fetchCustomRooms();
    }
  };

  // Delete Custom Room
  const handleDeleteCustomRoom = async (id: string) => {
    if (!confirm("Are you sure you want to delete this custom room?")) return;

    const { error } = await supabase.from("study_rooms").delete().eq("id", id);

    if (error) {
      toast({
        title: "Failed to delete room",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Room deleted successfully",
      });
      fetchCustomRooms();
    }
  };

  const handleCopyLink = (roomId: string) => {
    const link = `${window.location.origin}/rooms/${roomId}`;
    navigator.clipboard.writeText(link);
    setCopiedId(roomId);
    setTimeout(() => setCopiedId(null), 2000);
    toast({
      title: "Link Copied!",
      description: "Room redirect link copied to clipboard.",
    });
  };

  const renderSubjectList = (level: "foundation" | "intermediate" | "final") => (
    <div className="grid gap-4 md:grid-cols-2 mt-4">
      {SUBJECT_MAPPING[level].map((subjectId) => (
        <Card key={subjectId} className="overflow-hidden border-border bg-card/50">
          <CardHeader className="pb-3 border-b border-border/50 bg-muted/30">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold truncate">
                {formatSubjectName(subjectId)}
              </CardTitle>
              <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                {level}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5" />
                Meet Link
              </label>
              <div className="flex gap-2">
                <Input
                  value={links[subjectId] || ""}
                  onChange={(e) => handleSubjectInputChange(subjectId, e.target.value)}
                  placeholder="https://meet.google.com/..."
                  className="bg-background/50"
                />
                <Button
                  size="icon"
                  onClick={() => handleUpdateSubjectLink(subjectId)}
                  disabled={savingId === subjectId}
                  className="shrink-0"
                >
                  {savingId === subjectId ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="space-y-8 max-w-5xl mx-auto p-4 md:p-8 text-foreground bg-background">
      {/* Top Header */}
      {/* <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
            <Video className="h-10 w-10 text-primary" />
            Study Rooms Administration
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Manage subject-specific Google Meet rooms and customize public or creator-led sessions.
          </p>
        </div>
        <Button variant="outline" size="lg" onClick={refreshAll} className="gap-2 shadow-sm">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div> */}

      <Tabs defaultValue="subject-rooms" className="w-full">
        {/* Primary Tabs */}
        <TabsList className="grid w-full grid-cols-2 h-14 p-1.5 bg-muted/40 border border-border rounded-xl mb-6">
          <TabsTrigger
            value="subject-rooms"
            className="text-sm font-bold uppercase tracking-wide rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300"
          >
            Subject Meet Links
          </TabsTrigger>
          <TabsTrigger
            value="custom-rooms"
            className="text-sm font-bold uppercase tracking-wide rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300"
          >
            Custom & Creator Rooms
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Subject Rooms */}
        <TabsContent value="subject-rooms" className="space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading subject links...</p>
            </div>
          ) : (
            <Tabs defaultValue="foundation" className="w-full">
              <TabsList className="grid w-full grid-cols-3 h-12 p-1 bg-muted/30 border border-border/80 rounded-lg">
                <TabsTrigger value="foundation" className="text-xs font-semibold uppercase tracking-wider">
                  Foundation
                </TabsTrigger>
                <TabsTrigger value="intermediate" className="text-xs font-semibold uppercase tracking-wider">
                  Intermediate
                </TabsTrigger>
                <TabsTrigger value="final" className="text-xs font-semibold uppercase tracking-wider">
                  Final
                </TabsTrigger>
              </TabsList>

              <TabsContent value="foundation" className="animate-in fade-in-50 duration-300">
                {renderSubjectList("foundation")}
              </TabsContent>
              <TabsContent value="intermediate" className="animate-in fade-in-50 duration-300">
                {renderSubjectList("intermediate")}
              </TabsContent>
              <TabsContent value="final" className="animate-in fade-in-50 duration-300">
                {renderSubjectList("final")}
              </TabsContent>
            </Tabs>
          )}
        </TabsContent>

        {/* Tab 2: Custom Rooms */}
        <TabsContent value="custom-rooms" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">Custom Study Sessions</h3>
            <Button
              onClick={handleAddCustomRoomClick}
              className="gap-1.5 bg-accent hover:bg-accent/90 text-white rounded-lg"
            >
              <Plus className="h-4 w-4" />
              Add Room
            </Button>
          </div>

          {customLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading custom sessions...</p>
            </div>
          ) : customRooms.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card/30 py-16 text-center shadow-sm">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted/80">
                <Globe className="h-6 w-6 text-muted-foreground" />
              </div>
              <h4 className="mt-4 text-base font-bold">No Custom Rooms Created</h4>
              <p className="mt-2 text-xs text-muted-foreground max-w-xs mx-auto">
                Create new custom study rooms or creator-led sessions that students can join from their community lobby.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden border border-border bg-card/35 rounded-xl shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border text-sm text-left">
                  <thead className="bg-muted/40 font-semibold text-muted-foreground">
                    <tr>
                      <th className="px-6 py-4">Title & Description</th>
                      <th className="px-6 py-4">Subject</th>
                      <th className="px-6 py-4">Meet Link</th>
                      <th className="px-6 py-4">Share Link</th>
                      <th className="px-6 py-4">Type</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {customRooms.map((room) => (
                      <tr key={room.id} className="hover:bg-muted/10 transition-colors">
                        <td className="px-6 py-4 max-w-xs">
                          <div className="font-bold text-foreground truncate">{room.title}</div>
                          {room.description && (
                            <div className="text-xs text-muted-foreground truncate">{room.description}</div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {room.subject ? (
                            <Badge variant="outline" className="gap-1 text-[10px]">
                              <BookOpen className="h-2.5 w-2.5 text-accent" />
                              {room.subject}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-muted-foreground max-w-[160px] truncate">
                          <a
                            href={room.meet_link || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline flex items-center gap-1"
                          >
                            {room.meet_link}
                          </a>
                        </td>
                        <td className="px-6 py-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopyLink(room.id)}
                            className="h-8 gap-1.5 text-xs text-accent border-accent/20 hover:bg-accent/5 hover:text-accent rounded-lg"
                          >
                            {copiedId === room.id ? (
                              <>
                                <Check className="h-3.5 w-3.5 text-emerald-500" />
                                Copied
                              </>
                            ) : (
                              <>
                                <Copy className="h-3.5 w-3.5" />
                                Copy Link
                              </>
                            )}
                          </Button>
                        </td>
                        <td className="px-6 py-4">
                          {room.is_creator_room ? (
                            <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/15 border-transparent gap-1 text-[10px] font-bold">
                              <Sparkles className="h-3 w-3" />
                              CREATOR
                            </Badge>
                          ) : (
                            <Badge className="bg-accent/10 text-accent hover:bg-accent/15 border-transparent gap-1 text-[10px] font-bold">
                              <Globe className="h-3 w-3" />
                              PUBLIC
                            </Badge>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {room.is_creator_room ? (
                            room.session_status === "live" ? (
                              <span className="inline-flex items-center gap-1 text-xs text-accent font-semibold">
                                <span className="h-1.5 w-1.5 rounded-full bg-accent animate-ping" />
                                Live
                              </span>
                            ) : room.session_status === "ended" ? (
                              <span className="text-xs text-destructive font-semibold">Ended</span>
                            ) : (
                              <span className="text-xs text-muted-foreground font-semibold">Idle</span>
                            )
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-accent font-semibold">
                              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                              Active
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditCustomRoomClick(room)}
                              className="h-8 w-8 text-muted-foreground hover:text-accent"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteCustomRoom(room.id)}
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add / Edit Custom Room Dialog (Ultra Compact Layout) */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md bg-card border border-border rounded-3xl shadow-xl overflow-hidden text-card-foreground">
          {/* Top Line glow */}
          <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-accent/50 to-accent" />

          <DialogHeader className="pt-2">
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
              <Video className="w-5 h-5 text-accent" />
              {editingRoom ? "Edit Study Session" : "Create Custom Session"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Configure room details to manage student learning sessions.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3.5 py-2 text-foreground">
            {/* Title */}
            <div className="space-y-1">
              <Label htmlFor="title" className="text-xs font-semibold text-muted-foreground">
                Room Title
              </Label>
              <Input
                id="title"
                placeholder="e.g. CA Inter Advanced Accounting Live Sprint"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="h-9 text-xs rounded-xl border-border focus-visible:ring-accent bg-background"
              />
            </div>

            {/* Subject Select & Meet Link in Two Columns */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="subject" className="text-xs font-semibold text-muted-foreground">
                  Subject Group
                </Label>
                <select
                  id="subject"
                  className="flex h-9 w-full rounded-xl border border-input bg-background px-3 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-accent"
                  value={formSubject}
                  onChange={(e) => setFormSubject(e.target.value)}
                >
                  {groupedSubjects.map((group) => (
                    <optgroup key={group.label} label={group.label}>
                      {group.options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="meet" className="text-xs font-semibold text-muted-foreground">
                  Google Meet Link
                </Label>
                <Input
                  id="meet"
                  placeholder="https://meet.google.com/..."
                  value={formMeetLink}
                  onChange={(e) => setFormMeetLink(e.target.value)}
                  className="h-9 text-xs rounded-xl border-border focus-visible:ring-accent bg-background"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <Label htmlFor="description" className="text-xs font-semibold text-muted-foreground">
                Short Description
              </Label>
              <Input
                id="description"
                placeholder="Briefly state topic details or study agenda..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                className="h-9 text-xs rounded-xl border-border focus-visible:ring-accent bg-background"
              />
            </div>

            {/* Creator Session Toggle & Status in Two Columns */}
            <div className="grid grid-cols-2 gap-3 items-center rounded-2xl border border-border bg-muted/15 p-3">
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                  Creator Session
                </div>
                <p className="text-[9px] text-muted-foreground leading-none">Unlock only when live</p>
              </div>
              <div className="flex justify-end">
                <Switch checked={formIsCreator} onCheckedChange={setFormIsCreator} className="scale-90" />
              </div>
            </div>

            {/* Status Dropdown (only visible when creator room is true) */}
            {formIsCreator && (
              <div className="space-y-1 animate-in slide-in-from-top-1 duration-200">
                <Label htmlFor="status" className="text-xs font-semibold text-muted-foreground">
                  Session Status
                </Label>
                <select
                  id="status"
                  className="flex h-9 w-full rounded-xl border border-input bg-background px-3 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-accent"
                  value={formSessionStatus}
                  onChange={(e) => setFormSessionStatus(e.target.value as any)}
                >
                  <option value="idle">Starting Soon (Idle)</option>
                  <option value="live">Live Now (Open for Join)</option>
                  <option value="ended">Ended (Closed)</option>
                </select>
              </div>
            )}
          </div>

          <DialogFooter className="border-t border-border pt-3 mt-1">
            <Button variant="ghost" onClick={() => setDialogOpen(false)} className="rounded-xl h-9 text-xs">
              Cancel
            </Button>
            <Button onClick={handleSaveCustomRoom} className="bg-accent hover:bg-accent/90 text-white rounded-xl h-9 text-xs">
              {editingRoom ? "Save Changes" : "Create Session"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Admin Best Practice Note */}
      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6 mt-12 shadow-sm animate-in slide-in-from-bottom-4 duration-700">
        <div className="bg-primary/10 p-4 rounded-full">
          <CheckCircle className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-foreground">Admin Best Practice</h3>
          <p className="text-muted-foreground max-w-2xl mt-1 text-base">
            These links and sessions are shared with all students. For custom public or creator sessions, make sure the host has set the Google Meet room access settings appropriately (e.g. "Open" or "Anyone can join") to minimize request approvals.
          </p>
        </div>
      </div>
    </div>
  );
}

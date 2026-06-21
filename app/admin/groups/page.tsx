"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, Image as ImageIcon } from "lucide-react";
import { Group } from "@/types/features.types";

export default function AdminGroupsPage() {
  const supabase = createClient();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [bannerImage, setBannerImage] = useState<File | null>(null);
  
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    const { data } = await supabase.from("forum_groups").select("*").order("created_at", { ascending: false });
    if (data) setGroups(data as Group[]);
    setLoading(false);
  };

  const handleImageUpload = async (file: File, folder: string) => {
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Image too large", description: "Max 5MB allowed", variant: "destructive" });
      return null;
    }
    const ext = file.name.split(".").pop();
    const path = `${folder}/${Date.now()}.${ext}`;
    const { error: uploadErr } = await supabase.storage.from("forum-images").upload(path, file);
    if (uploadErr) {
      toast({ title: "Upload failed", description: uploadErr.message, variant: "destructive" });
      return null;
    }
    const { data: urlData } = supabase.storage.from("forum-images").getPublicUrl(path);
    return urlData.publicUrl;
  };

  const handleCreateGroup = async () => {
    if (!name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }
    
    setSubmitting(true);
    let profile_image_url = null;
    let banner_image_url = null;
    
    if (profileImage) profile_image_url = await handleImageUpload(profileImage, "group-profiles");
    if (bannerImage) banner_image_url = await handleImageUpload(bannerImage, "group-banners");

    const { error } = await supabase.from("forum_groups").insert({
      name: name.trim(),
      description: description.trim() || null,
      profile_image_url,
      banner_image_url
    });

    if (error) {
      toast({ title: "Error creating group", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Group created successfully!" });
      setName("");
      setDescription("");
      setProfileImage(null);
      setBannerImage(null);
      fetchGroups();
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this group?")) return;
    const { error } = await supabase.from("forum_groups").delete().eq("id", id);
    if (error) {
      toast({ title: "Error deleting group", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Group deleted!" });
      fetchGroups();
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Forum Groups</h1>
        <p className="text-muted-foreground mt-2">Manage discussion forum groups/communities.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create New Group</CardTitle>
          <CardDescription>Add a new community for users to join and post in.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Group Name</label>
              <Input placeholder="e.g. CA Final Audit" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input placeholder="Brief description..." value={description} onChange={e => setDescription(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2"><ImageIcon className="h-4 w-4" /> Profile Image</label>
              <Input type="file" accept="image/*" onChange={e => setProfileImage(e.target.files?.[0] || null)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2"><ImageIcon className="h-4 w-4" /> Banner Image</label>
              <Input type="file" accept="image/*" onChange={e => setBannerImage(e.target.files?.[0] || null)} />
            </div>
          </div>
          <Button onClick={handleCreateGroup} disabled={submitting} className="mt-4">
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            Create Group
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Groups</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : groups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No groups created yet.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groups.map(group => (
                <div key={group.id} className="border border-border rounded-xl overflow-hidden bg-card relative">
                  <div className="h-24 w-full bg-secondary bg-cover bg-center" style={{ backgroundImage: group.banner_image_url ? `url(${group.banner_image_url})` : undefined }} />
                  <div className="p-4 pt-0 relative">
                    <div className="h-12 w-12 rounded-full border-4 border-card bg-secondary bg-cover bg-center -mt-6 mb-2 z-10 relative" style={{ backgroundImage: group.profile_image_url ? `url(${group.profile_image_url})` : undefined }} />
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-card-foreground">{group.name}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{group.description || "No description provided."}</p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(group.id)} className="text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

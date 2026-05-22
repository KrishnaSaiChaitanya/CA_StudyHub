import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
const supabase = createClient();
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Users, Globe } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { TipTapEditor } from "./TipTapEditor";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { getVoterId } from "./forumUtils";
import { Group } from "./types";

const CATEGORIES = ["Doubt", "Discussion", "Resource", "Articleship", "Exam Tips"];
const DEMO_USER_ID = "00000000-0000-0000-0000-000000000000";

export const CreatePost = ({ onBack, onSuccess, userId, initialGroupId }: { onBack: () => void, onSuccess: () => void, userId: string | null, initialGroupId?: string }) => {
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState("Discussion");
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(initialGroupId || null);
  const [posting, setPosting] = useState(false);
  const voterId = getVoterId();

  const { data: followedGroups = [] } = useQuery({
    queryKey: ["forum-followed-groups-detailed", voterId],
    queryFn: async () => {
      const { data: followerData } = await supabase.from("forum_group_followers").select("group_id").eq("user_id", voterId);
      if (!followerData || followerData.length === 0) return [];
      
      const groupIds = followerData.map(d => d.group_id);
      const { data: groups } = await supabase.from("forum_groups").select("*, forum_group_followers(count)").in("id", groupIds);
      return ((groups || []).map(g => ({
        ...g,
        follower_count: g.forum_group_followers?.[0]?.count || 0
      })) as Group[]) || [];
    }
  });

  const handleImageUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Image too large", description: "Max 5MB allowed", variant: "destructive" });
      return null;
    }
    const effectiveUserId = userId || DEMO_USER_ID;
    const ext = file.name.split(".").pop();
    const path = `${effectiveUserId}/${Date.now()}.${ext}`;
    const { error: uploadErr } = await supabase.storage.from("forum-images").upload(path, file);
    if (uploadErr) {
      toast({ title: "Image upload failed", description: uploadErr.message, variant: "destructive" });
      return null;
    }
    const { data: urlData } = supabase.storage.from("forum-images").getPublicUrl(path);
    return urlData.publicUrl;
  };

  const handleCreatePost = async () => {
    const effectiveUserId = userId || DEMO_USER_ID;
    if (!newTitle.trim() || !newContent.trim() || newContent === "<p></p>") {
      toast({ title: "Missing fields", description: "Title and content are required.", variant: "destructive" });
      return;
    }

    setPosting(true);
    const { error } = await supabase.from("forum_posts").insert({
      user_id: effectiveUserId,
      group_id: selectedGroupId,
      title: newTitle.trim(),
      content: newContent.trim(),
      category: newCategory,
    });

    if (error) {
      toast({ title: "Failed to create post", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Post created!" });
      onSuccess();
    }
    setPosting(false);
  };

  return (
    <div>
      <Button variant="ghost" size="sm" onClick={onBack} className="mb-4 gap-1.5 text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Forum
      </Button>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-xl font-bold text-card-foreground mb-6">Create a Post</h2>

        <div className="space-y-6">
          <div>
            <label className="text-sm font-semibold mb-2 flex items-center gap-2 text-card-foreground">
              <Users className="h-4 w-4 text-accent" /> Select Destination
            </label>
            <Select value={selectedGroupId || "none"} onValueChange={(val) => setSelectedGroupId(val === "none" ? null : val)}>
              <SelectTrigger className="w-full sm:w-[400px] h-auto p-3 bg-card hover:bg-secondary/30 transition-all border-border rounded-xl">
                <div className="flex items-center gap-3 text-left w-full">
                  {selectedGroupId ? (
                    (() => {
                      const selectedGroup = followedGroups.find(g => g.id === selectedGroupId);
                      if (!selectedGroup) return <Globe className="h-5 w-5 text-accent shrink-0" />;
                      return (
                        <>
                          <div className="h-8 w-8 rounded-lg bg-secondary bg-cover bg-center shrink-0 border border-border" style={{ backgroundImage: selectedGroup.profile_image_url ? `url(${selectedGroup.profile_image_url})` : undefined }}>
                            {!selectedGroup.profile_image_url && <div className="h-full w-full flex items-center justify-center text-xs font-bold text-muted-foreground">{selectedGroup.name.charAt(0)}</div>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-card-foreground truncate">{selectedGroup.name}</div>
                            <div className="text-[10px] text-muted-foreground">{selectedGroup.follower_count || 0} members</div>
                          </div>
                        </>
                      );
                    })()
                  ) : (
                    <>
                      <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                        <Globe className="h-4 w-4 text-accent" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-card-foreground">General (Public Feed)</div>
                        <div className="text-[10px] text-muted-foreground">Visible to everyone in the community</div>
                      </div>
                    </>
                  )}
                </div>
              </SelectTrigger>
              <SelectContent className="max-h-[300px] rounded-xl border border-border bg-popover shadow-lg">
                <SelectItem value="none" className="focus:bg-accent/10 focus:text-accent-foreground py-2.5 cursor-pointer">
                  <div className="flex items-center gap-3 w-full">
                    <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                      <Globe className="h-4 w-4 text-accent" />
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <div className="text-sm font-semibold">General (Public Feed)</div>
                      <div className="text-[10px] text-muted-foreground">Visible to all members, no specific group</div>
                    </div>
                  </div>
                </SelectItem>
                {followedGroups.map(g => (
                  <SelectItem key={g.id} value={g.id} className="focus:bg-accent/10 focus:text-accent-foreground py-2.5 cursor-pointer">
                    <div className="flex items-center gap-3 w-full">
                      <div className="h-8 w-8 rounded-lg bg-secondary bg-cover bg-center shrink-0 border border-border" style={{ backgroundImage: g.profile_image_url ? `url(${g.profile_image_url})` : undefined }}>
                        {!g.profile_image_url && <div className="h-full w-full flex items-center justify-center text-xs font-bold text-muted-foreground">{g.name.charAt(0)}</div>}
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <div className="text-sm font-semibold truncate">{g.name}</div>
                        <div className="text-[10px] text-muted-foreground">{g.follower_count || 0} members</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1.5">You can post to General or in any community groups you follow.</p>
          </div>

          <div>
            <label className="text-sm font-semibold mb-2 block">Category</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <Badge
                  key={c}
                  variant={newCategory === c ? "default" : "secondary"}
                  className={`cursor-pointer text-xs px-3 py-1 ${newCategory === c ? "bg-accent text-accent-foreground hover:bg-accent/90" : "hover:bg-secondary/80"}`}
                  onClick={() => setNewCategory(c)}
                >
                  {c}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold mb-2 block">Title</label>
            <Input placeholder="Enter a descriptive title..." value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="h-11" />
          </div>
          
          <div>
            <label className="text-sm font-semibold mb-2 block">Content</label>
            <TipTapEditor content={newContent} onChange={setNewContent} onImageUpload={handleImageUpload} />
          </div>

          <div className="flex justify-end pt-4">
            <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={handleCreatePost} disabled={posting}>
              {posting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {posting ? "Posting..." : "Post"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

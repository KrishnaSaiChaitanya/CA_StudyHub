import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
const supabase = createClient();
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { TipTapEditor } from "./TipTapEditor";
import { Post } from "@/types/features.types";

const CATEGORIES = ["Doubt", "Discussion", "Resource", "Articleship", "Exam Tips"];

export const EditPost = ({ post, onBack, onSuccess, userId }: { post: Post, onBack: () => void, onSuccess: () => void, userId: string | null }) => {
  const [title, setTitle] = useState(post.title);
  const [content, setContent] = useState(post.content);
  const [category, setCategory] = useState(post.category);
  const [posting, setPosting] = useState(false);

  const handleImageUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Image too large", description: "Max 5MB allowed", variant: "destructive" });
      return null;
    }
    const ext = file.name.split(".").pop();
    const path = `${userId || "00000000-0000-0000-0000-000000000000"}/${Date.now()}.${ext}`;
    const { error: uploadErr } = await supabase.storage.from("forum-images").upload(path, file);
    if (uploadErr) {
      toast({ title: "Image upload failed", description: uploadErr.message, variant: "destructive" });
      return null;
    }
    const { data: urlData } = supabase.storage.from("forum-images").getPublicUrl(path);
    return urlData.publicUrl;
  };

  const handleUpdatePost = async () => {
    if (!title.trim() || !content.trim() || content === "<p></p>") {
      toast({ title: "Missing fields", description: "Title and content are required.", variant: "destructive" });
      return;
    }

    setPosting(true);
    const { error } = await supabase.from("forum_posts").update({
      title: title.trim(),
      content: content.trim(),
      category: category,
    }).eq("id", post.id);

    if (error) {
      toast({ title: "Failed to update post", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Post updated!" });
      onSuccess();
    }
    setPosting(false);
  };

  return (
    <div>
      <Button variant="ghost" size="sm" onClick={onBack} className="mb-4 gap-1.5 text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-xl font-bold text-card-foreground mb-6">Edit Post</h2>

        <div className="space-y-6">
          <div>
            <label className="text-sm font-semibold mb-2 block">Category</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <Badge
                  key={c}
                  variant={category === c ? "default" : "secondary"}
                  className={`cursor-pointer text-xs px-3 py-1 ${category === c ? "bg-accent text-accent-foreground hover:bg-accent/90" : "hover:bg-secondary/80"}`}
                  onClick={() => setCategory(c)}
                >
                  {c}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold mb-2 block">Title</label>
            <Input placeholder="Enter a descriptive title..." value={title} onChange={(e) => setTitle(e.target.value)} className="h-11" />
          </div>
          
          <div>
            <label className="text-sm font-semibold mb-2 block">Content</label>
            <TipTapEditor content={content} onChange={setContent} onImageUpload={handleImageUpload} />
          </div>

          <div className="flex justify-end pt-4 gap-3">
            <Button variant="outline" size="lg" onClick={onBack} disabled={posting}>Cancel</Button>
            <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={handleUpdatePost} disabled={posting}>
              {posting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {posting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

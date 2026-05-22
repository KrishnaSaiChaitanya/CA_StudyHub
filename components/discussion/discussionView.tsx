import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
const supabase = createClient();
import { ForumList } from "./ForumList";
import { PostDetail } from "./PostDetail";
import { CreatePost } from "./CreatePost";
import { UserProfile } from "./UserProfile";
import { EditPost } from "./EditPost";
import { Post } from "./types";

const DiscussionForumView = ({ onBack, groupId }: { onBack: () => void, groupId?: string }) => {
  const [view, setView] = useState<"list" | "post" | "create" | "profile" | "edit">("list");
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const handlePostClick = (post: Post) => {
    setSelectedPost(post);
    setView("post");
  };

  const handleProfileClick = (uid: string) => {
    setSelectedUserId(uid);
    setView("profile");
  };

  const handleBackToList = () => {
    setSelectedPost(null);
    setSelectedUserId(null);
    setView("list");
  };

  // The post vote function could be hoisted if needed, but since we modify state in place in the children components
  // we can just pass a dummy vote function to PostDetail or implement it in PostDetail.
  // Actually, we implemented it in PostDetail so we can just pass it or handle it there. Wait, PostDetail doesn't have the full post list to update. It can just update its own post state.
  // We'll update the PostDetail to handle voting internally for that single post. Wait, we passed `onVote` to `PostDetail`.
  
  const handleDetailVote = async (postId: string, value: 1 | -1, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedPost) return;
    const { getVoterId } = await import("./forumUtils");
    const voterId = getVoterId();
    const current = selectedPost.myVote;
    const next = current === value ? 0 : value;

    let up = selectedPost.upvotes, down = selectedPost.downvotes;
    if (current === 1) up--;
    if (current === -1) down--;
    if (next === 1) up++;
    if (next === -1) down++;

    setSelectedPost({ ...selectedPost, upvotes: up, downvotes: down, myVote: next });

    if (next === 0) {
      await supabase.from("forum_post_votes").delete().eq("post_id", postId).eq("user_id", voterId);
    } else {
      await supabase.from("forum_post_votes").upsert(
        { post_id: postId, user_id: voterId, vote: next },
        { onConflict: "post_id,user_id" }
      );
    }
  };

  if (view === "create") {
    return <CreatePost onBack={handleBackToList} onSuccess={handleBackToList} userId={userId} initialGroupId={groupId} />;
  }

  if (view === "post" && selectedPost) {
    return <PostDetail post={selectedPost} userId={userId} onBack={handleBackToList} onProfileClick={handleProfileClick} onVote={handleDetailVote} />;
  }

  if (view === "edit" && selectedPost) {
    return <EditPost post={selectedPost} onBack={handleBackToList} onSuccess={handleBackToList} userId={userId} />;
  }

  if (view === "profile" && selectedUserId) {
    return <UserProfile userId={selectedUserId} currentUserId={userId} onBack={handleBackToList} onPostClick={handlePostClick} onEditClick={(post) => {
      setSelectedPost(post);
      setView("edit");
    }} />;
  }

  return (
    <ForumList
      onBack={onBack}
      onCreatePost={() => setView("create")}
      onPostClick={handlePostClick}
      onProfileClick={handleProfileClick}
      groupId={groupId}
    />
  );
};

export default DiscussionForumView;

"use client";

import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Group } from "@/components/discussion/types";
import { getVoterId } from "@/components/discussion/forumUtils";

export default function GroupsListingPage() {
  const router = useRouter();
  const supabase = createClient();
  const queryClient = useQueryClient();
  const voterId = getVoterId();

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ["forum-groups"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("forum_groups")
        .select("*, forum_group_followers(count)")
        .order("name");
      
      if (error) return [];
      
      return (data || []).map(g => ({
        ...g,
        follower_count: g.forum_group_followers?.[0]?.count || 0
      })) as Group[];
    }
  });

  const { data: followedGroups = [], refetch: refetchFollowed } = useQuery({
    queryKey: ["forum-followed-groups", voterId],
    queryFn: async () => {
      const { data } = await supabase.from("forum_group_followers").select("group_id").eq("user_id", voterId);
      return (data || []).map(d => d.group_id);
    }
  });

  const toggleFollowGroup = async (groupId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const isFollowing = followedGroups.includes(groupId);
    if (isFollowing) {
      await supabase.from("forum_group_followers").delete().eq("user_id", voterId).eq("group_id", groupId);
    } else {
      await supabase.from("forum_group_followers").insert({ user_id: voterId, group_id: groupId });
    }
    await refetchFollowed();
    queryClient.invalidateQueries({ queryKey: ["forum-posts"] });
  };

  return (
    <div className="flex-1 w-full flex flex-col min-h-[calc(100vh-4rem)] bg-background">
      <main className="container max-w-6xl mx-auto py-8 px-4 flex-1 flex flex-col">
        
        {/* Modern Header Section */}
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-8">
          <Button 
            variant="ghost" 
            onClick={() => router.back()} 
            className="w-fit pl-2 pr-4 h-9 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-all group/back"
          >
            <div className="p-1 rounded-full bg-background shadow-sm border border-border/50 group-hover/back:bg-muted transition-colors mr-2">
              <ArrowLeft className="h-3.5 w-3.5" />
            </div>
            <span className="text-sm font-medium">Back</span>
          </Button>
          
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Explore Communities
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Find and join communities of people who share your interests.
            </p>
          </div>
        </div>

        {isLoading ? (
          // Compact Skeleton Loader
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="rounded-xl border border-border/50 bg-card h-[220px] animate-pulse overflow-hidden flex flex-col">
                <div className="h-16 w-full bg-muted/60" />
                <div className="p-4 pt-0 flex-1 flex flex-col">
                  <div className="flex justify-between items-end mb-2">
                    <div className="h-12 w-12 rounded-full bg-secondary border-4 border-card -mt-5 relative z-10" />
                    <div className="h-7 w-16 bg-muted/60 rounded-full mb-1" />
                  </div>
                  <div className="h-4 bg-muted/60 rounded-md w-3/4 mt-2 mb-2" />
                  <div className="h-3 bg-muted/60 rounded-md w-1/3 mb-4" />
                  <div className="h-3 bg-muted/60 rounded-md w-full mb-1.5" />
                  <div className="h-3 bg-muted/60 rounded-md w-4/5" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Compact Reddit-Style Grid
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {groups.map(g => {
              const isFollowed = followedGroups.includes(g.id);
              
              return (
                <div 
                  key={g.id} 
                  className="group relative overflow-hidden rounded-xl border border-border/60 bg-card hover:-translate-y-1 hover:shadow-md hover:border-accent/40 transition-all duration-200 ease-out flex flex-col cursor-pointer"
                  onClick={() => router.push(`/community/forum/group/${g.id}`)}
                >
                  {/* Short Banner Image */}
                  <div className="h-16 w-full bg-muted relative overflow-hidden">
                    {g.banner_image_url ? (
                      <img 
                        src={g.banner_image_url} 
                        alt={`${g.name} banner`} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-r from-accent/20 to-accent/5" />
                    )}
                  </div>
                  
                  <div className="p-4 pt-0 flex-1 flex flex-col bg-card relative">
                    {/* Avatar & Action Row */}
                    <div className="flex justify-between items-end mb-2 relative">
                      {/* Overlapping Rounded Avatar */}
                      <div className="h-14 w-14 rounded-full border-4 border-card bg-muted shadow-sm relative z-10 overflow-hidden flex-shrink-0 -mt-5">
                        {g.profile_image_url ? (
                          <img 
                            src={g.profile_image_url} 
                            alt={g.name} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-lg font-bold text-muted-foreground bg-secondary">
                            {g.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      
                      {/* Compact Join Button */}
                      <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                        {!isFollowed ? (
                          <Button 
                            size="sm" 
                            className="h-7 px-3.5 text-[11px] bg-accent text-accent-foreground hover:bg-accent/90 rounded-full shadow-sm font-semibold transition-all"
                            onClick={(e) => toggleFollowGroup(g.id, e)}
                          >
                            Join
                          </Button>
                        ) : (
                          <Button 
                            size="sm"
                            variant="secondary"
                            className="h-7 px-3.5 text-[11px] rounded-full shadow-sm hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 border border-transparent transition-all group/btn font-semibold"
                            onClick={(e) => toggleFollowGroup(g.id, e)}
                          >
                            <span className="group-hover/btn:hidden">Joined</span>
                            <span className="hidden group-hover/btn:inline">Leave</span>
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {/* Compact Content */}
                    <div className="mt-1">
                      <h3 className="font-bold text-[15px] leading-tight text-foreground line-clamp-1 group-hover:text-accent transition-colors">
                        {g.name}
                      </h3>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {g.follower_count?.toLocaleString() || 0} members
                      </p>
                    </div>
                    
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-2.5 leading-relaxed">
                      {g.description || "A community group for CA students."}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
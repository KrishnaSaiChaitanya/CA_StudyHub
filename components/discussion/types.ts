export interface Profile {
  full_name: string | null;
}

export interface Group {
  id: string;
  name: string;
  description: string | null;
  profile_image_url?: string | null;
  banner_image_url?: string | null;
  follower_count?: number;
  created_at: string;
}

export interface Post {
  id: string;
  user_id: string;
  group_id: string | null;
  title: string;
  content: string;
  image_url: string | null;
  category: string;
  status: string;
  is_spom_observation: boolean;
  created_at: string;
  profiles: Profile;
  reply_count: number;
  upvotes: number;
  downvotes: number;
  myVote: number;
}

export interface Reply {
  id: string;
  user_id: string;
  post_id: string;
  parent_reply_id: string | null;
  content: string;
  created_at: string;
  profiles: Profile;
  replies?: Reply[]; // for nested replies
}

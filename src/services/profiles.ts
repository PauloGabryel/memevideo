import { supabase, uploadFile, STORAGE_BUCKETS } from '@/lib/supabase';
import type { Connection, Profile } from '@/types/database';

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) return null;
  return data as Profile;
}

export async function fetchProfileByUsername(username: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single();
  if (error) return null;
  return data as Profile;
}

export async function searchProfiles(query: string): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
    .limit(20);
  if (error) return [];
  return (data as Profile[]) || [];
}

export async function updateProfile(
  userId: string,
  updates: Partial<Profile>,
  avatarFile?: File
): Promise<Profile> {
  let avatarUrl = updates.avatar_url;

  if (avatarFile) {
    const path = `${userId}/${Date.now()}_avatar.${avatarFile.name.split('.').pop()}`;
    const url = await uploadFile(STORAGE_BUCKETS.AVATARS, path, avatarFile);
    if (url) avatarUrl = url;
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, avatar_url: avatarUrl, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select('*')
    .single();

  if (error) throw error;
  return data as Profile;
}

export async function getUserStats(userId: string): Promise<{
  postsCount: number;
  likesReceived: number;
  connectionsCount: number;
}> {
  const [postsResult, connectionsResult] = await Promise.all([
    supabase.from('posts').select('id', { count: 'exact' }).eq('user_id', userId).eq('status', 'published'),
    supabase
      .from('connections')
      .select('requester_id, addressee_id, status')
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
      .eq('status', 'accepted'),
  ]);

  // Get likes received on user's posts
  const { data: userPosts } = await supabase
    .from('posts')
    .select('id')
    .eq('user_id', userId);

  let likesReceived = 0;
  if (userPosts && userPosts.length > 0) {
    const postIds = userPosts.map((p: { id: string }) => p.id);
    const { count } = await supabase
      .from('post_likes')
      .select('id', { count: 'exact' })
      .in('post_id', postIds);
    likesReceived = count || 0;
  }

  const uniqueConnections = new Set(
    ((connectionsResult.data as Connection[] | null) || [])
      .map(row => [row.requester_id, row.addressee_id].sort().join('::'))
  );

  return {
    postsCount: postsResult.count || 0,
    likesReceived,
    connectionsCount: uniqueConnections.size,
  };
}

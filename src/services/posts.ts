import { supabase, uploadFile, STORAGE_BUCKETS } from '@/lib/supabase';
import type { Post } from '@/types/database';

export async function fetchFeedPosts(limit = 20, offset = 0, userId?: string): Promise<Post[]> {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      profiles!posts_user_id_fkey (*)
    `)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  
  const posts = (data as Post[]) || [];
  
  // Fetch stats for all posts in parallel
  const postsWithStats = await Promise.all(
    posts.map(async (post) => {
      const [likesResult, commentsResult, userLikedResult] = await Promise.all([
        supabase.from('post_likes').select('id', { count: 'exact' }).eq('post_id', post.id),
        supabase.from('comments').select('id', { count: 'exact' }).eq('post_id', post.id),
        userId
          ? supabase.from('post_likes').select('id').eq('post_id', post.id).eq('user_id', userId).maybeSingle()
          : Promise.resolve({ data: null, error: null }),
      ]);

      return {
        ...post,
        likes_count: likesResult.count || 0,
        comments_count: commentsResult.count || 0,
        user_liked: !!userLikedResult.data,
      };
    })
  );

  return postsWithStats;
}

export async function fetchPostWithStats(postId: string, userId?: string): Promise<Post | null> {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      profiles!posts_user_id_fkey (*)
    `)
    .eq('id', postId)
    .single();

  if (error || !data) return null;

  const [likesResult, commentsResult, userLikedResult] = await Promise.all([
    supabase.from('post_likes').select('id', { count: 'exact' }).eq('post_id', postId),
    supabase.from('comments').select('id', { count: 'exact' }).eq('post_id', postId),
    userId
      ? supabase.from('post_likes').select('id').eq('post_id', postId).eq('user_id', userId).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  return {
    ...data,
    likes_count: likesResult.count || 0,
    comments_count: commentsResult.count || 0,
    user_liked: !!userLikedResult.data,
  } as Post;
}

export async function fetchUserPosts(userId: string): Promise<Post[]> {
  const { data, error } = await supabase
    .from('posts')
    .select(`*, profiles!posts_user_id_fkey (*)`)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as Post[]) || [];
}

export async function createPost(
  post: {
    user_id: string;
    title: string;
    description: string;
    category: string;
    video_url: string;
    thumbnail_url?: string;
    status: 'published' | 'hidden';
  },
  videoFile?: File,
  thumbnailFile?: File
): Promise<Post> {
  let videoUrl = post.video_url;
  let thumbnailUrl = post.thumbnail_url;

  if (videoFile) {
    const path = `${post.user_id}/${Date.now()}_${videoFile.name}`;
    videoUrl = await uploadFile(STORAGE_BUCKETS.VIDEOS, path, videoFile);
  }

  if (thumbnailFile) {
    const path = `${post.user_id}/${Date.now()}_${thumbnailFile.name}`;
    thumbnailUrl = await uploadFile(STORAGE_BUCKETS.THUMBNAILS, path, thumbnailFile);
  }

  if (!videoUrl) {
    throw new Error('Não foi possível processar o vídeo. Verifique o arquivo e tente novamente.');
  }

  const { data, error } = await supabase
    .from('posts')
    .insert({ ...post, video_url: videoUrl, thumbnail_url: thumbnailUrl })
    .select(`*, profiles!posts_user_id_fkey (*)`)
    .single();

  if (error) throw error;
  return data as Post;
}

export async function updatePost(
  postId: string,
  updates: Partial<Post>,
  videoFile?: File,
  thumbnailFile?: File,
  userId?: string
): Promise<Post> {
  let videoUrl = updates.video_url;
  let thumbnailUrl = updates.thumbnail_url;

  if (videoFile && userId) {
    const path = `${userId}/${Date.now()}_${videoFile.name}`;
    videoUrl = await uploadFile(STORAGE_BUCKETS.VIDEOS, path, videoFile);
  }

  if (thumbnailFile && userId) {
    const path = `${userId}/${Date.now()}_${thumbnailFile.name}`;
    thumbnailUrl = await uploadFile(STORAGE_BUCKETS.THUMBNAILS, path, thumbnailFile);
  }

  const { data, error } = await supabase
    .from('posts')
    .update({ ...updates, video_url: videoUrl, thumbnail_url: thumbnailUrl, updated_at: new Date().toISOString() })
    .eq('id', postId)
    .select(`*, profiles!posts_user_id_fkey (*)`)
    .single();

  if (error) throw error;
  return data as Post;
}

export async function deletePost(postId: string): Promise<void> {
  const { error } = await supabase.from('posts').delete().eq('id', postId);
  if (error) throw error;
}

export async function toggleLike(postId: string, userId: string): Promise<boolean> {
  const { data: existing } = await supabase
    .from('post_likes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .single();

  if (existing) {
    await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', userId);
    return false;
  } else {
    await supabase.from('post_likes').insert({ post_id: postId, user_id: userId });
    return true;
  }
}

export async function getLikesCount(postId: string): Promise<number> {
  const { count } = await supabase
    .from('post_likes')
    .select('id', { count: 'exact' })
    .eq('post_id', postId);
  return count || 0;
}

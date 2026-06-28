import { supabase } from '@/lib/supabase';
import type { Comment } from '@/types/database';

export async function fetchComments(postId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from('comments')
    .select(`*, profiles!comments_user_id_fkey (*)`)
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data as Comment[]) || [];
}

export async function createComment(postId: string, userId: string, content: string): Promise<Comment> {
  const { data, error } = await supabase
    .from('comments')
    .insert({ post_id: postId, user_id: userId, content })
    .select(`*, profiles!comments_user_id_fkey (*)`)
    .single();

  if (error) throw error;
  return data as Comment;
}

export async function updateComment(commentId: string, content: string): Promise<Comment> {
  const { data, error } = await supabase
    .from('comments')
    .update({ content, updated_at: new Date().toISOString() })
    .eq('id', commentId)
    .select(`*, profiles!comments_user_id_fkey (*)`)
    .single();

  if (error) throw error;
  return data as Comment;
}

export async function deleteComment(commentId: string): Promise<void> {
  const { error } = await supabase.from('comments').delete().eq('id', commentId);
  if (error) throw error;
}

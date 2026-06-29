import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Heart, Share2, Edit, Trash2, Send, Loader2 } from 'lucide-react';
import { fetchPostWithStats, toggleLike, deletePost } from '@/services/posts';
import { fetchComments, createComment, updateComment, deleteComment } from '@/services/comments';
import { useAuth } from '@/contexts/AuthContext';
import type { Post, Comment } from '@/types/database';
import { VideoPlayer } from '@/components/posts/VideoPlayer';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, formatDateTime } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const [postData, commentsData] = await Promise.all([
          fetchPostWithStats(id, user?.id),
          fetchComments(id),
        ]);
        if (postData) {
          setPost(postData);
          setLiked(postData.user_liked || false);
          setLikesCount(postData.likes_count || 0);
        }
        setComments(commentsData);
      } catch (err) {
        console.error('Erro ao carregar post:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, user?.id]);

  // Recarregar dados quando a página ficar visível novamente
  useEffect(() => {
    if (!id) return;
    
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        try {
          const [postData, commentsData] = await Promise.all([
            fetchPostWithStats(id, user?.id),
            fetchComments(id),
          ]);
          if (postData) {
            setPost(postData);
            setLiked(postData.user_liked || false);
            setLikesCount(postData.likes_count || 0);
          }
          setComments(commentsData);
        } catch (err) {
          console.error('Erro ao recarregar post:', err);
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [id, user?.id]);

  const handleLike = async () => {
    if (!user) { navigate('/login'); return; }
    const nowLiked = !liked;
    setLiked(nowLiked);
    setLikesCount(prev => prev + (nowLiked ? 1 : -1));
    try {
      await toggleLike(post!.id, user.id);
      // Recarregar dados do servidor para garantir consistência
      const updatedPost = await fetchPostWithStats(post!.id, user.id);
      if (updatedPost) {
        setLiked(updatedPost.user_liked || false);
        setLikesCount(updatedPost.likes_count || 0);
      }
    } catch (err) {
      console.error('Erro ao curtir:', err);
      setLiked(!nowLiked);
      setLikesCount(prev => prev + (nowLiked ? -1 : 1));
      toast.error('Erro ao curtir. Tente novamente.');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Excluir esta publicação?')) return;
    try {
      await deletePost(post!.id);
      toast.success('Publicação excluída!');
      navigate('/feed');
    } catch {
      toast.error('Erro ao excluir.');
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !commentText.trim() || !post) return;
    setSubmittingComment(true);
    try {
      const comment = await createComment(post.id, user.id, commentText.trim());
      // Recarregar comentários para garantir consistência
      const updatedComments = await fetchComments(post.id);
      setComments(updatedComments);
      setCommentText('');
      toast.success('Comentário adicionado!');
    } catch (err) {
      console.error('Erro ao comentar:', err);
      toast.error('Erro ao comentar.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!editText.trim()) return;
    try {
      const updated = await updateComment(commentId, editText.trim());
      setComments(prev => prev.map(c => c.id === commentId ? { ...c, content: updated.content } : c));
      setEditingComment(null);
    } catch {
      toast.error('Erro ao editar comentário.');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Excluir comentário?')) return;
    try {
      await deleteComment(commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch {
      toast.error('Erro ao excluir comentário.');
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: post?.title, url });
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Link copiado.');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <Skeleton className="h-8 w-32 mb-6" />
        <Skeleton className="h-64 w-full mb-4 rounded-xl" />
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold mb-2">Publicação não encontrada</h2>
        <Button variant="gradient" onClick={() => navigate('/feed')}>
          Voltar ao feed
        </Button>
      </div>
    );
  }

  const isOwner = user?.id === post.user_id;
  const authorInitials = post.profiles?.display_name
    ? post.profiles.display_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      {/* Back */}
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4 gap-2">
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Button>

      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        {/* Author */}
        <div className="flex items-center justify-between p-4">
          <Link to={`/profile/${post.profiles?.username}`} className="flex items-center gap-3 group">
            <Avatar className="h-12 w-12 ring-2 ring-[#7c3aed]/20">
              <AvatarImage src={post.profiles?.avatar_url || undefined} />
              <AvatarFallback>{authorInitials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-bold group-hover:text-[#7c3aed] transition-colors">
                {post.profiles?.display_name}
              </p>
              <p className="text-xs text-muted-foreground">
                @{post.profiles?.username} · {formatDateTime(post.created_at)}
              </p>
            </div>
          </Link>
          <Badge>{post.category}</Badge>
        </div>

        {/* Title */}
        <div className="px-4 pb-3">
          <h1 className="text-xl font-black">{post.title}</h1>
          {post.description && (
            <p className="text-muted-foreground text-sm mt-1">{post.description}</p>
          )}
        </div>

        {/* Video */}
        <div className="px-4 pb-4">
          <VideoPlayer url={post.video_url} thumbnail={post.thumbnail_url} title={post.title} />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={`gap-1.5 ${liked ? 'text-[#ec4899]' : 'text-muted-foreground'} hover:text-[#ec4899]`}
            >
              <Heart className={`h-5 w-5 ${liked ? 'fill-current' : ''}`} />
              <span>{likesCount}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => commentInputRef.current?.focus()}
              className="gap-1.5 text-muted-foreground"
            >
              <span>{comments.length} comentários</span>
            </Button>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
            </Button>
            {isOwner && (
              <>
                <Button variant="ghost" size="icon" onClick={() => navigate(`/edit-post/${post.id}`)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDelete}
                  className="text-red-500 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Comments */}
      <div className="mt-6 bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="font-bold">Comentários ({comments.length})</h2>
        </div>

        {/* Comment form */}
        {user ? (
          <form onSubmit={handleComment} className="p-4 border-b border-border">
            <div className="flex gap-3">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback>
                  {profile?.display_name?.[0]?.toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <Textarea
                  ref={commentInputRef}
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  placeholder="Escreva um comentário..."
                  className="min-h-[60px] resize-none text-sm"
                  rows={2}
                />
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    size="sm"
                    variant="gradient"
                    disabled={!commentText.trim() || submittingComment}
                    className="gap-1.5"
                  >
                    {submittingComment ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Send className="h-3 w-3" />
                    )}
                    Comentar
                  </Button>
                </div>
              </div>
            </div>
          </form>
        ) : (
          <div className="p-4 border-b border-border text-center text-sm text-muted-foreground">
            <Link to="/login" className="text-[#7c3aed] hover:underline font-medium">
              Faça login
            </Link>{' '}
            para comentar
          </div>
        )}

        {/* Comments list */}
        <div className="divide-y divide-border">
          {comments.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <p className="text-sm">Nenhum comentário ainda. Seja o primeiro!</p>
            </div>
          ) : (
            comments.map(comment => {
              const commentInitials = comment.profiles?.display_name
                ? comment.profiles.display_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
                : '??';
              const isCommentOwner = user?.id === comment.user_id;

              return (
                <div key={comment.id} className="p-4">
                  <div className="flex gap-3">
                    <Link to={`/profile/${comment.profiles?.username}`}>
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarImage src={comment.profiles?.avatar_url || undefined} />
                        <AvatarFallback>{commentInitials}</AvatarFallback>
                      </Avatar>
                    </Link>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Link
                          to={`/profile/${comment.profiles?.username}`}
                          className="font-semibold text-sm hover:text-[#7c3aed] transition-colors"
                        >
                          {comment.profiles?.display_name}
                        </Link>
                        <span className="text-xs text-muted-foreground">{formatDate(comment.created_at)}</span>
                      </div>

                      {editingComment === comment.id ? (
                        <div className="space-y-2">
                          <Textarea
                            value={editText}
                            onChange={e => setEditText(e.target.value)}
                            className="min-h-[60px] text-sm resize-none"
                            rows={2}
                          />
                          <div className="flex gap-2">
                            <Button size="sm" variant="gradient" onClick={() => handleEditComment(comment.id)}>
                              Salvar
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingComment(null)}>
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm">{comment.content}</p>
                      )}

                      {isCommentOwner && editingComment !== comment.id && (
                        <div className="flex gap-2 mt-1">
                          <button
                            onClick={() => { setEditingComment(comment.id); setEditText(comment.content); }}
                            className="text-xs text-muted-foreground hover:text-[#7c3aed] transition-colors"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-xs text-muted-foreground hover:text-red-500 transition-colors"
                          >
                            Excluir
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

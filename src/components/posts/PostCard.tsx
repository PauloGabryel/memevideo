import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Send,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { fetchPostWithStats, toggleLike } from '@/services/posts';
import { useAuth } from '@/contexts/AuthContext';
import type { Post } from '@/types/database';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { VideoPlayer } from './VideoPlayer';
import { SharePostDialog } from './SharePostDialog';
import toast from 'react-hot-toast';

interface PostCardProps {
  post: Post;
  onDelete?: (postId: string) => void;
  onEdit?: (postId: string) => void;
  compact?: boolean;
}

export function PostCard({ post, onDelete, onEdit, compact = false }: PostCardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [liked, setLiked] = useState(post.user_liked || false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [likeLoading, setLikeLoading] = useState(false);

  const refreshLikeState = async () => {
    if (!user?.id) return;
    try {
      const updatedPost = await fetchPostWithStats(post.id, user.id);
      if (updatedPost) {
        setLikesCount(updatedPost.likes_count || 0);
        setLiked(updatedPost.user_liked || false);
      }
    } catch {
      // Keep the current UI state if the refresh fails.
    }
  };

  useEffect(() => {
    setLikesCount(post.likes_count || 0);
    setLiked(post.user_liked || false);
    void refreshLikeState();
  }, [post.id, post.likes_count, post.user_liked, user?.id]);

  const isOwner = user?.id === post.user_id;
  const authorInitials = post.profiles?.display_name
    ? post.profiles.display_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.error('Faça login para curtir.');
      navigate('/login');
      return;
    }
    if (likeLoading) return;
    setLikeLoading(true);

    const nowLiked = !liked;
    setLiked(nowLiked);
    setLikesCount(prev => prev + (nowLiked ? 1 : -1));

    try {
      await toggleLike(post.id, user.id);
      await refreshLikeState();
    } catch {
      setLiked(!nowLiked);
      setLikesCount(prev => prev + (nowLiked ? -1 : 1));
      toast.error('Erro ao curtir. Tente novamente.');
    } finally {
      setLikeLoading(false);
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/posts/${post.id}`;
    if (navigator.share) {
      navigator.share({ title: post.title, url });
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Link copiado.');
    }
  };

  const handleSendMessage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.error('Faça login para compartilhar.');
      navigate('/login');
      return;
    }
    const url = `${window.location.origin}/posts/${post.id}`;
    const message = `Assista a este vídeo: ${post.title}\n${post.video_url}\n${url}`;
    navigate(`/chat?message=${encodeURIComponent(message)}`);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete?.(post.id);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onEdit?.(post.id);
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow animate-fade-in">
      {/* Author */}
      <div className="flex items-center justify-between p-4 pb-3">
        <Link
          to={`/profile/${post.profiles?.username}`}
          className="flex items-center gap-3 group"
        >
          <Avatar className="h-10 w-10 ring-2 ring-[#7c3aed]/20 group-hover:ring-[#7c3aed]/50 transition-all">
            <AvatarImage src={post.profiles?.avatar_url || undefined} />
            <AvatarFallback>{authorInitials}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-sm group-hover:text-[#7c3aed] transition-colors">
              {post.profiles?.display_name || 'Usuário'}
            </p>
            <p className="text-xs text-muted-foreground">
              @{post.profiles?.username || 'user'} · {formatDate(post.created_at)}
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <Badge variant="default" className="text-xs">
            {post.category}
          </Badge>
          {post.status === 'hidden' && (
            <Badge variant="secondary" className="text-xs gap-1">
              <EyeOff className="h-3 w-3" />
              Oculto
            </Badge>
          )}
          {isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleEdit} className="gap-2">
                  <Edit className="h-4 w-4" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDelete} className="gap-2 text-red-500">
                  <Trash2 className="h-4 w-4" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Title & Description */}
      <div className="px-4 pb-3">
        <Link to={`/posts/${post.id}`}>
          <h3 className="font-bold text-base hover:text-[#7c3aed] transition-colors line-clamp-2">
            {post.title}
          </h3>
        </Link>
        {!compact && post.description && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{post.description}</p>
        )}
      </div>

      {/* Video */}
      <div className="block">
        <VideoPlayer
          url={post.video_url}
          thumbnail={post.thumbnail_url}
          title={post.title}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            className={`gap-1.5 ${liked ? 'text-[#ec4899]' : 'text-muted-foreground'} hover:text-[#ec4899]`}
          >
            <Heart
              className={`h-4 w-4 transition-transform ${liked ? 'fill-current scale-110' : ''}`}
            />
            <span className="text-sm font-medium">{likesCount}</span>
          </Button>

          <Link to={`/posts/${post.id}`}>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground hover:text-[#7c3aed]"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="text-sm font-medium">{post.comments_count || 0}</span>
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-1">
          <SharePostDialog post={post}>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground hover:text-[#7c3aed]"
              title="Compartilhar"
              type="button"
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </SharePostDialog>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSendMessage}
            className="gap-1.5 text-muted-foreground hover:text-[#7c3aed]"
            title="Enviar mensagem"
          >
            <Send className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Eye className="h-3 w-3" />
            {post.views || 0}
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Film,
  Heart,
  Users,
  Plus,
  Eye,
  EyeOff,
  TrendingUp,
  Clock,
  Edit,
  Trash2,
  LayoutDashboard,
} from 'lucide-react';
import { fetchUserPosts, deletePost } from '@/services/posts';
import { getUserStats } from '@/services/profiles';
import { useAuth } from '@/contexts/AuthContext';
import type { Post } from '@/types/database';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [stats, setStats] = useState({ postsCount: 0, likesReceived: 0, connectionsCount: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [postsData, statsData] = await Promise.all([
        fetchUserPosts(user.id),
        getUserStats(user.id),
      ]);
      setPosts(postsData);
      setStats(statsData);
      setLoading(false);
    };
    load();
  }, [user]);

  const handleDelete = async (postId: string) => {
    if (!confirm('Excluir publicação?')) return;
    try {
      await deletePost(postId);
      setPosts(prev => prev.filter(p => p.id !== postId));
      setStats(prev => ({ ...prev, postsCount: prev.postsCount - 1 }));
      toast.success('Publicação excluída!');
    } catch {
      toast.error('Erro ao excluir.');
    }
  };

  const userInitials = profile?.display_name
    ? profile.display_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const recentPosts = posts.slice(0, 6);
  const publishedCount = posts.filter(p => p.status === 'published').length;
  const hiddenCount = posts.filter(p => p.status === 'hidden').length;

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <LayoutDashboard className="h-6 w-6 text-[#7c3aed]" />
            Dashboard
          </h1>
          <p className="text-muted-foreground text-sm">Visão geral da sua conta</p>
        </div>
        <Button variant="gradient" onClick={() => navigate('/create-post')} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova publicação
        </Button>
      </div>

      {/* Profile Summary */}
      <Card className="mb-6 overflow-hidden">
        <div className="relative h-16 bg-[#7c3aed]" />
        <CardContent className="pt-14">
          <div className="relative flex items-end gap-4 mb-4">
            <div className="absolute -top-10 left-6 bg-[#020617] rounded-full p-0.5">
              <Avatar className="h-16 w-16 ring-4 ring-background">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="text-lg">{userInitials}</AvatarFallback>
              </Avatar>
            </div>
            <div className="pl-24 pb-1">
              <h2 className="font-bold text-lg">{profile?.display_name}</h2>
              <p className="text-muted-foreground text-sm">@{profile?.username}</p>
            </div>
            <div className="ml-auto pb-1">
              <Link to="/edit-profile">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Edit className="h-3.5 w-3.5" />
                  Editar
                </Button>
              </Link>
            </div>
          </div>
          {profile?.bio && (
            <p className="text-sm text-muted-foreground">{profile.bio}</p>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Film className="h-5 w-5 text-[#7c3aed]" />
                <Badge variant="default" className="text-xs">{publishedCount} pub.</Badge>
              </div>
              <div className="text-2xl font-black">{stats.postsCount}</div>
              <div className="text-xs text-muted-foreground">Total de vídeos</div>
            </CardContent>
          </Card>

          <Card className="border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Heart className="h-5 w-5 text-[#ec4899]" />
                <TrendingUp className="h-4 w-4 text-green-500" />
              </div>
              <div className="text-2xl font-black">{stats.likesReceived}</div>
              <div className="text-xs text-muted-foreground">Curtidas recebidas</div>
            </CardContent>
          </Card>

          <Card className="border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Users className="h-5 w-5 text-[#facc15]" />
              </div>
              <div className="text-2xl font-black">{stats.connectionsCount}</div>
              <div className="text-xs text-muted-foreground">Conexões</div>
            </CardContent>
          </Card>

          <Card className="border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <EyeOff className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="text-2xl font-black">{hiddenCount}</div>
              <div className="text-xs text-muted-foreground">Ocultos</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Posts */}
      <Card className="border">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Clock className="h-4 w-4 text-[#7c3aed]" />
            Últimas publicações
          </CardTitle>
          <Link to={`/profile/${profile?.username}`}>
            <Button variant="ghost" size="sm" className="text-xs">
              Ver todas
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="pt-0">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-lg" />
              ))}
            </div>
          ) : recentPosts.length === 0 ? (
            <div className="text-center py-8">
              <p className="mb-3 text-muted-foreground text-sm">
                Você ainda não publicou nada. Que tal começar agora?
              </p>
              <Button variant="gradient" onClick={() => navigate('/create-post')} className="gap-2">
                <Plus className="h-4 w-4" />
                Primeira publicação
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentPosts.map(post => (
                <div
                  key={post.id}
                  className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors"
                >
                  {/* Thumbnail */}
                  <div className="w-20 h-14 rounded-lg overflow-hidden shrink-0 bg-muted">
                    {post.thumbnail_url ? (
                      <img
                        src={post.thumbnail_url}
                        alt={post.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Film className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <Link to={`/posts/${post.id}`} className="font-semibold text-sm hover:text-[#7c3aed] transition-colors line-clamp-1">
                      {post.title}
                    </Link>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={post.status === 'published' ? 'default' : 'secondary'} className="text-xs px-1.5 py-0 h-5 gap-1">
                        {post.status === 'published' ? <Eye className="h-2.5 w-2.5" /> : <EyeOff className="h-2.5 w-2.5" />}
                        {post.status === 'published' ? 'Público' : 'Oculto'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{formatDate(post.created_at)}</span>
                    </div>
                  </div>

                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => navigate(`/edit-post/${post.id}`)}
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-red-500"
                      onClick={() => handleDelete(post.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

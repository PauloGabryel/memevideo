import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Calendar,
  Edit,
  Users,
  Film,
  Heart,
  MessageCircle,
  Laugh,
  UserPlus,
  UserMinus,
  Loader2,
} from 'lucide-react';
import { fetchProfileByUsername, getUserStats } from '@/services/profiles';
import { fetchUserPosts, deletePost } from '@/services/posts';
import { getConnectionStatus, sendConnectionRequest, removeConnectionByUsers } from '@/services/connections';
import { getOrCreateConversation } from '@/services/messages';
import { useAuth } from '@/contexts/AuthContext';
import type { Profile, Post, Connection } from '@/types/database';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { PostCard } from '@/components/posts/PostCard';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user, profile: currentProfile } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [stats, setStats] = useState({ postsCount: 0, likesReceived: 0, connectionsCount: 0 });
  const [connection, setConnection] = useState<Connection | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  const isOwnProfile = user && currentProfile?.username === username;

  useEffect(() => {
    if (!username) return;
    const load = async () => {
      const profileData = await fetchProfileByUsername(username);
      if (!profileData) {
        navigate('/feed');
        return;
      }
      setProfile(profileData);

      const [postsData, statsData] = await Promise.all([
        fetchUserPosts(profileData.id),
        getUserStats(profileData.id),
      ]);
      setPosts(postsData);
      setStats(statsData);

      if (user && user.id !== profileData.id) {
        const conn = await getConnectionStatus(user.id, profileData.id);
        setConnection(conn);
      }

      setLoading(false);
    };
    load();
  }, [username, user, navigate]);

  const handleConnect = async () => {
    if (!user || !profile) return;
    setConnecting(true);
    try {
      if (connection) {
        await removeConnectionByUsers(user.id, profile.id);
        setConnection(null);
        setStats(prev => ({
          ...prev,
          connectionsCount: connection.status === 'accepted'
            ? Math.max(0, prev.connectionsCount - 1)
            : prev.connectionsCount,
        }));
        toast.success('Conexão removida.');
      } else {
        const conn = await sendConnectionRequest(user.id, profile.id);
        setConnection(conn);
        toast.success(conn.status === 'accepted' ? 'Conexão aceita.' : 'Solicitação enviada.');
      }
    } catch {
      toast.error('Erro ao gerenciar conexão.');
    } finally {
      setConnecting(false);
    }
  };

  const handleMessage = async () => {
    if (!user || !profile) return;
    try {
      const conversation = await getOrCreateConversation(user.id, profile.id);
      navigate(`/chat?conversation=${conversation.id}`);
    } catch {
      toast.error('Erro ao abrir conversa.');
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm('Excluir publicação?')) return;
    try {
      await deletePost(postId);
      setPosts(prev => prev.filter(p => p.id !== postId));
      toast.success('Publicação excluída!');
    } catch {
      toast.error('Erro ao excluir.');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="bg-card border rounded-xl p-6 mb-6">
          <div className="flex items-start gap-4">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const userInitials = profile.display_name
    .split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const connectionLabel =
    connection?.status === 'accepted'
      ? 'Conectado'
      : connection?.status === 'pending'
      ? 'Pendente'
      : 'Conectar';

  const publishedPosts = posts.filter(p => p.status === 'published');
  const allPosts = isOwnProfile ? posts : publishedPosts;

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      {/* Profile card */}
      <div className="bg-card border border-border rounded-xl overflow-hidden mb-6">
        {/* Banner */}
      <div className="h-24 bg-[#020617] relative" />
        <div className="px-6 pb-6">
          {/* Avatar & Actions */}
          <div className="flex items-end justify-between -mt-10 mb-4">
            <div className="bg-[#7c3aed] p-0.5 rounded-full">
              <Avatar className="h-20 w-20 ring-4 ring-background">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="text-xl">{userInitials}</AvatarFallback>
              </Avatar>
            </div>

            <div className="flex gap-2">
              {isOwnProfile ? (
                <Link to="/edit-profile">
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Edit className="h-4 w-4" />
                    Editar Perfil
                  </Button>
                </Link>
              ) : user ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleMessage}
                    className="gap-1.5"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Mensagem
                  </Button>
                  <Button
                    variant={connection ? 'secondary' : 'gradient'}
                    size="sm"
                    onClick={handleConnect}
                    disabled={connecting}
                    className="gap-1.5"
                  >
                    {connecting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : connection ? (
                      <UserMinus className="h-4 w-4" />
                    ) : (
                      <UserPlus className="h-4 w-4" />
                    )}
                    {connectionLabel}
                  </Button>
                </>
              ) : null}
            </div>
          </div>

          {/* Name & bio */}
          <h1 className="text-xl font-black mb-0.5">{profile.display_name}</h1>
          <p className="text-muted-foreground text-sm mb-2">@{profile.username}</p>

          {profile.bio && (
            <p className="text-sm mb-3 leading-relaxed">{profile.bio}</p>
          )}

          {profile.humor_style && (
            <div className="flex items-center gap-1.5 mb-3">
              <Laugh className="h-4 w-4 text-[#facc15]" />
              <Badge variant="yellow" className="text-xs">{profile.humor_style}</Badge>
            </div>
          )}

          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-4">
            <Calendar className="h-3.5 w-3.5" />
            Membro desde {formatDate(profile.created_at)}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 border-t border-border pt-4">
            <div className="text-center">
              <div className="text-xl font-black text-[#7c3aed]">{stats.postsCount}</div>
              <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <Film className="h-3 w-3" /> Vídeos
              </div>
            </div>
            <div className="text-center">
              <div className="text-xl font-black text-[#ec4899]">{stats.likesReceived}</div>
              <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <Heart className="h-3 w-3" /> Curtidas
              </div>
            </div>
            <div className="text-center">
              <div className="text-xl font-black text-[#facc15]">{stats.connectionsCount}</div>
              <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <Users className="h-3 w-3" /> Conexões
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Posts */}
      <Tabs defaultValue="posts">
        <TabsList className="w-full mb-4">
          <TabsTrigger value="posts" className="flex-1">
            Publicações ({allPosts.length})
          </TabsTrigger>
          {isOwnProfile && (
            <TabsTrigger value="hidden" className="flex-1">
              Ocultos ({posts.filter(p => p.status === 'hidden').length})
            </TabsTrigger>
          )}
        </TabsList>
        <TabsContent value="posts">
          {allPosts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nenhuma publicação ainda.</p>
              {isOwnProfile && (
                <Link to="/create-post">
                  <Button variant="gradient" size="sm" className="mt-4">
                    Publicar primeiro vídeo
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {allPosts.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  onDelete={isOwnProfile ? handleDelete : undefined}
                  onEdit={isOwnProfile ? (pid) => navigate(`/edit-post/${pid}`) : undefined}
                />
              ))}
            </div>
          )}
        </TabsContent>
        {isOwnProfile && (
          <TabsContent value="hidden">
            <div className="space-y-4">
              {posts.filter(p => p.status === 'hidden').map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  onDelete={handleDelete}
                  onEdit={(pid) => navigate(`/edit-post/${pid}`)}
                />
              ))}
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

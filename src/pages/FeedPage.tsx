import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, RefreshCw, TrendingUp, Clock, Users } from 'lucide-react';
import { fetchFeedPosts, deletePost } from '@/services/posts';
import { searchProfiles } from '@/services/profiles';
import { useAuth } from '@/contexts/AuthContext';
import type { Post, Profile } from '@/types/database';
import { PostCard } from '@/components/posts/PostCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { POST_CATEGORIES } from '@/types/database';
import toast from 'react-hot-toast';

export default function FeedPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q');
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');

  const loadPosts = useCallback(async () => {
    try {
      if (searchQuery) {
        // Se há query de busca, buscar perfis e vídeos
        const [searchedProfiles] = await Promise.all([
          searchProfiles(searchQuery),
        ]);
        setProfiles(searchedProfiles);
        // Para vídeos, filtrar do feed por título/descrição
        const allPosts = await fetchFeedPosts(100, 0, user?.id);
        const filtered = allPosts.filter(post =>
          post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          post.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          post.profiles?.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setPosts(filtered);
      } else {
        // Feed normal
        setProfiles([]);
        const data = await fetchFeedPosts(30, 0, user?.id);
        setPosts(data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro ao carregar o feed.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, user?.id]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadPosts();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadPosts]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPosts();
    toast.success('Feed atualizado.');
  };

  const handleDelete = async (postId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta publicação?')) return;
    try {
      await deletePost(postId);
      setPosts(prev => prev.filter(p => p.id !== postId));
      toast.success('Publicação excluída!');
    } catch {
      toast.error('Erro ao excluir publicação.');
    }
  };

  const handleEdit = (postId: string) => {
    navigate(`/edit-post/${postId}`);
  };

  const categories = ['Todos', ...POST_CATEGORIES];

  const filteredPosts =
    selectedCategory === 'Todos'
      ? posts
      : posts.filter(p => p.category === selectedCategory);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            {searchQuery ? (
              <>
                <h1 className="text-2xl font-black flex items-center gap-2">
                  <Users className="h-6 w-6 text-[#7c3aed]" />
                  Resultados de busca
                </h1>
                <p className="text-muted-foreground text-sm">Buscando por: "{searchQuery}"</p>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-black flex items-center gap-2">
                  <TrendingUp className="h-6 w-6 text-[#7c3aed]" />
                  Feed
                </h1>
                <p className="text-muted-foreground text-sm">Os vídeos mais quentes agora</p>
              </>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
            {user && (
              <Button
                variant="gradient"
                size="sm"
                onClick={() => navigate('/create-post')}
                className="gap-1.5"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Publicar</span>
              </Button>
            )}
          </div>
        </div>

        {/* Category Filter */}
        {!searchQuery && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
            {categories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold transition ${
                  selectedCategory === cat
                    ? 'bg-[#7c3aed] border-[#7c3aed] text-white'
                    : 'bg-[#111827] border-[#2c2f3a] text-[#d1d5db] hover:bg-[#1f2937] hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Search Results - Profiles */}
        {searchQuery && profiles.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-[#7c3aed]" />
              Usuários encontrados
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {profiles.map(profile => (
                <div
                  key={profile.id}
                  onClick={() => navigate(`/profile/${profile.username}`)}
                  className="bg-card border border-border rounded-xl p-4 cursor-pointer hover:border-[#7c3aed] transition-all"
                >
                  <Avatar className="h-16 w-16 mx-auto mb-3 ring-2 ring-[#7c3aed]/20">
                    <AvatarImage src={profile.avatar_url || undefined} />
                    <AvatarFallback>{profile.display_name[0]}</AvatarFallback>
                  </Avatar>
                  <p className="font-bold text-sm text-center line-clamp-2">{profile.display_name}</p>
                  <p className="text-xs text-muted-foreground text-center">@{profile.username}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Posts */}
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-card border rounded-xl overflow-hidden">
                <div className="p-4 flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-48 w-full" />
                <div className="p-4 flex gap-4">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-16">
            <h3 className="text-xl font-bold mb-2">Nada por aqui</h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery
                ? `Nenhum resultado encontrado para "${searchQuery}".`
                : selectedCategory !== 'Todos'
                ? `Nenhum vídeo na categoria "${selectedCategory}" ainda.`
                : 'Seja o primeiro a publicar algo engraçado!'}
            </p>
            {user && !searchQuery && (
              <Button
                variant="gradient"
                onClick={() => navigate('/create-post')}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Criar primeira publicação
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPosts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                onDelete={handleDelete}
                onEdit={handleEdit}
              />
            ))}
            <div className="text-center py-6 text-muted-foreground text-sm flex items-center justify-center gap-2">
              <Clock className="h-4 w-4" />
              Você chegou ao fim do feed!
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

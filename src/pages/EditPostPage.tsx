import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Upload, Link as LinkIcon, ArrowLeft, Loader2, Film, Image as ImageIcon } from 'lucide-react';
import { fetchPostWithStats, updatePost } from '@/services/posts';
import { useAuth } from '@/contexts/AuthContext';
import { POST_CATEGORIES } from '@/types/database';
import type { Post } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import toast from 'react-hot-toast';

export default function EditPostPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const [post, setPost] = useState<Post | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState<'published' | 'hidden'>('published');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      const data = await fetchPostWithStats(id, user?.id);
      if (!data) { navigate('/feed'); return; }
      if (data.user_id !== user?.id) {
        toast.error('Você não pode editar essa publicação.');
        navigate('/feed');
        return;
      }
      setPost(data);
      setTitle(data.title);
      setDescription(data.description || '');
      setCategory(data.category);
      setStatus(data.status);
      setVideoUrl(data.video_url);
      setThumbnailUrl(data.thumbnail_url || '');
      setLoading(false);
    };
    load();
  }, [id, user?.id, navigate]);

  const handleVideoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 100 * 1024 * 1024) { toast.error('Vídeo muito grande! Máx 100MB.'); return; }
    if (!file.type.startsWith('video/')) { toast.error('Arquivo inválido.'); return; }
    setVideoFile(file);
  };

  const handleThumbnailFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Imagem muito grande! Máx 5MB.'); return; }
    if (!file.type.startsWith('image/')) { toast.error('Arquivo inválido.'); return; }
    setThumbnailFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!title.trim()) { setError('Digite o título.'); return; }
    if (!category) { setError('Selecione uma categoria.'); return; }

    setSaving(true);
    try {
      await updatePost(
        post!.id,
        {
          title: title.trim(),
          description: description.trim(),
          category,
          video_url: videoUrl,
          thumbnail_url: thumbnailUrl || null,
          status,
        },
        videoFile || undefined,
        thumbnailFile || undefined,
        user?.id
      );
      toast.success('Publicação atualizada com sucesso!');
      navigate(`/posts/${post!.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-2xl space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-[600px] w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4 gap-2">
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Button>

      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-black flex items-center gap-2">
            <Film className="h-5 w-5 text-[#7c3aed]" />
            Editar Publicação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Título do vídeo"
                maxLength={100}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Descrição..."
                rows={3}
                maxLength={500}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Categoria *</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {POST_CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as 'published' | 'hidden')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="published">Publicado</SelectItem>
                    <SelectItem value="hidden">Oculto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Video URL */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <LinkIcon className="h-3.5 w-3.5" />
                URL do Vídeo
              </Label>
              <Input
                value={videoUrl}
                onChange={e => setVideoUrl(e.target.value)}
                placeholder="https://youtube.com/... ou link direto"
              />
            </div>

            {/* Or new video file */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Upload className="h-3.5 w-3.5" />
                Ou substituir por novo arquivo
              </Label>
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                onChange={handleVideoFile}
                className="hidden"
              />
              <div
                className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-[#7c3aed] transition-colors"
                onClick={() => videoInputRef.current?.click()}
              >
                {videoFile ? (
                  <span className="text-sm text-[#7c3aed]">{videoFile.name}</span>
                ) : (
                  <span className="text-sm text-muted-foreground">Clique para selecionar vídeo</span>
                )}
              </div>
            </div>

            {/* Thumbnail */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <ImageIcon className="h-3.5 w-3.5" />
                URL da Thumbnail
              </Label>
              <Input
                value={thumbnailUrl}
                onChange={e => setThumbnailUrl(e.target.value)}
                placeholder="https://... URL da imagem de capa"
              />
              <input
                ref={thumbnailInputRef}
                type="file"
                accept="image/*"
                onChange={handleThumbnailFile}
                className="hidden"
              />
              <div
                className="border-2 border-dashed border-border rounded-lg p-3 text-center cursor-pointer hover:border-[#7c3aed] transition-colors"
                onClick={() => thumbnailInputRef.current?.click()}
              >
                {thumbnailFile ? (
                  <span className="text-sm text-[#7c3aed]">{thumbnailFile.name}</span>
                ) : (
                  <span className="text-sm text-muted-foreground">Ou fazer upload de thumbnail</span>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                variant="gradient"
                size="lg"
                className="flex-1 gap-2"
                disabled={saving}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Film className="h-4 w-4" />}
                {saving ? 'Salvando...' : 'Salvar alterações'}
              </Button>
              <Button type="button" variant="outline" size="lg" onClick={() => navigate(-1)}>
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Link as LinkIcon, ArrowLeft, Loader2, Film, Image as ImageIcon } from 'lucide-react';
import { createPost } from '@/services/posts';
import { useAuth } from '@/contexts/AuthContext';
import { POST_CATEGORIES } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import toast from 'react-hot-toast';

export default function CreatePostPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState<'published' | 'hidden'>('published');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [videoInputType, setVideoInputType] = useState<'url' | 'file'>('url');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVideoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 100 * 1024 * 1024) {
      toast.error('Vídeo muito grande! Máximo 100MB.');
      return;
    }
    if (!file.type.startsWith('video/')) {
      toast.error('Selecione um arquivo de vídeo válido.');
      return;
    }
    setVideoFile(file);
  };

  const handleThumbnailFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Imagem muito grande! Máximo 5MB.');
      return;
    }
    if (!file.type.startsWith('image/')) {
      toast.error('Selecione uma imagem válida.');
      return;
    }
    setThumbnailFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) { setError('Digite o título.'); return; }
    if (!category) { setError('Selecione uma categoria.'); return; }

    const finalVideoUrl = videoInputType === 'url' ? videoUrl : '';
    if (!finalVideoUrl && !videoFile) {
      setError('Adicione um vídeo (URL ou arquivo).');
      return;
    }

    setLoading(true);
    try {
      await createPost(
        {
          user_id: user!.id,
          title: title.trim(),
          description: description.trim(),
          category,
          video_url: finalVideoUrl,
          thumbnail_url: thumbnailUrl || undefined,
          status,
        },
        videoFile || undefined,
        thumbnailFile || undefined
      );

      toast.success('Publicação criada com sucesso!');
      navigate('/feed');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao publicar.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

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
            Nova Publicação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Título do seu meme épico"
                maxLength={100}
                required
              />
              <p className="text-xs text-muted-foreground text-right">{title.length}/100</p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Conta um pouco sobre esse vídeo..."
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground text-right">{description.length}/500</p>
            </div>

            {/* Category & Status */}
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

            {/* Video */}
            <div className="space-y-2">
              <Label>Vídeo *</Label>
              <Tabs value={videoInputType} onValueChange={v => setVideoInputType(v as 'url' | 'file')}>
                <TabsList className="w-full">
                  <TabsTrigger value="url" className="flex-1 gap-1.5">
                    <LinkIcon className="h-3.5 w-3.5" />
                    URL (YouTube, etc.)
                  </TabsTrigger>
                  <TabsTrigger value="file" className="flex-1 gap-1.5">
                    <Upload className="h-3.5 w-3.5" />
                    Upload de arquivo
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="url">
                  <Input
                    value={videoUrl}
                    onChange={e => setVideoUrl(e.target.value)}
                    placeholder="https://youtube.com/watch?v=... ou link do vídeo"
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Suporta YouTube, YouTube Shorts, Vimeo, TikTok e links diretos de MP4
                  </p>
                </TabsContent>
                <TabsContent value="file">
                  <div className="mt-2">
                    <input
                      ref={videoInputRef}
                      type="file"
                      accept="video/mp4,video/webm,video/ogg,video/quicktime"
                      onChange={handleVideoFile}
                      className="hidden"
                    />
                    <div
                      className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-[#7c3aed] transition-colors"
                      onClick={() => videoInputRef.current?.click()}
                    >
                      {videoFile ? (
                        <div className="flex items-center justify-center gap-2 text-[#7c3aed]">
                          <Film className="h-5 w-5" />
                          <span className="text-sm font-medium">{videoFile.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({(videoFile.size / 1024 / 1024).toFixed(1)}MB)
                          </span>
                        </div>
                      ) : (
                        <div>
                          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            Clique para selecionar o vídeo
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            MP4, WebM, OGG · Máx. 100MB
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Thumbnail */}
            <div className="space-y-2">
              <Label>Thumbnail (opcional)</Label>
              <Tabs defaultValue="url">
                <TabsList className="w-full">
                  <TabsTrigger value="url" className="flex-1 gap-1.5">
                    <LinkIcon className="h-3.5 w-3.5" />
                    URL da imagem
                  </TabsTrigger>
                  <TabsTrigger value="file" className="flex-1 gap-1.5">
                    <Upload className="h-3.5 w-3.5" />
                    Upload
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="url">
                  <Input
                    value={thumbnailUrl}
                    onChange={e => setThumbnailUrl(e.target.value)}
                    placeholder="https://... URL da imagem de capa"
                    className="mt-2"
                  />
                </TabsContent>
                <TabsContent value="file">
                  <div className="mt-2">
                    <input
                      ref={thumbnailInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handleThumbnailFile}
                      className="hidden"
                    />
                    <div
                      className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-[#7c3aed] transition-colors"
                      onClick={() => thumbnailInputRef.current?.click()}
                    >
                      {thumbnailFile ? (
                        <div className="flex items-center justify-center gap-2 text-[#7c3aed]">
                          <ImageIcon className="h-5 w-5" />
                          <span className="text-sm font-medium">{thumbnailFile.name}</span>
                        </div>
                      ) : (
                        <div>
                          <ImageIcon className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">Clique para selecionar</p>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                variant="gradient"
                size="lg"
                className="flex-1 gap-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Publicando...
                  </>
                ) : (
                  <>
                    <Film className="h-4 w-4" />
                    {status === 'published' ? 'Publicar agora' : 'Salvar como oculto'}
                  </>
                )}
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

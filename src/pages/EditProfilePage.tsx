import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Loader2, Save, User } from 'lucide-react';
import { updateProfile } from '@/services/profiles';
import { useAuth } from '@/contexts/AuthContext';
import { HUMOR_STYLES } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import toast from 'react-hot-toast';

export default function EditProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [humorStyle, setHumorStyle] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Pre-fill form with current profile data
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setUsername(profile.username || '');
      setBio(profile.bio || '');
      setHumorStyle(profile.humor_style || '');
      setAvatarPreview(profile.avatar_url || '');
    }
  }, [profile]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!displayName.trim()) { setError('Nome de exibição é obrigatório.'); return; }
    if (!username.trim()) { setError('Nome de usuário é obrigatório.'); return; }
    if (!/^[a-z0-9_]{3,20}$/.test(username)) {
      setError('Username deve ter 3-20 caracteres (letras minúsculas, números e _).');
      return;
    }

    setSaving(true);
    try {
      await updateProfile(
        user!.id,
        {
          display_name: displayName.trim(),
          username: username.trim(),
          bio: bio.trim() || null,
          humor_style: humorStyle || null,
          avatar_url: profile?.avatar_url || null,
        },
        avatarFile || undefined
      );

      await refreshProfile();
      toast.success('Perfil atualizado com sucesso!');
      navigate(`/profile/${username.trim()}`);
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes('duplicate key')) {
        setError('Este nome de usuário já está em uso. Escolha outro.');
      } else {
        setError('Erro ao salvar perfil. Tente novamente.');
      }
    } finally {
      setSaving(false);
    }
  };

  const userInitials = displayName
    ? displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <div className="container mx-auto px-4 py-6 max-w-lg">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4 gap-2">
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Button>

      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-black flex items-center gap-2">
            <User className="h-5 w-5 text-[#7c3aed]" />
            Editar Perfil
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Avatar */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <Avatar className="h-24 w-24 ring-4 ring-[#7c3aed]/20">
                  <AvatarImage src={avatarPreview || undefined} />
                  <AvatarFallback className="text-2xl">{userInitials}</AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute bottom-0 right-0 bg-[#7c3aed] rounded-full p-2 shadow-lg hover:opacity-90 transition-opacity"
                >
                  <Camera className="h-4 w-4 text-white" />
                </button>
              </div>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleAvatarChange}
                className="hidden"
              />
              <p className="text-xs text-muted-foreground">Clique no ícone para alterar o avatar</p>
            </div>

            {/* Display Name */}
            <div className="space-y-2">
              <Label htmlFor="displayName">Nome de exibição *</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Seu nome"
                maxLength={50}
                required
              />
            </div>

            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username">Nome de usuário *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
                <Input
                  id="username"
                  value={username}
                  onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="seu_usuario"
                  className="pl-8"
                  maxLength={20}
                  minLength={3}
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                3-20 caracteres. Apenas letras minúsculas, números e _.
              </p>
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="Conte um pouco sobre você e seu humor favorito..."
                rows={4}
                maxLength={200}
                className="min-h-[120px]"
              />
              <p className="text-xs text-muted-foreground text-right">{bio.length}/200</p>
            </div>

            {/* Humor style */}
            <div className="space-y-2">
              <Label>Estilo de humor favorito</Label>
              <Select value={humorStyle} onValueChange={setHumorStyle}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione seu estilo..." />
                </SelectTrigger>
                <SelectContent>
                  {HUMOR_STYLES.map(style => (
                    <SelectItem key={style} value={style}>{style}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                variant="gradient"
                size="lg"
                className="flex-1 gap-2"
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
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

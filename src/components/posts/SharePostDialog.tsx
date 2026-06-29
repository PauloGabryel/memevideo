import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Send } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchConversations, sendMessage } from '@/services/messages';
import type { Conversation, Message } from '@/types/database';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import toast from 'react-hot-toast';

interface SharePostDialogProps {
  post: {
    id: string;
    title: string;
    video_url: string;
  };
  children: React.ReactNode;
}

export function SharePostDialog({ post, children }: SharePostDialogProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendingTo, setSendingTo] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !user) return;

    const loadConversations = async () => {
      setLoading(true);
      try {
        const data = await fetchConversations(user.id);
        setConversations(data);
      } catch {
        toast.error('Erro ao carregar contatos.');
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
  }, [open, user]);

  const handleShare = async (conversationId: string) => {
    if (!user) return;

    setSendingTo(conversationId);
    try {
      const appUrl = `${window.location.origin}/posts/${post.id}`;
      const message = `Confira este vídeo: ${post.title}\n${post.video_url}\n${appUrl}`;
      await sendMessage(conversationId, user.id, message);
      toast.success('Vídeo compartilhado com sucesso!');
      setOpen(false);
    } catch {
      toast.error('Erro ao compartilhar.');
    } finally {
      setSendingTo(null);
    }
  };

  const handleOpenChat = () => {
    setOpen(false);
    navigate('/chat');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Compartilhar vídeo</DialogTitle>
          <DialogDescription>
            Envie esse vídeo para uma conversa existente ou abra o chat para começar uma nova.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 mt-2">
          {loading ? (
            <div className="space-y-2">
              <div className="h-12 rounded-lg bg-muted animate-pulse" />
              <div className="h-12 rounded-lg bg-muted animate-pulse" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
              Nenhum contato ainda. Abra o chat para começar uma conversa.
            </div>
          ) : (
            conversations.map(conversation => {
              const participant = conversation.participant1_id === user?.id
                ? conversation.participant2
                : conversation.participant1;

              return (
                <Button
                  key={conversation.id}
                  variant="outline"
                  className="w-full justify-start gap-3 h-auto py-3"
                  onClick={() => handleShare(conversation.id)}
                  disabled={sendingTo === conversation.id}
                >
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={participant?.avatar_url || undefined} />
                    <AvatarFallback>{participant?.display_name?.[0]?.toUpperCase() || '?'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-sm">{participant?.display_name || 'Contato'}</p>
                    <p className="text-xs text-muted-foreground">@{participant?.username || 'usuario'}</p>
                  </div>
                  <Send className="h-4 w-4" />
                </Button>
              );
            })
          )}

          <Button variant="ghost" className="w-full justify-start gap-2" onClick={handleOpenChat}>
            <MessageCircle className="h-4 w-4" />
            Abrir chat
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

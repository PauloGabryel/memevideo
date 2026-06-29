import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, MessageCircle, Send, Loader2 } from 'lucide-react';
import { fetchConversations, fetchMessages, sendMessage, markMessagesAsRead } from '@/services/messages';
import { useAuth } from '@/contexts/AuthContext';
import type { Conversation, Message } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { formatDateTime } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function ChatPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [messageText, setMessageText] = useState('');

  useEffect(() => {
    if (!user) return;

    const loadConversations = async () => {
      setLoading(true);
      try {
        const data = await fetchConversations(user.id);
        setConversations(data);
      } catch (error) {
        console.error(error);
        toast.error('Erro ao carregar conversas.');
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
  }, [user]);

  useEffect(() => {
    const conversationId = searchParams.get('conversation');
    if (conversationId) {
      setActiveConversationId(conversationId);
      return;
    }

    if (!activeConversationId && conversations.length > 0) {
      setActiveConversationId(conversations[0].id);
    }
  }, [searchParams, conversations, activeConversationId]);

  useEffect(() => {
    if (!user || !activeConversationId) return;

    const loadMessages = async () => {
      setLoadingMessages(true);
      try {
        const data = await fetchMessages(activeConversationId);
        setMessages(data);
        await markMessagesAsRead(activeConversationId, user.id);
      } catch (error) {
        console.error(error);
        toast.error('Erro ao carregar mensagens.');
      } finally {
        setLoadingMessages(false);
      }
    };

    loadMessages();
  }, [user, activeConversationId]);

  const handleSelectConversation = (conversationId: string) => {
    setActiveConversationId(conversationId);
    setSearchParams({ conversation: conversationId });
  };

  const handleSendMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || !activeConversationId || !messageText.trim()) return;

    setSending(true);
    try {
      const message = await sendMessage(activeConversationId, user.id, messageText.trim());
      setMessages(prev => [...prev, message]);
      setMessageText('');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao enviar mensagem.');
    } finally {
      setSending(false);
    }
  };

  const activeConversation = conversations.find(c => c.id === activeConversationId);
  const otherParticipant = activeConversation
    ? activeConversation.participant1_id === user?.id
      ? activeConversation.participant2
      : activeConversation.participant1
    : null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="flex items-center justify-between mb-6 gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-black flex items-center gap-2">
                <MessageCircle className="h-6 w-6 text-[#7c3aed]" />
                Chat
              </h1>
              <p className="text-muted-foreground text-sm">Minhas conversas</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          <div className="rounded-xl border border-border bg-card p-4">
            <h2 className="text-sm font-semibold mb-4">Conversas</h2>
            <div className="space-y-2">
              {loading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="h-16 rounded-xl bg-muted animate-pulse" />
                ))
              ) : conversations.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  Nenhuma conversa encontrada.
                </div>
              ) : (
                conversations.map(conversation => {
                  const participant = conversation.participant1_id === user?.id
                    ? conversation.participant2
                    : conversation.participant1;
                  return (
                    <button
                      key={conversation.id}
                      type="button"
                      onClick={() => handleSelectConversation(conversation.id)}
                      className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                        conversation.id === activeConversationId
                          ? 'border-[#7c3aed] bg-[#7c3aed]/10'
                          : 'border-transparent bg-muted hover:border-[#7c3aed] hover:bg-[#7c3aed]/5'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-sm">{participant?.display_name || 'Usuário'}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {conversation.last_message?.content || 'Sem mensagens ainda'}
                          </p>
                        </div>
                        <span className="text-[11px] text-muted-foreground">
                          {conversation.last_message_at ? formatDateTime(conversation.last_message_at) : ''}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="border-b border-border p-4">
              {activeConversation ? (
                <div>
                  <h2 className="text-lg font-bold">{otherParticipant?.display_name || 'Conversa'}</h2>
                  <p className="text-sm text-muted-foreground">{otherParticipant ? `@${otherParticipant.username}` : 'Seleciona uma conversa para começar'}</p>
                </div>
              ) : (
                <div>
                  <h2 className="text-lg font-bold">Nenhuma conversa selecionada</h2>
                  <p className="text-sm text-muted-foreground">Selecione uma conversa para ver as mensagens.</p>
                </div>
              )}
            </div>

            <div className="min-h-[320px] p-4">
              {loadingMessages ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="h-6 w-full rounded-full bg-muted animate-pulse" />
                  ))}
                </div>
              ) : activeConversation ? (
                <div className="space-y-3">
                  {messages.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhuma mensagem ainda. Envie a primeira mensagem.</p>
                  ) : (
                    messages.map(message => {
                      const isMine = message.sender_id === user?.id;
                      return (
                        <div
                          key={message.id}
                          className={`rounded-2xl p-3 text-sm ${
                            isMine ? 'ml-auto bg-[#7c3aed]/15 text-foreground' : 'bg-muted text-foreground'
                          } max-w-[85%]`}
                        >
                          <p>{message.content}</p>
                          <span className="mt-2 block text-[11px] text-muted-foreground">
                            {formatDateTime(message.created_at)}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              ) : (
                <div className="text-center py-16 text-sm text-muted-foreground">
                  Selecione uma conversa à esquerda para começar.
                </div>
              )}
            </div>

            {activeConversation && (
              <form onSubmit={handleSendMessage} className="border-t border-border p-4">
                <div className="space-y-3">
                  <Textarea
                    value={messageText}
                    onChange={e => setMessageText(e.target.value)}
                    placeholder="Escreva sua mensagem..."
                    className="min-h-[96px] resize-none"
                    rows={3}
                  />
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-muted-foreground">
                      {sending ? 'Enviando...' : 'Pressione enviar para mandar a mensagem.'}
                    </span>
                    <Button type="submit" disabled={sending || !messageText.trim()} className="gap-2">
                      {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      Enviar
                    </Button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

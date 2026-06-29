import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Check, X, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { acceptConnection, fetchPendingConnections, rejectConnection } from '@/services/connections';
import type { Connection } from '@/types/database';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import toast from 'react-hot-toast';

export default function ConnectionsPage() {
  const { user } = useAuth();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      try {
        const data = await fetchPendingConnections(user.id);
        setConnections(data);
      } catch {
        toast.error('Erro ao carregar solicitações.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user]);

  const handleAccept = async (connectionId: string) => {
    setProcessingId(connectionId);
    try {
      await acceptConnection(connectionId);
      setConnections(prev => prev.filter(conn => conn.id !== connectionId));
      toast.success('Solicitação aceita.');
    } catch {
      toast.error('Erro ao aceitar solicitação.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (connectionId: string) => {
    setProcessingId(connectionId);
    try {
      await rejectConnection(connectionId);
      setConnections(prev => prev.filter(conn => conn.id !== connectionId));
      toast.success('Solicitação rejeitada.');
    } catch {
      toast.error('Erro ao rejeitar solicitação.');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/feed">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <Users className="h-5 w-5 text-[#7c3aed]" />
            Conexões
          </h1>
          <p className="text-sm text-muted-foreground">Solicitações para seguir você</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
      ) : connections.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Nenhuma solicitação pendente no momento.
        </div>
      ) : (
        <div className="space-y-3">
          {connections.map(connection => {
            const requester = connection.requester;
            return (
              <div key={connection.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-11 w-11">
                    <AvatarImage src={requester?.avatar_url || undefined} />
                    <AvatarFallback>{requester?.display_name?.[0]?.toUpperCase() || '?'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{requester?.display_name || 'Usuário'}</p>
                    <p className="text-sm text-muted-foreground">@{requester?.username || 'usuario'}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="gradient"
                    onClick={() => handleAccept(connection.id)}
                    disabled={processingId === connection.id}
                  >
                    <Check className="mr-1 h-4 w-4" />
                    Aprovar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleReject(connection.id)}
                    disabled={processingId === connection.id}
                  >
                    <X className="mr-1 h-4 w-4" />
                    Rejeitar
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

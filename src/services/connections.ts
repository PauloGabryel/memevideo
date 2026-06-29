import { supabase } from '@/lib/supabase';
import type { Connection, Profile } from '@/types/database';

export async function fetchConnections(userId: string): Promise<Connection[]> {
  const { data, error } = await supabase
    .from('connections')
    .select(`
      *,
      requester:profiles!connections_requester_id_fkey (*),
      addressee:profiles!connections_addressee_id_fkey (*)
    `)
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
    .eq('status', 'accepted');

  if (error) throw error;
  return (data as Connection[]) || [];
}

export async function fetchPendingConnections(userId: string): Promise<Connection[]> {
  const { data, error } = await supabase
    .from('connections')
    .select(`
      *,
      requester:profiles!connections_requester_id_fkey (*)
    `)
    .eq('addressee_id', userId)
    .eq('status', 'pending');

  if (error) throw error;
  return (data as Connection[]) || [];
}

export async function getConnectionStatus(
  userId: string,
  targetId: string
): Promise<Connection | null> {
  const { data, error } = await supabase
    .from('connections')
    .select('*')
    .or(
      `and(requester_id.eq.${userId},addressee_id.eq.${targetId}),and(requester_id.eq.${targetId},addressee_id.eq.${userId})`
    )
    .order('created_at', { ascending: false });

  if (error) throw error;

  const rows = (data as Connection[]) || [];
  if (rows.length > 1) {
    const duplicateIds = rows.slice(1).map(row => row.id);
    if (duplicateIds.length > 0) {
      await supabase.from('connections').delete().in('id', duplicateIds);
    }
  }

  return rows[0] as Connection | null;
}

export async function sendConnectionRequest(
  requesterId: string,
  addresseeId: string
): Promise<Connection> {
  const existing = await getConnectionStatus(requesterId, addresseeId);
  if (existing) {
    return existing as Connection;
  }

  const { data, error } = await supabase
    .from('connections')
    .insert({ requester_id: requesterId, addressee_id: addresseeId, status: 'pending' })
    .select('*')
    .single();

  if (error) throw error;
  return data as Connection;
}

export async function acceptConnection(connectionId: string): Promise<void> {
  const { error } = await supabase
    .from('connections')
    .update({ status: 'accepted', updated_at: new Date().toISOString() })
    .eq('id', connectionId);
  if (error) throw error;
}

export async function rejectConnection(connectionId: string): Promise<void> {
  const { error } = await supabase.from('connections').delete().eq('id', connectionId);
  if (error) throw error;
}

export async function removeConnection(connectionId: string): Promise<void> {
  const { error } = await supabase.from('connections').delete().eq('id', connectionId);
  if (error) throw error;
}

export async function removeConnectionByUsers(userId: string, targetId: string): Promise<void> {
  const existing = await getConnectionStatus(userId, targetId);
  if (!existing) return;

  const { error } = await supabase.from('connections').delete().eq('id', existing.id);
  if (error) throw error;
}

export async function fetchConnectionProfiles(
  connections: Connection[],
  currentUserId: string
): Promise<Profile[]> {
  return connections.map(conn => {
    if (conn.requester_id === currentUserId) {
      return conn.addressee as Profile;
    }
    return conn.requester as Profile;
  }).filter(Boolean);
}

import { supabase } from '@/lib/supabase';
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const REQUEST_TIMEOUT_MS = 8000;

function withTimeout<T>(operation: () => Promise<T>, timeoutMs = REQUEST_TIMEOUT_MS): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  return new Promise<T>((resolve, reject) => {
    timer = setTimeout(() => reject({ status: 408, message: 'Request timed out.' }), timeoutMs);

    Promise.resolve()
      .then(operation)
      .then(value => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch(error => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

async function restRequest(path: string, method: string, body?: any, prefer = 'return=representation') {
  const doRequest = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    if (!accessToken) throw { status: 401, message: 'Not authenticated' };

    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey: SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
        Prefer: prefer,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const text = await res.text();
    let json: any = null;
    try { json = text ? JSON.parse(text) : null; } catch {}
    if (!res.ok) {
      const err: any = { status: res.status, message: json?.message || text || res.statusText };
      throw err;
    }
    return json;
  };

  return await withTimeout(() => doRequest(), REQUEST_TIMEOUT_MS);
}
async function restGetConnections(requesterId: string, addresseeId: string) {
  const orClause = `(and(requester_id.eq.${requesterId},addressee_id.eq.${addresseeId}),and(requester_id.eq.${addresseeId},addressee_id.eq.${requesterId}))`;
  const params = new URLSearchParams();
  params.set('select', '*');
  params.set('or', orClause);
  params.set('order', 'created_at.desc');
  const path = `connections?${params.toString()}`;
  return await restRequest(path, 'GET');
}

function getConnectionRowsForPair(requesterId: string, addresseeId: string): Promise<Connection[]> {
  return restGetConnections(requesterId, addresseeId) as Promise<Connection[]>;
}
import type { Connection, Profile } from '@/types/database';

function getPairKey(requesterId: string, addresseeId: string): string {
  return [requesterId, addresseeId].sort().join('::');
}

function isConnectionConflict(error: any): boolean {
  const status = error?.status ?? error?.statusCode;
  const code = error?.code;
  const message = typeof error?.message === 'string' ? error.message.toLowerCase() : '';
  return status === 409 || code === '23505' || message.includes('conflict') || message.includes('duplicate');
}

export async function fetchConnections(userId: string): Promise<Connection[]> {
  const { data, error } = await withTimeout(() =>
    supabase
      .from('connections')
      .select(`
        *,
        requester:profiles!connections_requester_id_fkey (*),
        addressee:profiles!connections_addressee_id_fkey (*)
      `)
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
  , REQUEST_TIMEOUT_MS);

  if (error) throw error;

  const rows = ((data as Connection[]) || []).filter(connection => connection.status === 'accepted');
  const rejectedPairs = new Set(
    ((data as Connection[]) || [])
      .filter(connection => connection.status === 'rejected')
      .map(connection => getPairKey(connection.requester_id, connection.addressee_id))
  );

  const seen = new Set<string>();
  return rows.filter(connection => {
    const pairKey = getPairKey(connection.requester_id, connection.addressee_id);
    if (rejectedPairs.has(pairKey) || seen.has(pairKey)) {
      return false;
    }
    seen.add(pairKey);
    return true;
  });
}

export async function fetchPendingConnections(userId: string): Promise<Connection[]> {
  const { data, error } = await withTimeout(() =>
    supabase
      .from('connections')
      .select(`
        *,
        requester:profiles!connections_requester_id_fkey (*)
      `)
      .eq('addressee_id', userId)
      .eq('status', 'pending')
  , REQUEST_TIMEOUT_MS);

  if (error) throw error;
  return (data as Connection[]) || [];
}

export async function getConnectionStatus(
  userId: string,
  targetId: string
): Promise<Connection | null> {
  try {
    const { data, error } = await withTimeout(() =>
      supabase
        .from('connections')
        .select('*')
        .or(
          `and(requester_id.eq.${userId},addressee_id.eq.${targetId}),and(requester_id.eq.${targetId},addressee_id.eq.${userId})`
        )
        .order('created_at', { ascending: false })
        .limit(20)
    , REQUEST_TIMEOUT_MS);

    if (!error) {
      const rows = (data as Connection[]) || [];
      if (rows.length > 0) {
        const pairKey = getPairKey(userId, targetId);
        const hasRejectedPair = rows.some(row => row.status === 'rejected' && getPairKey(row.requester_id, row.addressee_id) === pairKey);

        if (!hasRejectedPair) {
          const activeRows = rows.filter(row => row.status !== 'rejected');
          if (activeRows.length > 0) {
            return (activeRows.find(row => row.status === 'accepted')
              || activeRows.find(row => row.status === 'pending')
              || activeRows[0]) as Connection;
          }
        }
      }
    }
  } catch {}

  try {
    const rows = await restGetConnections(userId, targetId);
    if (!Array.isArray(rows) || rows.length === 0) return null;

    const pairKey = getPairKey(userId, targetId);
    const hasRejectedPair = rows.some(row => row.status === 'rejected' && getPairKey(row.requester_id, row.addressee_id) === pairKey);
    if (hasRejectedPair) return null;

    const activeRows = rows.filter(row => row.status !== 'rejected');
    if (activeRows.length === 0) return null;

    return (activeRows.find(row => row.status === 'accepted')
      || activeRows.find(row => row.status === 'pending')
      || activeRows[0]) as Connection;
  } catch {
    return null;
  }
}

export async function sendConnectionRequest(
  requesterId: string,
  addresseeId: string
): Promise<Connection> {
  const existing = await getConnectionStatus(requesterId, addresseeId);
  if (existing) {
    return existing as Connection;
  }

  try {
    const payload = await withTimeout(() =>
      restRequest(
        'connections?select=*',
        'POST',
        { requester_id: requesterId, addressee_id: addresseeId, status: 'pending' },
        'return=representation,resolution=ignore-duplicates'
      )
    , REQUEST_TIMEOUT_MS);

    if (Array.isArray(payload) && payload.length > 0) {
      return payload[0] as Connection;
    }

    if (payload) {
      return payload as Connection;
    }
  } catch (error: any) {
    if (!isConnectionConflict(error)) {
      throw error;
    }
  }

  const fallback = await getConnectionStatus(requesterId, addresseeId);
  if (fallback) {
    return fallback as Connection;
  }

  throw { status: 409, message: 'Connection already exists.' };
}

export async function acceptConnection(connectionId: string): Promise<void> {
  const { data: sessionData } = await supabase.auth.getSession();
  const currentUserId = sessionData?.session?.user?.id;
  if (!currentUserId) throw { status: 401, message: 'Not authenticated' };

  const { error } = await withTimeout(() =>
    supabase
      .from('connections')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', connectionId)
  , REQUEST_TIMEOUT_MS);
  if (!error) return;

  if (error && (error.status === 403 || error.status === 401)) {
    await restRequest(`connections?id=eq.${connectionId}`, 'PATCH', { status: 'accepted', updated_at: new Date().toISOString() });
    return;
  }

  throw error;
}

export async function rejectConnection(connectionId: string): Promise<void> {
  const { data: sessionData } = await supabase.auth.getSession();
  const currentUserId = sessionData?.session?.user?.id;
  if (!currentUserId) throw { status: 401, message: 'Not authenticated' };

  const { error } = await withTimeout(() =>
    supabase.from('connections').delete().eq('id', connectionId)
  , REQUEST_TIMEOUT_MS);
  if (!error) return;

  if (error && (error.status === 403 || error.status === 401)) {
    await restRequest(`connections?id=eq.${connectionId}`, 'DELETE');
    return;
  }

  throw error;
}

export async function removeConnection(connectionId: string): Promise<void> {
  const { data: sessionData } = await supabase.auth.getSession();
  const currentUserId = sessionData?.session?.user?.id;
  if (!currentUserId) throw { status: 401, message: 'Not authenticated' };

  const { error } = await withTimeout(() =>
    supabase.from('connections').delete().eq('id', connectionId)
  , REQUEST_TIMEOUT_MS);
  if (!error) return;

  if (error && (error.status === 403 || error.status === 401)) {
    await restRequest(`connections?id=eq.${connectionId}`, 'DELETE');
    return;
  }

  throw error;
}

export async function removeConnectionByUsers(userId: string, targetId: string): Promise<void> {
  const { data: sessionData } = await supabase.auth.getSession();
  const currentUserId = sessionData?.session?.user?.id;
  if (!currentUserId) throw { status: 401, message: 'Not authenticated' };
  if (currentUserId !== userId) throw { status: 403, message: 'User id does not match authenticated user' };

  // find both directions to fully remove the relationship
  const { data: rows, error: selectError } = await withTimeout(() =>
    supabase
      .from('connections')
      .select('id,status,requester_id,addressee_id')
      .or(
        `and(requester_id.eq.${userId},addressee_id.eq.${targetId}),and(requester_id.eq.${targetId},addressee_id.eq.${userId})`
      )
      .limit(50)
  , REQUEST_TIMEOUT_MS);

  if (selectError) throw selectError;
  const ids = (rows || [])
    .filter(row => row.status !== 'rejected')
    .map(row => row.id)
    .filter(Boolean);
  if (ids.length === 0) return;

  const { error } = await withTimeout(() =>
    supabase
      .from('connections')
      .update({ status: 'rejected', updated_at: new Date().toISOString() })
      .in('id', ids)
  , REQUEST_TIMEOUT_MS);

  if (!error) return;

  if (error && (error.status === 403 || error.status === 401)) {
    const quotedIds = ids.map(id => `'${id}'`).join(',');
    await restRequest(
      `connections?id=in.(${quotedIds})`,
      'PATCH',
      { status: 'rejected', updated_at: new Date().toISOString() }
    );
    return;
  }

  throw error;
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

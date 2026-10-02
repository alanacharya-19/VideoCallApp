import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

import { env } from '@/config/env';
import type {
  Backend,
  CallRecord,
  Credentials,
  FriendRequest,
  Session,
  SignUpInput,
  User,
} from '@/services/types';

/**
 * Supabase-backed implementation of the Backend interface.
 *
 * Auth: Supabase Auth (Google OAuth + email/password)
 * Database: PostgreSQL via Supabase client
 * Storage: Cloudinary for profile photos
 */

let supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (supabase == null) {
    supabase = createClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  }
  return supabase;
}

/** Maps a Supabase profile row to our User type. */
function mapUser(row: any): User {
  return {
    id: row.id,
    name: row.name ?? row.email?.split('@')[0] ?? 'User',
    email: row.email ?? '',
    isOnline: row.is_online ?? false,
    colorIndex: row.color_index ?? 0,
    photoUrl: row.photo_url ?? undefined,
  };
}

/** Upload a photo to Cloudinary and return the public URL. */
async function uploadPhoto(uri: string, userId: string): Promise<string | null> {
  if (!env.hasCloudinary) return null;

  try {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const formData = new FormData();
    formData.append('file', `data:image/jpeg;base64,${base64}`);
    formData.append('upload_preset', env.CLOUDINARY_UPLOAD_PRESET);
    formData.append('public_id', `avatars/${userId}`);
    formData.append('overwrite', 'true');

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) return null;
    const data = await response.json();
    return data.secure_url as string;
  } catch (error) {
    console.warn('Cloudinary upload failed:', error);
    return null;
  }
}

export const supabaseBackend: Backend = {
  // ─── Auth ───────────────────────────────────────────────────────────────

  async restoreSession() {
    const client = getSupabase();
    const { data, error } = await client.auth.getSession();
    if (error || !data.session) return null;

    const { data: profile } = await client
      .from('profiles')
      .select('*')
      .eq('id', data.session.user.id)
      .single();

    if (!profile) return null;

    return {
      user: mapUser(profile),
      token: data.session.access_token,
    };
  },

  async signIn({ email, password }: Credentials) {
    const client = getSupabase();
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);

    const { data: profile } = await client
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    return {
      user: profile ? mapUser(profile) : { id: data.user.id, name: email.split('@')[0], email, isOnline: true, colorIndex: 0 },
      token: data.session?.access_token ?? '',
    };
  },

  async signUp({ name, email, password }: SignUpInput) {
    const client = getSupabase();
    const { data, error } = await client.auth.signUp({ email, password });
    if (error) throw new Error(error.message);

    // Create profile
    const { data: profile } = await client
      .from('profiles')
      .insert({
        id: data.user?.id,
        name,
        email,
        color_index: Math.floor(Math.random() * 6),
      })
      .select()
      .single();

    // Sign in immediately
    await client.auth.signInWithPassword({ email, password });

    return {
      user: profile ? mapUser(profile) : { id: data.user?.id ?? '', name, email, isOnline: true, colorIndex: 0 },
      token: data.session?.access_token ?? '',
    };
  },

  async signOut() {
    const client = getSupabase();
    await client.auth.signOut();
  },

  async updateProfile(patch: Partial<Pick<User, 'name' | 'photoUrl'>>) {
    const client = getSupabase();
    const {
      data: { user },
    } = await client.auth.getUser();
    if (!user) throw new Error('Not signed in');

    const updates: any = {};
    if (patch.name) updates.name = patch.name;
    if (patch.photoUrl !== undefined) updates.photo_url = patch.photoUrl;

    const { data: profile, error } = await client
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return mapUser(profile);
  },

  /** Sign in with Google via Supabase Auth. */
  async signInWithGoogle() {
    const client = getSupabase();
    const { error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'meetnow://auth/callback',
      },
    });
    if (error) throw new Error(error.message);
  },

  /** Pick and upload a profile photo. */
  async updateProfilePhoto(userId: string): Promise<string | null> {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return null;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) return null;

    return uploadPhoto(result.assets[0].uri, userId);
  },

  // ─── Social ─────────────────────────────────────────────────────────────

  async listUsers() {
    const client = getSupabase();
    const {
      data: { user },
    } = await client.auth.getUser();
    if (!user) return [];

    const { data, error } = await client
      .from('profiles')
      .select('*')
      .neq('id', user.id);

    if (error) throw new Error(error.message);
    return (data ?? []).map(mapUser);
  },

  async listFriends() {
    const client = getSupabase();
    const {
      data: { user },
    } = await client.auth.getUser();
    if (!user) return [];

    const { data, error } = await client
      .from('friend_requests')
      .select('*, profiles!friend_requests_from_user_id_fkey(*), profiles!friend_requests_to_user_id_fkey(*)')
      .eq('status', 'accepted')
      .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`);

    if (error) throw new Error(error.message);

    const friendIds = (data ?? []).map((r: any) =>
      r.from_user_id === user.id ? r.to_user_id : r.from_user_id
    );

    if (friendIds.length === 0) return [];

    const { data: profiles } = await client
      .from('profiles')
      .select('*')
      .in('id', friendIds);

    return (profiles ?? []).map(mapUser);
  },

  async listFriendRequests() {
    const client = getSupabase();
    const {
      data: { user },
    } = await client.auth.getUser();
    if (!user) return [];

    const { data, error } = await client
      .from('friend_requests')
      .select('*')
      .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
      .eq('status', 'pending');

    if (error) throw new Error(error.message);
    return (data ?? []).map((r: any) => ({
      id: r.id,
      fromUserId: r.from_user_id,
      toUserId: r.to_user_id,
      status: r.status,
      createdAt: r.created_at,
    }));
  },

  async sendFriendRequest(toUserId: string) {
    const client = getSupabase();
    const {
      data: { user },
    } = await client.auth.getUser();
    if (!user) throw new Error('Not signed in');

    const { data, error } = await client
      .from('friend_requests')
      .insert({
        from_user_id: user.id,
        to_user_id: toUserId,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return {
      id: data.id,
      fromUserId: data.from_user_id,
      toUserId: data.to_user_id,
      status: data.status,
      createdAt: data.created_at,
    };
  },

  async acceptFriendRequest(requestId: string) {
    const client = getSupabase();
    const { error } = await client
      .from('friend_requests')
      .update({ status: 'accepted' })
      .eq('id', requestId);

    if (error) throw new Error(error.message);
  },

  async declineFriendRequest(requestId: string) {
    const client = getSupabase();
    const { error } = await client
      .from('friend_requests')
      .update({ status: 'declined' })
      .eq('id', requestId);

    if (error) throw new Error(error.message);
  },

  async removeFriend(userId: string) {
    const client = getSupabase();
    const {
      data: { user },
    } = await client.auth.getUser();
    if (!user) throw new Error('Not signed in');

    const { error } = await client
      .from('friend_requests')
      .delete()
      .eq('status', 'accepted')
      .or(
        `and(from_user_id.eq.${user.id},to_user_id.eq.${userId}),and(from_user_id.eq.${userId},to_user_id.eq.${user.id})`
      );

    if (error) throw new Error(error.message);
  },

  // ─── Calls ──────────────────────────────────────────────────────────────

  async listCallHistory() {
    const client = getSupabase();
    const {
      data: { user },
    } = await client.auth.getUser();
    if (!user) return [];

    const { data, error } = await client
      .from('call_records')
      .select('*')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })
      .limit(100);

    if (error) throw new Error(error.message);
    return (data ?? []).map((r: any) => ({
      id: r.id,
      peerId: r.peer_id,
      peerName: r.peer_name,
      peerColorIndex: r.peer_color_index,
      direction: r.direction,
      outcome: r.outcome,
      mode: r.mode,
      startedAt: r.started_at,
      durationSeconds: r.duration_seconds,
    }));
  },

  async recordCall(record: Omit<CallRecord, 'id'>) {
    const client = getSupabase();
    const {
      data: { user },
    } = await client.auth.getUser();
    if (!user) return;

    const { error } = await client.from('call_records').insert({
      user_id: user.id,
      peer_id: record.peerId,
      peer_name: record.peerName,
      peer_color_index: record.peerColorIndex,
      direction: record.direction,
      outcome: record.outcome,
      mode: record.mode,
      started_at: record.startedAt,
      duration_seconds: record.durationSeconds,
    });

    if (error) console.warn('Failed to record call:', error.message);
  },

  async clearCallHistory() {
    const client = getSupabase();
    const {
      data: { user },
    } = await client.auth.getUser();
    if (!user) return;

    const { error } = await client
      .from('call_records')
      .delete()
      .eq('user_id', user.id);

    if (error) console.warn('Failed to clear calls:', error.message);
  },
};

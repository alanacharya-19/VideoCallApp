import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

import { env } from '@/config/env';
import type {
  Backend,
  Call,
  CallRecord,
  CallStatus,
  CallType,
  Credentials,
  FriendRequest,
  Session,
  SignUpInput,
  User,
  UserSettings,
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
    username: row.username ?? '',
    bio: row.bio ?? '',
    isOnline: row.is_online ?? false,
    lastSeen: row.last_seen ?? null,
    colorIndex: row.color_index ?? 0,
    photoUrl: row.photo_url ?? null,
    createdAt: row.created_at ?? '',
  };
}

/** Maps a Supabase call row to our Call type. */
function mapCall(row: any): Call {
  return {
    id: row.id,
    callerId: row.caller_id,
    receiverId: row.receiver_id,
    channelName: row.channel_name,
    callType: row.call_type,
    status: row.status,
    startedAt: row.started_at,
    answeredAt: row.answered_at ?? null,
    endedAt: row.ended_at ?? null,
    duration: row.duration ?? 0,
    createdAt: row.created_at ?? '',
  };
}

/** Maps a Supabase user_settings row to our UserSettings type. */
function mapSettings(row: any): UserSettings {
  return {
    userId: row.user_id,
    notificationsEnabled: row.notifications_enabled ?? true,
    soundsEnabled: row.sounds_enabled ?? true,
    vibrationEnabled: row.vibration_enabled ?? true,
    audioQuality: row.audio_quality ?? 'standard',
    videoQuality: row.video_quality ?? 'standard',
    speakerDefault: row.speaker_default ?? false,
    theme: row.theme ?? 'system',
    updatedAt: row.updated_at ?? '',
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

/** Expose the Supabase client for direct access (OTP verification, etc.) */
export function getClient() {
  return getSupabase();
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
    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('Incorrect email or password. Please try again.');
      }
      if (error.message.includes('Email not confirmed')) {
        throw new Error('Please verify your email before signing in.');
      }
      throw new Error('Unable to sign in. Please try again.');
    }

    const { data: profile } = await client
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    return {
      user: profile ? mapUser(profile) : mapUser({ id: data.user.id, email, name: email.split('@')[0] }),
      token: data.session?.access_token ?? '',
    };
  },

  async signUp({ name, email, password }: SignUpInput) {
    const client = getSupabase();
    const { data, error } = await client.auth.signUp({ email, password });
    if (error) {
      if (error.message.includes('already registered')) {
        throw new Error('An account with this email already exists.');
      }
      if (error.message.includes('password')) {
        throw new Error('Password must be at least 6 characters.');
      }
      throw new Error('Unable to create account. Please try again.');
    }

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
      user: profile ? mapUser(profile) : mapUser({ id: data.user?.id ?? '', email, name }),
      token: data.session?.access_token ?? '',
    };
  },

  async signOut() {
    const client = getSupabase();
    await client.auth.signOut();
  },

  // ─── Profile ───────────────────────────────────────────────────────────

  async updateProfile(patch: Partial<Pick<User, 'name' | 'bio' | 'photoUrl' | 'username'>>) {
    const client = getSupabase();
    const {
      data: { user },
    } = await client.auth.getUser();
    if (!user) throw new Error('Not signed in');

    const updates: Record<string, string | null> = {};
    if (patch.name !== undefined) updates.name = patch.name;
    if (patch.username !== undefined) updates.username = patch.username;
    if (patch.bio !== undefined) updates.bio = patch.bio;
    if (patch.photoUrl !== undefined) updates.photo_url = patch.photoUrl;

    const { data: profile, error } = await client
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw new Error('Unable to update profile. Please try again.');
    return mapUser(profile);
  },

  async updatePassword(_currentPassword: string, newPassword: string) {
    const client = getSupabase();
    const { error } = await client.auth.updateUser({ password: newPassword });
    if (error) {
      if (error.message.includes('password')) {
        throw new Error('Password must be at least 6 characters.');
      }
      throw new Error('Unable to update password. Please try again.');
    }
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
    if (error) throw new Error('Unable to sign in with Google. Please try again.');
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

    if (error) throw new Error('Unable to load users. Please try again.');
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
      .select('*')
      .eq('status', 'accepted')
      .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`);

    if (error) throw new Error('Unable to load friends. Please try again.');

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

    if (error) throw new Error('Unable to load friend requests. Please try again.');
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

    if (error) throw new Error('Unable to send friend request. Please try again.');
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

    if (error) throw new Error('Unable to accept friend request. Please try again.');
  },

  async declineFriendRequest(requestId: string) {
    const client = getSupabase();
    const { error } = await client
      .from('friend_requests')
      .update({ status: 'declined' })
      .eq('id', requestId);

    if (error) throw new Error('Unable to decline friend request. Please try again.');
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

    if (error) throw new Error('Unable to remove friend. Please try again.');
  },

  async blockUser(userId: string) {
    const client = getSupabase();
    const {
      data: { user },
    } = await client.auth.getUser();
    if (!user) throw new Error('Not signed in');

    const { error } = await client
      .from('blocks')
      .insert({
        user_id: user.id,
        blocked_user_id: userId,
      });

    if (error) throw new Error('Unable to block user. Please try again.');
  },

  async unblockUser(userId: string) {
    const client = getSupabase();
    const {
      data: { user },
    } = await client.auth.getUser();
    if (!user) throw new Error('Not signed in');

    const { error } = await client
      .from('blocks')
      .delete()
      .eq('user_id', user.id)
      .eq('blocked_user_id', userId);

    if (error) throw new Error('Unable to unblock user. Please try again.');
  },

  async listBlockedUsers() {
    const client = getSupabase();
    const {
      data: { user },
    } = await client.auth.getUser();
    if (!user) return [];

    const { data, error } = await client
      .from('blocks')
      .select('blocked_user_id')
      .eq('user_id', user.id);

    if (error) throw new Error('Unable to load blocked users. Please try again.');

    const blockedIds = (data ?? []).map((r: any) => r.blocked_user_id);
    if (blockedIds.length === 0) return [];

    const { data: profiles } = await client
      .from('profiles')
      .select('*')
      .in('id', blockedIds);

    return (profiles ?? []).map(mapUser);
  },

  // ─── Calls ──────────────────────────────────────────────────────────────

  async createCall(receiverId: string, callType: CallType) {
    const client = getSupabase();
    const {
      data: { user },
    } = await client.auth.getUser();
    if (!user) throw new Error('Not signed in');

    const channelName = `call_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const { data, error } = await client
      .from('calls')
      .insert({
        caller_id: user.id,
        receiver_id: receiverId,
        channel_name: channelName,
        call_type: callType,
        status: 'initiating',
      })
      .select()
      .single();

    if (error) throw new Error('Unable to start call. Please try again.');
    return mapCall(data);
  },

  async getCall(callId: string) {
    const client = getSupabase();
    const { data, error } = await client
      .from('calls')
      .select('*')
      .eq('id', callId)
      .single();

    if (error || !data) return null;
    return mapCall(data);
  },

  async updateCallStatus(callId: string, status: CallStatus) {
    const client = getSupabase();
    const updates: Record<string, string> = { status };

    if (status === 'accepted') {
      updates.answered_at = new Date().toISOString();
    }

    const { data, error } = await client
      .from('calls')
      .update(updates)
      .eq('id', callId)
      .select()
      .single();

    if (error) throw new Error('Unable to update call. Please try again.');
    return mapCall(data);
  },

  async endCall(callId: string, duration: number) {
    const client = getSupabase();
    const { data, error } = await client
      .from('calls')
      .update({
        status: 'ended',
        ended_at: new Date().toISOString(),
        duration,
      })
      .eq('id', callId)
      .select()
      .single();

    if (error) throw new Error('Unable to end call. Please try again.');
    return mapCall(data);
  },

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

    if (error) throw new Error('Unable to load call history. Please try again.');
    return (data ?? []).map((r: any) => ({
      id: r.id,
      peerId: r.peer_id,
      peerName: r.peer_name,
      peerColorIndex: r.peer_color_index,
      peerPhotoUrl: r.peer_photo_url ?? null,
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
      peer_photo_url: record.peerPhotoUrl,
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

  // ─── Settings ──────────────────────────────────────────────────────────

  async getSettings() {
    const client = getSupabase();
    const {
      data: { user },
    } = await client.auth.getUser();
    if (!user) throw new Error('Not signed in');

    const { data, error } = await client
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error || !data) {
      // Return default settings
      return {
        userId: user.id,
        notificationsEnabled: true,
        soundsEnabled: true,
        vibrationEnabled: true,
        audioQuality: 'standard' as const,
        videoQuality: 'standard' as const,
        speakerDefault: false,
        theme: 'system' as const,
        updatedAt: new Date().toISOString(),
      };
    }

    return mapSettings(data);
  },

  async updateSettings(patch: Partial<Omit<UserSettings, 'userId' | 'updatedAt'>>) {
    const client = getSupabase();
    const {
      data: { user },
    } = await client.auth.getUser();
    if (!user) throw new Error('Not signed in');

    const updates: Record<string, unknown> = {};
    if (patch.notificationsEnabled !== undefined) updates.notifications_enabled = patch.notificationsEnabled;
    if (patch.soundsEnabled !== undefined) updates.sounds_enabled = patch.soundsEnabled;
    if (patch.vibrationEnabled !== undefined) updates.vibration_enabled = patch.vibrationEnabled;
    if (patch.audioQuality !== undefined) updates.audio_quality = patch.audioQuality;
    if (patch.videoQuality !== undefined) updates.video_quality = patch.videoQuality;
    if (patch.speakerDefault !== undefined) updates.speaker_default = patch.speakerDefault;
    if (patch.theme !== undefined) updates.theme = patch.theme;
    updates.updated_at = new Date().toISOString();

    const { data, error } = await client
      .from('user_settings')
      .upsert({
        user_id: user.id,
        ...updates,
      })
      .select()
      .single();

    if (error) throw new Error('Unable to update settings. Please try again.');
    return mapSettings(data);
  },

  // ─── Presence ──────────────────────────────────────────────────────────

  async setOnlineStatus(isOnline: boolean) {
    const client = getSupabase();
    const {
      data: { user },
    } = await client.auth.getUser();
    if (!user) throw new Error('Not signed in');

    const { error } = await client
      .from('profiles')
      .update({
        is_online: isOnline,
        last_seen: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) throw new Error('Unable to update online status. Please try again.');
  },
};

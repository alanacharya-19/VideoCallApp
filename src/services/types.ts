/** Domain types shared by the UI and the service layer. */

export type User = {
  id: string;
  name: string;
  email: string;
  username: string;
  bio: string;
  isOnline: boolean;
  lastSeen: string | null;
  colorIndex: number;
  photoUrl: string | null;
  createdAt: string;
};

export type Session = {
  user: User;
  token: string;
};

export type FriendRequestStatus = 'pending' | 'accepted' | 'declined';

export type FriendRequest = {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: FriendRequestStatus;
  createdAt: string;
};

export type Credentials = {
  email: string;
  password: string;
};

export function isIncoming(request: FriendRequest, userId: string) {
  return request.toUserId === userId;
}

export type SignUpInput = Credentials & { name: string };

// ─── Call Types ────────────────────────────────────────────────────────────

export type CallType = 'audio' | 'video';

export type CallStatus =
  | 'initiating'
  | 'ringing'
  | 'accepted'
  | 'rejected'
  | 'cancelled'
  | 'missed'
  | 'ended'
  | 'failed';

export type Call = {
  id: string;
  callerId: string;
  receiverId: string;
  channelName: string;
  callType: CallType;
  status: CallStatus;
  startedAt: string;
  answeredAt: string | null;
  endedAt: string | null;
  duration: number;
  createdAt: string;
};

export type CallRecord = {
  id: string;
  peerId: string;
  peerName: string;
  peerColorIndex: number;
  peerPhotoUrl: string | null;
  direction: 'outgoing' | 'incoming';
  outcome: 'completed' | 'missed';
  mode: 'audio' | 'video';
  startedAt: string;
  durationSeconds: number;
};

export type CallEvent = {
  id: string;
  callId: string;
  userId: string;
  type: 'incoming' | 'accepted' | 'rejected' | 'ended' | 'cancelled';
  payload: Record<string, unknown>;
  createdAt: string;
};

// ─── Settings ──────────────────────────────────────────────────────────────

export type UserSettings = {
  userId: string;
  notificationsEnabled: boolean;
  soundsEnabled: boolean;
  vibrationEnabled: boolean;
  audioQuality: 'standard' | 'hd';
  videoQuality: 'standard' | 'hd';
  speakerDefault: boolean;
  theme: 'light' | 'dark' | 'system';
  updatedAt: string;
};

/**
 * Everything the UI needs from a backend.
 */
export type Backend = {
  // Auth
  restoreSession(): Promise<Session | null>;
  signIn(credentials: Credentials): Promise<Session>;
  signUp(input: SignUpInput): Promise<Session>;
  signOut(): Promise<void>;

  // Profile
  updateProfile(patch: Partial<Pick<User, 'name' | 'bio' | 'photoUrl' | 'username'>>): Promise<User>;
  updatePassword(currentPassword: string, newPassword: string): Promise<void>;

  // Social
  listUsers(): Promise<User[]>;
  listFriends(): Promise<User[]>;
  listFriendRequests(): Promise<FriendRequest[]>;
  sendFriendRequest(toUserId: string): Promise<FriendRequest>;
  acceptFriendRequest(requestId: string): Promise<void>;
  declineFriendRequest(requestId: string): Promise<void>;
  removeFriend(userId: string): Promise<void>;
  blockUser(userId: string): Promise<void>;
  unblockUser(userId: string): Promise<void>;
  listBlockedUsers(): Promise<User[]>;

  // Calls
  createCall(receiverId: string, callType: CallType): Promise<Call>;
  getCall(callId: string): Promise<Call | null>;
  updateCallStatus(callId: string, status: CallStatus): Promise<Call>;
  endCall(callId: string, duration: number): Promise<Call>;
  listCallHistory(): Promise<CallRecord[]>;
  recordCall(record: Omit<CallRecord, 'id'>): Promise<void>;
  clearCallHistory(): Promise<void>;

  // Settings
  getSettings(): Promise<UserSettings>;
  updateSettings(patch: Partial<Omit<UserSettings, 'userId' | 'updatedAt'>>): Promise<UserSettings>;

  // Presence
  setOnlineStatus(isOnline: boolean): Promise<void>;

  // Auth providers
  signInWithGoogle?(): Promise<void>;
  updateProfilePhoto?(userId: string): Promise<string | null>;

  // Supabase client (for OTP, realtime, etc.)
  getClient?(): any;
};

export const CALL_TIMEOUT_MS = 30_000; // 30 seconds
export const RECONNECT_TIMEOUT_MS = 10_000; // 10 seconds

/** Domain types shared by the UI and the service layer. */

export type User = {
  id: string;
  name: string;
  email: string;
  isOnline: boolean;
  /** Index into a fixed avatar palette, so an avatar looks the same everywhere. */
  colorIndex: number;
};

export type Session = {
  user: User;
  /** Opaque access token. Never a provider app certificate. */
  token: string;
};

export type FriendRequestStatus = 'pending' | 'accepted' | 'declined';

export type FriendRequest = {
  id: string;
  /** Always the signed-in user. */
  fromUserId: string;
  toUserId: string;
  status: FriendRequestStatus;
  createdAt: string;
};

export type Credentials = {
  email: string;
  password: string;
};

/** True when the signed-in user is the recipient of the request. */
export function isIncoming(request: FriendRequest, userId: string) {
  return request.toUserId === userId;
}

export type SignUpInput = Credentials & { name: string };

export type CallOutcome = 'completed' | 'missed';

export type CallRecord = {
  id: string;
  peerId: string;
  peerName: string;
  peerColorIndex: number;
  direction: 'outgoing' | 'incoming';
  outcome: CallOutcome;
  mode: 'audio' | 'video';
  startedAt: string;
  durationSeconds: number;
};

/**
 * Everything the UI needs from a backend. Swap the implementation in
 * `src/services/index.ts` without touching a single component.
 */
export type Backend = {
  /** Restores a persisted session, or null when signed out. */
  restoreSession(): Promise<Session | null>;
  signIn(credentials: Credentials): Promise<Session>;
  signUp(input: SignUpInput): Promise<Session>;
  signOut(): Promise<void>;

  /** Updates the signed-in user's profile. */
  updateProfile(patch: Partial<Pick<User, 'name'>>): Promise<User>;

  /** Everyone who has an account, for search and discovery. */
  listUsers(): Promise<User[]>;

  /** The signed-in user's confirmed friends. */
  listFriends(): Promise<User[]>;
  /**
   * Every pending request involving the signed-in user, in both directions.
   * Split them with {@link isIncoming}.
   */
  listFriendRequests(): Promise<FriendRequest[]>;

  sendFriendRequest(toUserId: string): Promise<FriendRequest>;
  acceptFriendRequest(requestId: string): Promise<void>;
  declineFriendRequest(requestId: string): Promise<void>;
  removeFriend(userId: string): Promise<void>;

  /** Call history for the signed-in user, newest first. */
  listCallHistory(): Promise<CallRecord[]>;
  recordCall(record: Omit<CallRecord, 'id'>): Promise<void>;
  clearCallHistory(): Promise<void>;
};

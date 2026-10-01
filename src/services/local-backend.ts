import AsyncStorage from '@react-native-async-storage/async-storage';

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
 * Local implementation of {@link Backend}. It behaves like a real backend
 * (async, validated, persisted) but keeps everything on the device, so the app
 * is fully usable before the API exists. Point `src/services/index.ts` at a real
 * implementation and nothing in the UI has to change.
 */

const KEYS = {
  users: 'meetnow:users',
  requests: 'meetnow:requests',
  session: 'meetnow:session',
  calls: 'meetnow:calls',
} as const;

/** Slightly rough edges on purpose, so the UI has to handle real error cases. */
const LATENCY_MS = 250;
const AVATAR_COLORS = 6;

type StoredUser = User & { password: string };

const seedUsers: StoredUser[] = [];

function wait(ms = LATENCY_MS) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toPublic(user: StoredUser): User {
  const { password: _password, ...rest } = user;
  return rest;
}

function makeId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

/** A stand-in for a real access token. Not a credential for any provider. */
function makeToken(userId: string) {
  return `local.${userId}.${Math.random().toString(36).slice(2)}`;
}

async function readUsers(): Promise<StoredUser[]> {
  const raw = await AsyncStorage.getItem(KEYS.users);
  if (raw == null) {
    await AsyncStorage.setItem(KEYS.users, JSON.stringify(seedUsers));
    return seedUsers;
  }
  return JSON.parse(raw) as StoredUser[];
}

async function writeUsers(users: StoredUser[]) {
  await AsyncStorage.setItem(KEYS.users, JSON.stringify(users));
}

async function readRequests(): Promise<FriendRequest[]> {
  const raw = await AsyncStorage.getItem(KEYS.requests);
  return raw == null ? [] : (JSON.parse(raw) as FriendRequest[]);
}

async function writeRequests(requests: FriendRequest[]) {
  await AsyncStorage.setItem(KEYS.requests, JSON.stringify(requests));
}

async function readCalls(): Promise<CallRecord[]> {
  const raw = await AsyncStorage.getItem(KEYS.calls);
  return raw == null ? [] : (JSON.parse(raw) as CallRecord[]);
}

async function writeCalls(calls: CallRecord[]) {
  await AsyncStorage.setItem(KEYS.calls, JSON.stringify(calls));
}

async function currentUserId(): Promise<string> {
  const raw = await AsyncStorage.getItem(KEYS.session);
  if (raw == null) throw new Error('Not signed in');
  return (JSON.parse(raw) as Session).user.id;
}

function requireEmail(email: string) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Enter a valid email address');
  }
}

function requirePassword(password: string) {
  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }
}

export const localBackend: Backend = {
  async restoreSession() {
    const raw = await AsyncStorage.getItem(KEYS.session);
    if (raw == null) return null;
    const session = JSON.parse(raw) as Session;
    const users = await readUsers();
    const match = users.find((user) => user.id === session.user.id);
    // The account may have been deleted since the session was written.
    if (match == null) {
      await AsyncStorage.removeItem(KEYS.session);
      return null;
    }
    return { user: toPublic(match), token: session.token };
  },

  async signIn({ email, password }: Credentials) {
    await wait();
    requireEmail(email);

    const users = await readUsers();
    const match = users.find((user) => user.email === email.trim().toLowerCase());
    if (match == null || match.password !== password) {
      throw new Error('Incorrect email or password');
    }

    const session: Session = { user: toPublic(match), token: makeToken(match.id) };
    await AsyncStorage.setItem(KEYS.session, JSON.stringify(session));
    return session;
  },

  async signUp({ name, email, password }: SignUpInput) {
    await wait(400);
    if (name.trim().length < 2) throw new Error('Enter your name');
    requireEmail(email);
    requirePassword(password);

    const users = await readUsers();
    if (users.some((user) => user.email === email.trim().toLowerCase())) {
      throw new Error('An account with that email already exists');
    }

    const user: StoredUser = {
      id: makeId('u'),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      isOnline: true,
      colorIndex: users.length % AVATAR_COLORS,
    };
    await writeUsers([...users, user]);

    // No seed data — new accounts start with an empty directory.
    // People are discovered through search as they sign up.

    const session: Session = { user: toPublic(user), token: makeToken(user.id) };
    await AsyncStorage.setItem(KEYS.session, JSON.stringify(session));
    return session;
  },

  async signOut() {
    await AsyncStorage.removeItem(KEYS.session);
  },

  async updateProfile(patch) {
    const id = await currentUserId();
    const users = await readUsers();
    const next = users.map((user) => (user.id === id ? { ...user, ...patch } : user));
    await writeUsers(next);

    const raw = await AsyncStorage.getItem(KEYS.session);
    if (raw != null) {
      const session = JSON.parse(raw) as Session;
      const updated = { ...session, user: toPublic(next.find((user) => user.id === id)!) };
      await AsyncStorage.setItem(KEYS.session, JSON.stringify(updated));
    }
    return toPublic(next.find((user) => user.id === id)!);
  },

  async listUsers() {
    await wait(150);
    const me = await currentUserId();
    const users = await readUsers();
    return users.filter((user) => user.id !== me).map(toPublic);
  },

  async listFriends() {
    await wait(150);
    const me = await currentUserId();
    const [users, requests] = await Promise.all([readUsers(), readRequests()]);
    const friendIds = new Set(
      requests
        .filter((request) => request.status === 'accepted')
        .map((request) => (request.fromUserId === me ? request.toUserId : request.fromUserId))
    );
    return users.filter((user) => friendIds.has(user.id)).map(toPublic);
  },

  async listFriendRequests() {
    const me = await currentUserId();
    const requests = await readRequests();
    // Both directions: the UI needs outgoing ones to hide people it already
    // asked, and incoming ones to show who asked you.
    return requests.filter(
      (request) => request.fromUserId === me || request.toUserId === me
    );
  },

  async sendFriendRequest(toUserId) {
    const fromUserId = await currentUserId();
    const requests = await readRequests();

    const existing = requests.find(
      (request) =>
        request.status === 'pending' &&
        ((request.fromUserId === fromUserId && request.toUserId === toUserId) ||
          (request.fromUserId === toUserId && request.toUserId === fromUserId))
    );
    if (existing != null) throw new Error('You already have a pending request');

    const request: FriendRequest = {
      id: makeId('r'),
      fromUserId,
      toUserId,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    await writeRequests([...requests, request]);
    return request;
  },

  async acceptFriendRequest(requestId) {
    const me = await currentUserId();
    const requests = await readRequests();
    await writeRequests(
      requests.map((request) =>
        request.id === requestId && request.toUserId === me
          ? { ...request, status: 'accepted' }
          : request
      )
    );
  },

  async declineFriendRequest(requestId) {
    const me = await currentUserId();
    const requests = await readRequests();
    await writeRequests(
      requests.map((request) =>
        request.id === requestId && request.toUserId === me
          ? { ...request, status: 'declined' }
          : request
      )
    );
  },

  async removeFriend(userId) {
    const me = await currentUserId();
    const requests = await readRequests();
    await writeRequests(
      requests.filter(
        (request) =>
          !(
            request.status === 'accepted' &&
            ((request.fromUserId === me && request.toUserId === userId) ||
              (request.fromUserId === userId && request.toUserId === me))
          )
      )
    );
  },

  async listCallHistory() {
    const calls = await readCalls();
    return [...calls].sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  },

  async recordCall(record) {
    const calls = await readCalls();
    await writeCalls([{ ...record, id: makeId('c') }, ...calls].slice(0, 100));
  },

  async clearCallHistory() {
    await writeCalls([]);
  },
};



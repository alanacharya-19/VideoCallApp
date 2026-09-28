import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { useAuth } from '@/providers/auth-provider';
import { backend } from '@/services';
import { isIncoming, type CallRecord, type FriendRequest, type User } from '@/services/types';

type SocialContextValue = {
  /** Every account except your own, for search and discovery. */
  directory: User[];
  friends: User[];
  /** Requests other people sent to you. */
  incomingRequests: FriendRequest[];
  /** Call history, newest first. */
  callHistory: CallRecord[];
  loading: boolean;
  sendFriendRequest: (userId: string) => Promise<void>;
  acceptFriendRequest: (requestId: string) => Promise<void>;
  declineFriendRequest: (requestId: string) => Promise<void>;
  removeFriend: (userId: string) => Promise<void>;
  recordCall: (record: Omit<CallRecord, 'id'>) => Promise<void>;
  clearCallHistory: () => Promise<void>;
  /** The people behind an incoming request, for rendering rows. */
  requestSender: (request: FriendRequest) => User | undefined;
  isFriend: (userId: string) => boolean;
  hasPendingRequest: (userId: string) => boolean;
  refresh: () => Promise<void>;
};

const SocialContext = createContext<SocialContextValue | null>(null);

export function SocialProvider({ children }: { children: ReactNode }) {
  const { user, status } = useAuth();
  const [directory, setDirectory] = useState<User[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [callHistory, setCallHistory] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (user == null) {
      setDirectory([]);
      setFriends([]);
      setIncomingRequests([]);
      setPendingRequests([]);
      setCallHistory([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [users, friendList, requests, history] = await Promise.all([
        backend.listUsers(),
        backend.listFriends(),
        backend.listFriendRequests(),
        backend.listCallHistory(),
      ]);
      setDirectory(users);
      setFriends(friendList);
      setPendingRequests(requests.filter((request) => request.status === 'pending'));
      setIncomingRequests(
        requests.filter(
          (request) => request.status === 'pending' && isIncoming(request, user.id)
        )
      );
      setCallHistory(history);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (status === 'loading') return;
    void refresh();
  }, [status, refresh]);

  // Keep the directory in sync when presence changes elsewhere in the app.
  useEffect(() => {
    if (status !== 'signed-in') return;
    const timer = setInterval(() => void refresh(), 30_000);
    return () => clearInterval(timer);
  }, [status, refresh]);

  const sendFriendRequest = useCallback(
    async (userId: string) => {
      await backend.sendFriendRequest(userId);
      await refresh();
    },
    [refresh]
  );

  const acceptFriendRequest = useCallback(
    async (requestId: string) => {
      await backend.acceptFriendRequest(requestId);
      await refresh();
    },
    [refresh]
  );

  const declineFriendRequest = useCallback(
    async (requestId: string) => {
      await backend.declineFriendRequest(requestId);
      await refresh();
    },
    [refresh]
  );

  const removeFriend = useCallback(
    async (userId: string) => {
      await backend.removeFriend(userId);
      await refresh();
    },
    [refresh]
  );

  const recordCall = useCallback(
    async (record: Omit<CallRecord, 'id'>) => {
      await backend.recordCall(record);
      await refresh();
    },
    [refresh]
  );

  const clearCallHistory = useCallback(async () => {
    await backend.clearCallHistory();
    await refresh();
  }, [refresh]);

  const value = useMemo<SocialContextValue>(
    () => ({
      directory,
      friends,
      incomingRequests,
      callHistory,
      loading,
      sendFriendRequest,
      acceptFriendRequest,
      declineFriendRequest,
      removeFriend,
      recordCall,
      clearCallHistory,
      requestSender: (request) => directory.find((person) => person.id === request.fromUserId),
      isFriend: (userId) => friends.some((friend) => friend.id === userId),
      /** Either direction: a request you sent also hides the person. */
      hasPendingRequest: (userId) =>
        pendingRequests.some(
          (request) => request.fromUserId === userId || request.toUserId === userId
        ),
      refresh,
    }),
    [
      directory,
      friends,
      incomingRequests,
      pendingRequests,
      callHistory,
      loading,
      sendFriendRequest,
      acceptFriendRequest,
      declineFriendRequest,
      removeFriend,
      recordCall,
      clearCallHistory,
      refresh,
    ]
  );

  return <SocialContext.Provider value={value}>{children}</SocialContext.Provider>;
}

export function useSocial() {
  const value = useContext(SocialContext);
  if (value == null) throw new Error('useSocial must be used inside <SocialProvider>');
  return value;
}

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { backend } from '@/services';
import type { Call, CallStatus, CallType } from '@/services/types';
import { RealtimeService } from '@/services/realtime';
import { canTransition, isTerminalStatus } from '@/services/call-state-machine';

type CallContextValue = {
  activeCall: Call | null;
  incomingCall: Call | null;
  isCallActive: boolean;
  initiateCall: (receiverId: string, callType: CallType) => Promise<Call>;
  acceptCall: (callId: string) => Promise<void>;
  rejectCall: (callId: string) => Promise<void>;
  cancelCall: (callId: string) => Promise<void>;
  endCall: (callId: string, duration: number) => Promise<void>;
  dismissIncomingCall: () => void;
};

const CallContext = createContext<CallContextValue | null>(null);

export function CallProvider({ children }: { children: ReactNode }) {
  const [activeCall, setActiveCall] = useState<Call | null>(null);
  const [incomingCall, setIncomingCall] = useState<Call | null>(null);
  const realtimeRef = useRef<RealtimeService | null>(null);
  const activeCallIdRef = useRef<string | null>(null);

  // Setup realtime subscriptions
  useEffect(() => {
    let cancelled = false;
    let realtime: RealtimeService | null = null;

    async function setup() {
      const client = backend.getClient?.();
      if (!client || cancelled) return;

      const {
        data: { user },
      } = await client.auth.getUser();
      if (!user || cancelled) return;

    realtime = new RealtimeService(client, user.id, {
      onIncomingCall: (call) => {
        if (!cancelled) setIncomingCall(call);
      },
      onCallAccepted: (call) => {
        if (cancelled) return;
        setIncomingCall(null);
        setActiveCall(call);
        activeCallIdRef.current = call.id;
      },
      onCallRejected: (callId) => {
        if (cancelled) return;
        if (activeCallIdRef.current === callId) {
          setActiveCall(null);
          activeCallIdRef.current = null;
        }
      },
      onCallEnded: (callId) => {
        if (cancelled) return;
        if (activeCallIdRef.current === callId) {
          setActiveCall(null);
          activeCallIdRef.current = null;
        }
        setIncomingCall(null);
      },
      onCallCancelled: (callId) => {
        if (cancelled) return;
        if (activeCallIdRef.current === callId) {
          setActiveCall(null);
          activeCallIdRef.current = null;
        }
        setIncomingCall(null);
      },
    });

      realtime.subscribe();
      realtimeRef.current = realtime;
    }

    void setup();

    return () => {
      cancelled = true;
      if (realtimeRef.current) {
        realtimeRef.current.unsubscribe();
        realtimeRef.current = null;
      }
    };
  }, []);

  const initiateCall = useCallback(async (receiverId: string, callType: CallType) => {
    const call = await backend.createCall(receiverId, callType);
    activeCallIdRef.current = call.id;
    setActiveCall(call);
    return call;
  }, []);

  const acceptCall = useCallback(async (callId: string) => {
    const call = await backend.updateCallStatus(callId, 'accepted');
    setIncomingCall(null);
    setActiveCall(call);
    activeCallIdRef.current = callId;
  }, []);

  const rejectCall = useCallback(async (callId: string) => {
    await backend.updateCallStatus(callId, 'rejected');
    setIncomingCall(null);
  }, []);

  const cancelCall = useCallback(async (callId: string) => {
    await backend.updateCallStatus(callId, 'cancelled');
    setActiveCall(null);
    activeCallIdRef.current = null;
  }, []);

  const endCall = useCallback(async (callId: string, duration: number) => {
    await backend.endCall(callId, duration);
    setActiveCall(null);
    activeCallIdRef.current = null;
  }, []);

  const dismissIncomingCall = useCallback(() => {
    setIncomingCall(null);
  }, []);

  const value = useMemo<CallContextValue>(
    () => ({
      activeCall,
      incomingCall,
      isCallActive: activeCall != null,
      initiateCall,
      acceptCall,
      rejectCall,
      cancelCall,
      endCall,
      dismissIncomingCall,
    }),
    [activeCall, incomingCall, initiateCall, acceptCall, rejectCall, cancelCall, endCall, dismissIncomingCall]
  );

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
}

export function useCall() {
  const value = useContext(CallContext);
  if (value == null) throw new Error('useCall must be used inside <CallProvider>');
  return value;
}

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Call, CallEvent } from '@/services/types';

type RealtimeCallback = {
  onIncomingCall: (call: Call) => void;
  onCallAccepted: (call: Call) => void;
  onCallRejected: (callId: string) => void;
  onCallEnded: (callId: string) => void;
  onCallCancelled: (callId: string) => void;
};

/**
 * Manages Supabase Realtime subscriptions for call events.
 * Handles incoming calls, call acceptance, rejection, and termination.
 */
export class RealtimeService {
  private client: SupabaseClient;
  private userId: string;
  private callbacks: RealtimeCallback;
  private channel: any = null;
  private _isActive = false;

  constructor(client: SupabaseClient, userId: string, callbacks: RealtimeCallback) {
    this.client = client;
    this.userId = userId;
    this.callbacks = callbacks;
  }

  get isActive() {
    return this._isActive;
  }

  subscribe() {
    if (this._isActive) return;

    this.channel = this.client
      .channel(`call_events:${this.userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'call_events',
          filter: `user_id=eq.${this.userId}`,
        },
        (payload) => {
          const event = payload.new as CallEvent;
          this.handleEvent(event);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'calls',
          filter: `receiver_id=eq.${this.userId}`,
        },
        (payload) => {
          const call = payload.new as Call;
          this.handleCallUpdate(call);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'calls',
          filter: `caller_id=eq.${this.userId}`,
        },
        (payload) => {
          const call = payload.new as Call;
          this.handleCallUpdate(call);
        }
      )
      .subscribe();

    this._isActive = true;
  }

  private handleEvent(event: CallEvent) {
    switch (event.type) {
      case 'incoming':
        // Fetch full call details
        this.fetchCall(event.callId).then((call) => {
          if (call) this.callbacks.onIncomingCall(call);
        });
        break;
      case 'rejected':
        this.callbacks.onCallRejected(event.callId);
        break;
      case 'ended':
        this.callbacks.onCallEnded(event.callId);
        break;
      case 'cancelled':
        this.callbacks.onCallCancelled(event.callId);
        break;
    }
  }

  private handleCallUpdate(call: Call) {
    if (call.status === 'accepted') {
      this.callbacks.onCallAccepted(call);
    } else if (call.status === 'ended') {
      this.callbacks.onCallEnded(call.id);
    }
  }

  private async fetchCall(callId: string): Promise<Call | null> {
    const { data } = await this.client
      .from('calls')
      .select('*')
      .eq('id', callId)
      .single();
    return data as Call | null;
  }

  unsubscribe() {
    if (this.channel) {
      this.client.removeChannel(this.channel);
      this.channel = null;
    }
    this._isActive = false;
  }
}

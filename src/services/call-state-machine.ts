import type { CallStatus } from '@/services/types';

/**
 * Valid call status transitions.
 * Defines the complete call lifecycle state machine.
 */
const VALID_TRANSITIONS: Record<CallStatus, CallStatus[]> = {
  initiating: ['ringing', 'failed', 'cancelled'],
  ringing: ['accepted', 'rejected', 'missed', 'cancelled', 'failed'],
  accepted: ['ended', 'failed'],
  rejected: [],
  cancelled: [],
  missed: [],
  ended: [],
  failed: [],
};

export function canTransition(from: CallStatus, to: CallStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export function isTerminalStatus(status: CallStatus): boolean {
  return ['rejected', 'cancelled', 'missed', 'ended', 'failed'].includes(status);
}

export function isActiveStatus(status: CallStatus): boolean {
  return ['initiating', 'ringing', 'accepted'].includes(status);
}

export function getCallTimeoutMs(): number {
  return 30_000; // 30 seconds
}

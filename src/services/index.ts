import { localBackend } from '@/services/local-backend';
import type { Backend } from '@/services/types';

/**
 * The single place the app decides where data comes from.
 *
 * Today that is a local, on-device backend so the whole product works offline.
 * When the real API is ready, swap this line for the remote implementation —
 * every screen and provider keeps working unchanged.
 */
export const backend: Backend = localBackend;

export { DEMO_PASSWORD } from '@/services/local-backend';
export * from '@/services/types';

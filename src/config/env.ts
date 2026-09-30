/**
 * Single place where the app reads configuration from the environment.
 *
 * Values come from `.env` (gitignored). `EXPO_PUBLIC_*` variables are inlined
 * into the bundle by Metro, so only ever expose short-lived, client-safe
 * values here — see `.env.example`.
 */

const agoraAppId = process.env.EXPO_PUBLIC_AGORA_APP_ID ?? '';
const agoraToken = process.env.EXPO_PUBLIC_AGORA_TOKEN ?? '';

// Legacy support for old env var names
const callAppId = process.env.EXPO_PUBLIC_CALL_APP_ID ?? '';
const callTempToken = process.env.EXPO_PUBLIC_CALL_TEMP_TOKEN ?? '';

if (__DEV__ && !agoraAppId && !callAppId) {
  console.warn(
    '[env] EXPO_PUBLIC_AGORA_APP_ID is missing. Copy .env.example to .env and fill it in.'
  );
}

export const env = {
  /** Agora App ID for video calling. */
  AGORA_APP_ID: agoraAppId || callAppId,
  /** Agora temporary token for local development. Never ship a long-lived one. */
  AGORA_TOKEN: agoraToken || callTempToken,
  /** Legacy: App ID issued by the video call provider. */
  callAppId: callAppId || agoraAppId,
  /** Legacy: Short-lived token for local development. */
  callTempToken: callTempToken || agoraToken,
  /** True once both call credentials are present. */
  get hasCallCredentials() {
    return (agoraAppId || callAppId).length > 0 && (agoraToken || callTempToken).length > 0;
  },
} as const;

/**
 * Single place where the app reads configuration from the environment.
 *
 * Values come from `.env` (gitignored). `EXPO_PUBLIC_*` variables are inlined
 * into the bundle by Metro, so only ever expose short-lived, client-safe
 * values here — see `.env.example`.
 */

const appId = process.env.EXPO_PUBLIC_CALL_APP_ID ?? '';
const tempToken = process.env.EXPO_PUBLIC_CALL_TEMP_TOKEN ?? '';

if (__DEV__ && !appId) {
  console.warn(
    '[env] EXPO_PUBLIC_CALL_APP_ID is missing. Copy .env.example to .env and fill it in.'
  );
}

export const env = {
  /** App ID issued by the video call provider. */
  callAppId: appId,
  /** Short-lived token for local development. Never ship a long-lived one. */
  callTempToken: tempToken,
  /** True once both call credentials are present. */
  get hasCallCredentials() {
    return appId.length > 0 && tempToken.length > 0;
  },
} as const;

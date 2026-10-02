/**
 * Single place where the app reads configuration from the environment.
 *
 * Values come from `.env` (gitignored). `EXPO_PUBLIC_*` variables are inlined
 * into the bundle by Metro, so only ever expose short-lived, client-safe
 * values here — see `.env.example`.
 */

// Agora
const agoraAppId = process.env.EXPO_PUBLIC_AGORA_APP_ID ?? '';
const agoraToken = process.env.EXPO_PUBLIC_AGORA_TOKEN ?? '';

// Supabase
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '';

// Cloudinary
const cloudinaryCloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME ?? '';
const cloudinaryUploadPreset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? '';

if (__DEV__ && !agoraAppId) {
  console.warn(
    '[env] EXPO_PUBLIC_AGORA_APP_ID is missing. Copy .env.example to .env and fill it in.'
  );
}

export const env = {
  /** Agora App ID for video calling. */
  AGORA_APP_ID: agoraAppId,
  /** Agora temporary token for local development. Never ship a long-lived one. */
  AGORA_TOKEN: agoraToken,
  /** True once both call credentials are present. */
  get hasCallCredentials() {
    return agoraAppId.length > 0 && agoraToken.length > 0;
  },

  /** Supabase project URL. */
  SUPABASE_URL: supabaseUrl,
  /** Supabase publishable key (safe for client). */
  SUPABASE_PUBLISHABLE_KEY: supabasePublishableKey,
  /** True once Supabase is configured. */
  get hasSupabase() {
    return supabaseUrl.length > 0 && supabasePublishableKey.length > 0;
  },

  /** Cloudinary cloud name for photo uploads. */
  CLOUDINARY_CLOUD_NAME: cloudinaryCloudName,
  /** Cloudinary upload preset (unsigned). */
  CLOUDINARY_UPLOAD_PRESET: cloudinaryUploadPreset,
  /** True once Cloudinary is configured. */
  get hasCloudinary() {
    return cloudinaryCloudName.length > 0 && cloudinaryUploadPreset.length > 0;
  },
} as const;

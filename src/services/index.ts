import { supabaseBackend } from '@/services/supabase-backend';
import type { Backend } from '@/services/types';

/**
 * The single place the app decides where data comes from.
 *
 * Now backed by Supabase (auth + database) and Cloudinary (profile photos).
 */
export const backend: Backend = supabaseBackend;

export * from '@/services/types';

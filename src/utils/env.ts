import Constants from 'expo-constants'

/**
 * Environment configuration for Expo
 * Set these in app.json under "extra" or use Expo Constants
 */
export const ENV = {
  SUPABASE_URL: Constants.expoConfig?.extra?.supabaseUrl || '',
  SUPABASE_ANON_KEY: Constants.expoConfig?.extra?.supabaseAnonKey || '',
}

if (!ENV.SUPABASE_URL || !ENV.SUPABASE_ANON_KEY) {
  console.warn(
    '⚠️ Missing Supabase environment variables. Please set them in app.json under "extra".'
  )
}

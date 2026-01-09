import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://wrxfgjawoiwncrwmjcgo.supabase.co';
const supabaseAnonKey = 'sb_publishable_hxqD9ha1lOQ92oFc8c3NRA_cp_G1O3o';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export type Restaurant = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  cuisine_type: string;
  price_range: string;
  rating: number;
  image_url: string;
  yelp_place_id: string;
};
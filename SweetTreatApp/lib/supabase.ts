import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wrxfgjawoiwncrwmjcgo.supabase.co';
const supabaseAnonKey = 'sb_publishable_hxqD9ha1lOQ92oFc8c3NRA_cp_G1O3o';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// TypeScript type for your restaurant data
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
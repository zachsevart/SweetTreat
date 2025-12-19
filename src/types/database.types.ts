export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      restaurants: {
        Row: {
          id: string
          name: string
          address: string
          latitude: number
          longitude: number
          cuisine_type: string | null
          price_range: string | null
          rating: number | null
          image_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          address: string
          latitude: number
          longitude: number
          cuisine_type?: string | null
          price_range?: string | null
          rating?: number | null
          image_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          address?: string
          latitude?: number
          longitude?: number
          cuisine_type?: string | null
          price_range?: string | null
          rating?: number | null
          image_url?: string | null
          created_at?: string
        }
      }
      video_reviews: {
        Row: {
          id: string
          restaurant_id: string
          user_id: string
          video_url: string
          thumbnail_url: string | null
          duration: number | null
          likes_count: number
          views_count: number
          created_at: string
        }
        Insert: {
          id?: string
          restaurant_id: string
          user_id: string
          video_url: string
          thumbnail_url?: string | null
          duration?: number | null
          likes_count?: number
          views_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          restaurant_id?: string
          user_id?: string
          video_url?: string
          thumbnail_url?: string | null
          duration?: number | null
          likes_count?: number
          views_count?: number
          created_at?: string
        }
      }
      user_likes: {
        Row: {
          id: string
          user_id: string
          video_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          video_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          video_id?: string
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          username: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string
        }
        Insert: {
          id: string
          username?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}


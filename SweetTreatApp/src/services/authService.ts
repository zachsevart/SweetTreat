import { supabase } from './supabase'
import { Session, User } from '@supabase/supabase-js'
import { Profile } from '../types'

export const authService = {
  /**
   * Get current session
   */
  async getSession(): Promise<Session | null> {
    const { data: { session } } = await supabase.auth.getSession()
    return session
  },

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  },

  /**
   * Get user profile
   */
  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // Profile doesn't exist
        return null
      }
      throw error
    }

    return data
  },

  /**
   * Create user profile
   */
  async createProfile(profile: { id: string; username?: string; avatar_url?: string; bio?: string }) {
    const { data, error } = await supabase
      .from('profiles')
      .insert(profile)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updates: Partial<Profile>) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Sign up with email and password
   */
  async signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    if (error) throw error
    return data
  },

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    return data
  },

  /**
   * Sign out
   */
  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  /**
   * Reset password
   */
  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'sweettreat://reset-password',
    })
    if (error) throw error
  },

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(callback: (session: Session | null) => void) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      callback(session)
    })
    return { subscription }
  },
}


import { supabase } from './supabase'

export const storageService = {
  /**
   * Upload a video file
   */
  async uploadVideo(file: File | Blob, userId: string, restaurantId: string): Promise<string> {
    const fileName = `${userId}/${restaurantId}/${Date.now()}-${Math.random().toString(36).substring(7)}.mp4`
    
    const { data, error } = await supabase.storage
      .from('videos')
      .upload(fileName, file, {
        contentType: 'video/mp4',
        upsert: false,
      })

    if (error) throw error
    return data.path
  },

  /**
   * Upload a thumbnail image
   */
  async uploadThumbnail(file: File | Blob, videoId: string): Promise<string> {
    const fileName = `${videoId}/${Date.now()}-thumbnail.jpg`
    
    const { data, error } = await supabase.storage
      .from('thumbnails')
      .upload(fileName, file, {
        contentType: 'image/jpeg',
        upsert: false,
      })

    if (error) throw error
    return data.path
  },

  /**
   * Upload an avatar image
   */
  async uploadAvatar(file: File | Blob, userId: string): Promise<string> {
    const fileName = `${userId}/avatar-${Date.now()}.jpg`
    
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, {
        contentType: 'image/jpeg',
        upsert: true, // Allow overwriting existing avatar
      })

    if (error) throw error
    return data.path
  },

  /**
   * Get public URL for a file
   */
  getPublicUrl(bucket: string, path: string): string {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    return data.publicUrl
  },

  /**
   * Delete a file
   */
  async deleteFile(bucket: string, path: string) {
    const { error } = await supabase.storage.from(bucket).remove([path])
    if (error) throw error
  },

  /**
   * Get signed URL for private file (expires in 1 hour)
   */
  async getSignedUrl(bucket: string, path: string, expiresIn: number = 3600): Promise<string> {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn)

    if (error) throw error
    return data.signedUrl
  },
}


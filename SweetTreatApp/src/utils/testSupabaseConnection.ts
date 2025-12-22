import { supabase } from '../services/supabase'
import { ENV } from './env'

/**
 * Test Supabase connection
 * Call this function to verify your Supabase setup is working
 */
export async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase connection...')
  console.log('📍 Supabase URL:', ENV.SUPABASE_URL ? '✅ Set' : '❌ Missing')
  console.log('🔑 Supabase Key:', ENV.SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing')

  if (!ENV.SUPABASE_URL || !ENV.SUPABASE_ANON_KEY) {
    throw new Error('❌ Supabase credentials are missing! Check your .env file.')
  }

  try {
    // Test 1: Check if we can connect to Supabase
    const { data, error } = await supabase.from('restaurants').select('count').limit(1)

    if (error) {
      // If table doesn't exist, that's okay - connection still works
      if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {
        console.log('✅ Supabase connection successful!')
        console.log('⚠️  Note: restaurants table not found - you may need to run database setup SQL')
        return {
          success: true,
          message: 'Connection successful, but database tables may not be set up yet',
          error: error.message,
        }
      }
      throw error
    }

    console.log('✅ Supabase connection successful!')
    console.log('✅ Database tables are accessible!')
    return {
      success: true,
      message: 'Connection successful and database is ready!',
      data,
    }
  } catch (error: any) {
    console.error('❌ Supabase connection failed:', error.message)
    return {
      success: false,
      message: error.message,
      error,
    }
  }
}

/**
 * Quick test function you can call from anywhere
 */
export async function quickTest() {
  const result = await testSupabaseConnection()
  if (result.success) {
    console.log('🎉 All good! Your Supabase connection is working.')
  } else {
    console.error('💥 Connection test failed:', result.message)
  }
  return result
}


import { createClient, SupabaseClient } from '@supabase/supabase-js'

let supabaseClient: SupabaseClient

declare global {
  // eslint-disable-next-line no-var
  var __supabaseClient: SupabaseClient | undefined
}

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE

if (typeof supabaseUrl !== 'string' || typeof supabaseKey !== 'string') {
  throw new Error('Supabase is not properly configured')
}

if (process.env.NODE_ENV === 'production') {
  supabaseClient = createClient(supabaseUrl, supabaseKey)
} else {
  if (!global.__supabaseClient) {
    global.__supabaseClient = createClient(supabaseUrl, supabaseKey)
  }
  supabaseClient = global.__supabaseClient
}

export { supabaseClient }

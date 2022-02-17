import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { getSession } from '~/services/session.server'

let supabaseClient: SupabaseClient

declare global {
  // eslint-disable-next-line no-var
  var __supabaseClient: SupabaseClient | undefined
}

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY

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

const hasAuthSession = async (request: Request) => {
  let session = await getSession(request.headers.get('Cookie'))
  if (!session.has('access_token')) throw Error('No session')
  supabaseClient.auth.setAuth(session.get('access_token'))
}

export { supabaseClient, hasAuthSession }

import { createCookieSessionStorage } from 'remix'
import { Authenticator, AuthorizationError } from 'remix-auth'
import { SupabaseStrategy } from 'remix-auth-supabase'
import { supabaseClient } from '~/services/supabase.server'
import type { Session } from '@supabase/supabase-js'

export let sessionStorage = createCookieSessionStorage({
  cookie: {
    name: 'sb',
    sameSite: 'lax',
    path: '/',
    httpOnly: true,
    secrets: ['wow-this-is-so-secret'],
    secure: process.env.NODE_ENV === 'production',
  },
})

export const supabaseStrategy = new SupabaseStrategy(
  {
    supabaseClient,
    sessionStorage,
    sessionKey: 'sb:session',
    sessionErrorKey: 'sb:error',
  },
  async ({ req, supabaseClient }) => {
    const form = await req.formData()
    const email = form?.get('email')
    const password = form?.get('password')

    if (!email) {
      throw new AuthorizationError('Email is required')
    }
    if (typeof email !== 'string') {
      throw new AuthorizationError('Email must be a string')
    }

    if (!password) {
      throw new AuthorizationError('Password is required')
    }
    if (typeof password !== 'string') {
      throw new AuthorizationError('Password must be a string')
    }

    return supabaseClient.auth.api
      .signInWithEmail(email, password)
      .then(({ data, error }) => {
        if (error || !data) {
          throw new AuthorizationError(
            error?.message ?? 'No user session found'
          )
        }

        return data
      })
  }
)

export const authenticator = new Authenticator<Session>(sessionStorage, {
  sessionKey: supabaseStrategy.sessionKey,
  sessionErrorKey: supabaseStrategy.sessionErrorKey,
})

authenticator.use(supabaseStrategy)

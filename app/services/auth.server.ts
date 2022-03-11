import { createCookieSessionStorage } from 'remix'
import { Authenticator, AuthorizationError } from 'remix-auth'
import { SupabaseStrategy } from 'remix-auth-supabase'
import { supabaseClient } from '~/services/supabase.server'
import type { Session } from '@supabase/supabase-js'
import { db } from '~/db'

let secret = process.env.COOKIE_SECRET

if (typeof secret !== 'string') {
  throw new Error('Cookie secret is not properly configured')
}

export let sessionStorage = createCookieSessionStorage({
  cookie: {
    name: 'sb',
    sameSite: 'lax',
    path: '/',
    httpOnly: true,
    secrets: [secret],
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

/**
 * Check if authenticated: will redirect if false, otherwise will return the session
 * @param request
 * @returns
 */
export async function checkAuthentication(request: Request) {
  const session = await supabaseStrategy.checkSession(request, {
    failureRedirect: '/login',
  })

  // find the user in the database and return that instead of the session
  const user = await db.user.findUnique({ where: { id: session.user?.id } })

  // if no user was found, logout whatever user we have and logout
  // TODO: if you get in this state, that's not good, so I need to figure out an account recovery strategy
  if (!user) {
    await authenticator.logout(request, { redirectTo: '/login' })
    // this error will never actually run, since the above would redirect, this is
    // just here so the return type is User instead of User | null
    throw new Error('No user found!')
  }

  return user
}

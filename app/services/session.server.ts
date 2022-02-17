import { createCookieSessionStorage } from 'remix'

export let sessionStorage = createCookieSessionStorage({
  cookie: {
    name: '_session',
    sameSite: 'lax',
    path: '/',
    httpOnly: true,
    secrets: ['wow-this-is-so-secret'],
    secure: process.env.NODE_ENV === 'production',
  },
})

export let { getSession, commitSession, destroySession } = sessionStorage

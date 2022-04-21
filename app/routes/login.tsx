import type { ActionFunction, LoaderFunction, MetaFunction } from 'remix'
import { Link, useTransition } from 'remix'
import { Form, json, useLoaderData } from 'remix'
import { z } from 'zod'
import {
  authenticator,
  sessionStorage,
  supabaseStrategy,
} from '~/services/auth.server'
import { Input } from '~/components'

export const meta: MetaFunction = () => {
  return {
    title: 'Login Page',
  }
}

type LoaderData = {
  error: { message: string } | null
}

let schema = z.object({ message: z.string() }).nullable()

export const action: ActionFunction = async ({ request }) => {
  console.log('action!!')
  return await authenticator.authenticate('sb', request, {
    successRedirect: '/',
    failureRedirect: '/login',
  })
}

export const loader: LoaderFunction = async ({ request }) => {
  // if logged in redirect to home
  await supabaseStrategy.checkSession(request, {
    successRedirect: '/',
  })
  // otherwise check if there was an error from the last login attempt
  const session = await sessionStorage.getSession(request.headers.get('Cookie'))

  let error = schema.parse(session.get(authenticator.sessionErrorKey) ?? null)
  return json<LoaderData>(
    { error },
    // need to recommit the session to clear the flash
    {
      headers: {
        'Set-Cookie': await sessionStorage.commitSession(session),
      },
    }
  )
}

export default function Screen() {
  const loaderData = useLoaderData()
  const transition = useTransition()

  const error = schema.parse(loaderData.error)

  const disabled = transition.state !== 'idle'

  return (
    <main className="mx-auto max-w-fit p-8">
      <Form className="mt-4 sm:w-72" method="post">
        <fieldset className="space-y-4" disabled={disabled}>
          <Input
            type="email"
            name="email"
            id="email"
            required
            placeholder="email"
            aria-label="email"
          />

          <Input
            type="password"
            name="password"
            id="password"
            required
            placeholder="password"
            aria-label="password"
          />

          <button
            className="w-full rounded-md border border-zinc-400 bg-green-200 px-2 py-1 text-gray-800 disabled:bg-zinc-300 disabled:text-gray-600"
            type="submit"
          >
            {disabled ? 'Logging in...' : 'Log in'}
          </button>
        </fieldset>

        {error && <p className="mt-2 text-lg text-red-800">{error.message}</p>}
      </Form>

      <Link
        className="mt-4 block text-center text-lg text-blue-900 hover:text-blue-600"
        to="../create-account"
      >
        create a new account
      </Link>
    </main>
  )
}

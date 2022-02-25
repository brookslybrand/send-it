import {
  ActionFunction,
  LoaderFunction,
  MetaFunction,
  useActionData,
  useTransition,
} from 'remix'
import { Form, json, useLoaderData } from 'remix'
import { z } from 'zod'
import { authenticator, sessionStorage, supabaseStrategy } from '~/auth.server'
import { Input } from '~/components'
import { sleep } from '~/utils/sleep.server'

export const meta: MetaFunction = () => {
  return {
    title: 'Login Page',
  }
}

type LoaderData = {
  error: { message: string } | null
}

let schema = z
  .object({
    message: z.string(),
  })
  .nullable()

export const action: ActionFunction = async ({ request }) => {
  return await authenticator.authenticate('sb', request, {
    successRedirect: '/private',
    failureRedirect: '/login',
  })
}

export const loader: LoaderFunction = async ({ request }) => {
  await supabaseStrategy.checkSession(request, {
    successRedirect: '/private',
  })

  const session = await sessionStorage.getSession(request.headers.get('Cookie'))

  const { sessionErrorKey } = authenticator
  // TODO: handle parsing error
  let error = schema.parse(session.get(sessionErrorKey) ?? null)

  return json<LoaderData>({ error })
}

export default function Screen() {
  const loaderData = useLoaderData()
  const transition = useTransition()

  // TODO: handle when this fails
  // TODO: figure out how to get rid of this error if it's the users first time on the login page
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
            placeholder="email"
            aria-label="email"
          />

          <Input
            type="password"
            name="password"
            id="password"
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
    </main>
  )
}

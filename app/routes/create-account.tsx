import { User } from '@prisma/client'
import {
  Form,
  useTransition,
  ActionFunction,
  MetaFunction,
  useActionData,
  json,
} from 'remix'
import { z } from 'zod'
import { db, supabaseClient } from '~/db'

import { Input } from '~/components'
import { supabaseStrategy } from '~/auth.server'
import { LoaderFunction } from '@remix-run/server-runtime'

export const meta: MetaFunction = () => {
  return {
    title: 'Create Account',
  }
}

// TODO:
// - Add ability to create an account
// - Add ability to login
// - Add ability to logout

// TODO: Handle all errors

let schema = z.object({
  name: z.string(),
  email: z.string(),
  password: z.string(),
})

type ActionData = User | { error: string }

export let action: ActionFunction = async ({ request }) => {
  let form = await request.formData()
  let data
  // let email = form.get('email')
  // let password = form.get('password')
  try {
    data = schema.parse({
      name: form.get('name'),
      email: form.get('email'),
      password: form.get('password'),
    })
  } catch (error) {
    // TODO: handle specific zod errors
    // if (error instanceof ZodError) {
    //   let messages = error.issues.map((issue) => issue.message);
    //   if (messages.length > 1) return json<ActionData>({ error: messages });
    //   return json<ActionData>({ error: messages[0] });
    // }

    return json({ error: 'Something went wrong, try again.' }, 400)
  }

  const { name, email, password } = data

  let newUser
  try {
    let { user, error } = await supabaseClient.auth.signUp({ email, password })
    if (!user || error) {
      throw new Error('Failed to create user')
    }
    newUser = await db.user.create({
      data: {
        name,
        email,
      },
    })
  } catch (error) {
    // TODO: handle this error better
    return json<ActionData>({ error: 'Failed to create user' }, 500)
  }

  return newUser

  // if (!signUpError) {
  //   // create the user in profiles table
  //   const { data, error: profileError } = await supabaseClient
  //     .from('profiles')
  //     .insert([{ email, first, last, id: user?.id }])

  //   // if error return
  //   if (profileError) return { error: profileError }

  //   // all good, set session and move on
  //   let session = await getSession(request.headers.get('Cookie'))
  //   session.set('access_token', sessionData.access_token)`
  //   return redirect('/', {
  //     headers: {
  //       'Set-Cookie': await commitSession(session),
  //     },
  //   })
  // }

  // // else return the error
  // return { user, signUpError }
}

export const loader: LoaderFunction = async ({ request }) => {
  await supabaseStrategy.checkSession(request, {
    successRedirect: '/private',
  })

  return {} // have to return something from a loader function
}

export default function CreateAccount() {
  const actionData = useActionData<ActionData>()
  const transition = useTransition()

  const disabled = transition.state !== 'idle'

  return (
    <main className="mx-auto max-w-fit p-8">
      <h1 className="text-center text-2xl">Sign up!</h1>
      {actionData && 'name' in actionData ? (
        <p className="mt-2 text-xl">
          Welcome {actionData.name}! Please verify your email to login.
        </p>
      ) : (
        <Form className="mt-4 sm:w-72" method="post">
          <fieldset className="space-y-4" disabled={disabled}>
            <Input
              type="name"
              name="name"
              placeholder="Name"
              aria-label="name"
              required
            />
            <Input
              type="email"
              name="email"
              placeholder="Email"
              aria-label="email"
              required
            />
            <Input
              type="password"
              name="password"
              placeholder="Password"
              aria-label="password"
              required
            />
            {/* <Input
            type="password"
            name="confirmPassword"
            placeholder="Confirm password"
            aria-label="confirm password"
            required
          /> */}
            <button
              className="w-full rounded-md border border-zinc-400 bg-green-200 px-2 py-1 text-gray-800 disabled:bg-zinc-300 disabled:text-gray-600"
              type="submit"
            >
              {disabled ? 'Creating Account...' : 'Create Account'}
            </button>
          </fieldset>
          {actionData && 'error' in actionData ? (
            <p className="mt-2 text-lg text-red-800">
              Something went wrong: {actionData.error}
            </p>
          ) : null}
        </Form>
      )}
    </main>
  )
}

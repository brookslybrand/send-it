import { InputHTMLAttributes } from 'react'
import {
  Link,
  Form,
  useTransition,
  redirect,
  ActionFunction,
  useActionData,
} from 'remix'
import { db, supabaseClient } from '~/db'
import { getSession, commitSession } from '~/services/session.server'

// TODO:
// - Add ability to create an account
// - Add ability to login
// - Add ability to logout

// TODO: Handle all errors

export let action: ActionFunction = async ({ request }) => {
  let form = await request.formData()
  let email = form.get('email')
  let password = form.get('password')

  if (typeof email !== 'string' || typeof password !== 'string') {
    throw new Error('handle this')
  }

  let { session, user, error } = await supabaseClient.auth.signUp({
    email,
    password,
  })

  if (!user || error) {
    throw new Error('handle this')
  }

  await db.user.create({
    data: {
      name: 'Jo',
      email,
    },
  })

  await new Promise((r) => setTimeout(r, 1000))

  return {}

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

export default function CreateAccount() {
  const actionData = useActionData()
  const transition = useTransition()

  const disabled = transition.state !== 'idle'

  return (
    <main className="mx-auto max-w-fit p-8">
      <h1 className="text-center text-2xl">Sign up!</h1>
      {actionData ? (
        <p className="mt-2 text-xl">
          You have successfully signed up! Please verify your email.
        </p>
      ) : (
        <Form className="mt-4 sm:w-72" method="post">
          <fieldset className="space-y-4" disabled={disabled}>
            <Input
              type="email"
              name="email"
              placeholder="Email"
              aria-label="email"
            />
            <Input
              type="password"
              name="password"
              placeholder="Password"
              aria-label="password"
            />
            {/* <Input
            type="password"
            name="confirmPassword"
            placeholder="Confirm password"
            aria-label="confirm password"
          /> */}
            <button
              className="w-full rounded-md border border-zinc-400 bg-green-200 px-2 py-1 text-gray-800 disabled:bg-zinc-300 disabled:text-gray-600"
              type="submit"
            >
              Create Account
            </button>
          </fieldset>
        </Form>
      )}
    </main>
  )
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className="w-full rounded-md border border-zinc-400 px-2 py-1 text-gray-800 disabled:text-gray-400"
      {...props}
    />
  )
}

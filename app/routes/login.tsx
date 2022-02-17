import { Form } from '@remix-run/react'
import { ActionFunction, redirect } from 'remix'
import { supabaseClient } from '~/db'
import { commitSession, getSession } from '~/services/session.server'

export let action: ActionFunction = async ({ request }) => {
  // get user credentials from form
  let form = await request.formData()
  // TODO: add error handling
  let email = form.get('email') as string
  let password = form.get('password') as string

  // login using the credentials
  const { user, session, error } = await supabaseClient.auth.signIn({
    email,
    password,
  })
  // if i have a user then create the cookie with the
  // auth_token, not sure if i want to use the auth token,
  // but it works... will do more research
  if (session) {
    const data = session.data
    console.log({ data })
    // get session and set access_token
    let cookieSession = await getSession(request.headers.get('Cookie'))
    cookieSession.set('access_token', session.access_token)

    // redirect to page with the cookie set in header
    return redirect('/', {
      headers: {
        'Set-Cookie': await commitSession(cookieSession),
      },
    })
  }

  return { user, error }
}

export default function Login() {
  return (
    <Form method="post" className="flex w-48 flex-col">
      <input type="email" name="email" className="border-2 border-gray-800" />
      <input
        type="password"
        name="password"
        className="border-2 border-gray-800"
      />
      <button>Login</button>
    </Form>
  )
}

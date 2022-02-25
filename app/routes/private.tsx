import type { ActionFunction, LoaderFunction, MetaFunction } from 'remix'
import { Form, json, useLoaderData } from 'remix'
import { authenticator, supabaseStrategy } from '~/services/auth.server'

export const meta: MetaFunction = () => {
  return {
    title: 'Private Page',
  }
}

type LoaderData = { email?: string }

export const action: ActionFunction = async ({ request }) => {
  await authenticator.logout(request, { redirectTo: '/login' })
}

export const loader: LoaderFunction = async ({ request }) => {
  const session = await supabaseStrategy.checkSession(request, {
    failureRedirect: '/login',
  })

  return json<LoaderData>({ email: session.user?.email })
}

export default function Screen() {
  const { email } = useLoaderData<LoaderData>()
  return (
    <>
      <h1>Hello {email}</h1>

      <Form method="post">
        <button>Log Out</button>
      </Form>
    </>
  )
}
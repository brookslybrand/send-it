import type { MetaFunction, LoaderFunction, ActionFunction } from 'remix'
import { Link, Form } from 'remix'
import { useLoaderData } from 'remix'
import { authenticator, checkAuthentication } from '~/services/auth.server'

export let meta: MetaFunction = () => {
  return {
    title: 'Remix Starter',
    description: 'Welcome to remix!',
  }
}
export const action: ActionFunction = async ({ request }) => {
  await authenticator.logout(request, { redirectTo: '/login' })
}

type LoaderData = { name: string }
export let loader: LoaderFunction = async ({ request }) => {
  const user = await checkAuthentication(request)
  const result: LoaderData = { name: user.name }
  return result
}

export default function Index() {
  let data = useLoaderData<LoaderData>()

  return (
    <div className="p-6 text-center">
      <h2 className="text-4xl">{data.name}, send it!</h2>

      {/* TODO: Use useTransition to show a loading indicator if this is taking a little while */}
      <Link
        className="mt-6 block text-2xl text-blue-800 hover:text-blue-400"
        to="sessions/new"
      >
        Create a new session
      </Link>
      {/* TODO: make prettier */}
      <Form method="post">
        <button>Log Out</button>
      </Form>
    </div>
  )
}

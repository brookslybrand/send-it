import type { MetaFunction, LoaderFunction } from 'remix'
import { useLoaderData } from 'remix'
import { prisma } from '~/db'
import { User } from '.prisma/client'

export let meta: MetaFunction = () => {
  return {
    title: 'Remix Starter',
    description: 'Welcome to remix!',
  }
}

async function getUsers() {
  const users = await prisma.user.findMany()
  return users.map(({ id, name }) => ({ id, name }))
}

type LoaderData = { users: Pick<User, 'id' | 'name'>[] }
export let loader: LoaderFunction = async () => {
  const users = await getUsers()
  const result: LoaderData = { users }
  return result
}

export default function Index() {
  let data = useLoaderData<LoaderData>()

  return (
    <div className="text-center p-6">
      <h2 className="text-4xl">Welcome to Remix!</h2>

      <h3 className="text-3xl mt-4">Users</h3>
      <ol>
        {data.users.map(({ id, name }) => (
          <li key={id}>{name}</li>
        ))}
      </ol>
    </div>
  )
}

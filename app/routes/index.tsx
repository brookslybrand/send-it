import type { MetaFunction, LoaderFunction } from 'remix'
import { useLoaderData } from 'remix'
import { Link } from 'react-router-dom'
import { prisma } from '~/db'
import { Post } from '.prisma/client'

export let meta: MetaFunction = () => {
  return {
    title: 'Remix Starter',
    description: 'Welcome to remix!',
  }
}

async function getPosts() {
  const posts = await prisma.post.findMany({ orderBy: { createdAt: 'desc' } })
  return posts.map(({ id, title, createdAt }) => ({ id, title, createdAt }))
}

type LoaderData = { posts: Pick<Post, 'id' | 'title' | 'createdAt'>[] }
export let loader: LoaderFunction = async () => {
  const posts = await getPosts()
  const result: LoaderData = { posts }
  return result
}

export default function Index() {
  let data = useLoaderData<LoaderData>()

  console.log(data.posts)

  return (
    <div className="text-center p-6">
      <h2 className="text-4xl">Welcome to Remix!</h2>

      <Link
        to="./new-post"
        className="text-2xl text-green-800 hover:text-green-600 focus:text-green-600 block mt-4"
      >
        Create a new post
      </Link>

      <h3 className="text-3xl mt-4">Previous Posts</h3>
      <ol>
        {data.posts.map(({ id, title, createdAt }) => (
          <li key={id}>
            {title} — {new Date(createdAt).toLocaleDateString()}
          </li>
        ))}
      </ol>
    </div>
  )
}

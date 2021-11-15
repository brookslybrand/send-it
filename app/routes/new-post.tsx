import { redirect, Form, ActionFunction } from 'remix'
import { prisma } from '~/db'

export const action: ActionFunction = async ({ request }) => {
  let body = new URLSearchParams(await request.text())
  const title = body.get('title')
  if (!title) {
    throw new Error('Title is required')
  }
  await prisma.post.create({
    data: {
      title,
      content: body.get('content'),
    },
  })
  return redirect('/')
}

export default function NewPost() {
  return (
    <Form className="grid grid-cols-2 p-2 gap-y-2" method="post">
      <label htmlFor="title">Title</label>
      <input id="title" name="title" className="border border-gray-400" />

      <label htmlFor="content">content</label>
      <textarea
        id="content"
        name="content"
        className="border border-gray-400"
      />

      <button
        className="col-span-2 justify-self-center border rounded-sm border-gray-400 hover:bg-green-200 w-36"
        type="submit"
      >
        Create post
      </button>
    </Form>
  )
}

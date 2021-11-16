import { Project, Session } from '.prisma/client'
import clsx from 'clsx'
import {
  json,
  Form,
  MetaFunction,
  LoaderFunction,
  ActionFunction,
  useLoaderData,
} from 'remix'
import { prisma, Serialized } from '~/db'

export let meta: MetaFunction = () => {
  return {
    title: 'New Session',
  }
}

export let action: ActionFunction = async ({ request }) => {
  console.log(new URLSearchParams(await request.text()))

  return json({ ok: true })
}

type LoaderData = {
  session: Session & {
    projects: Project[]
  }
}

export let loader: LoaderFunction = async () => {
  // TODO: Get the authenticated user, not just me every time
  let user = await prisma.user.findUnique({
    where: {
      email: 'brookslybrand@gmail.com',
    },
    select: {
      id: true,
    },
  })

  if (!user?.id) {
    throw new Error('User not found')
  }

  // find the current in progress session; create one if it doesn't exist
  let session = await prisma.session.findFirst({
    where: {
      userId: user.id,
      status: 'inProgress',
    },
    include: {
      projects: true,
    },
  })

  if (session === null) {
    session = await prisma.session.create({
      data: {
        status: 'inProgress',
        User: {
          connect: {
            id: user.id,
          },
        },
      },
      include: {
        projects: true,
      },
    })
  }

  const result: LoaderData = { session }
  return json(result)
}

export default function NewSession() {
  let { session } = useLoaderData<Serialized<LoaderData>>()

  return (
    <main className="flex flex-col w-1/2 m-auto p-8">
      <h1 className="text-6xl text-center">New Session</h1>
      <section className="py-16 space-y-8">
        <DateTimeInput
          id="start-time"
          name="start-time"
          label="Start Time"
          defaultValue={session.startTime}
        />
        <DateTimeInput
          id="end-time"
          name="end-time"
          label="End Time"
          defaultValue={session.endTime}
        />
        <Grade label="VB - V0" projects={session.projects} />
      </section>
    </main>
  )
}

type DateTimeInputProps = {
  id: string
  name: string
  label: string
  defaultValue?: string | null | undefined
}
function DateTimeInput({ id, name, label, defaultValue }: DateTimeInputProps) {
  return (
    <div className="flex flex-col">
      <label className="text-2xl font-bold" htmlFor={id}>
        {label}
      </label>
      <input
        className="text-2xl mt-4"
        id={id}
        name={name}
        type="datetime-local"
        defaultValue={defaultValue ?? undefined}
      />
    </div>
  )
}

type GradeProps = {
  label: string
  projects: Project[]
}
function Grade({ label, projects }: GradeProps) {
  return (
    <div className="py-4">
      <Form method="post">
        <button
          type="submit"
          className={clsx(
            'text-2xl font-bold w-full flex justify-between items-center',
            'text-green-600 hover:text-green-800 active:text-green-900 group'
          )}
        >
          <span>{label}</span>

          <span
            // Note: this will break visually if there is a 3 digit number
            className={clsx(
              'ring-2 ring-offset-8 rounded-full ring-current leading-[2rem] w-8 h-8',
              'group-active:text-blue-400 group-active:ring-blue-400 group-active:ring-4'
            )}
          >
            {projects.length}
          </span>
        </button>
      </Form>
    </div>
  )
}

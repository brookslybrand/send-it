import { Project, Session } from '.prisma/client'
import VisuallyHidden from '@reach/visually-hidden'
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
  let body = await request.formData()
  const sessionId = Number(body.get('sessionId'))
  const grade = body.get('grade')

  if (Number.isNaN(sessionId)) {
    return json({ message: 'No session provided' }, 400)
  } else if (!isGrade(grade)) {
    return json({ message: 'Invalid grade' }, 400)
  }

  const sessionWithNewProject = await prisma.session.update({
    where: {
      // TODO: Get this
      id: sessionId,
    },
    data: {
      projects: {
        create: {
          grade,
        },
      },
    },
    include: {
      projects: true,
    },
  })

  return json({ session: sessionWithNewProject.projects })
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

  let projectsByGrade = createEmptyProjects()
  for (let project of session.projects) {
    let { grade } = project
    if (!isGrade(grade)) throw new Error('Invalid grade')
    projectsByGrade[grade].push(project)
  }

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
        {grades.map((grade) => (
          <Grade
            key={grade}
            sessionId={session.id}
            grade={grade}
            projects={projectsByGrade[grade]}
          />
        ))}
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
  sessionId: number
  grade: Grade
  projects: Project[]
}

function Grade({ sessionId, grade, projects }: GradeProps) {
  return (
    <div className="py-8">
      <Form method="post">
        <input type="hidden" name="sessionId" value={sessionId} />
        <input type="hidden" name="grade" value={grade} />
        <button
          type="submit"
          className={clsx(
            'text-2xl font-bold w-full flex justify-between items-center',
            'text-green-600 hover:text-green-800 active:text-green-900 group'
          )}
        >
          <span>{createGradeLabel(grade)}</span>

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
      <p className="pt-2 text-xl text-gray-400">Attempts</p>
      <ul>
        {projects.map(({ id, attempts }) => (
          <li key={id}>
            <AttemptsControl attempts={attempts} />
          </li>
        ))}
      </ul>
    </div>
  )
}

type Grade = 'vb-v0' | 'v1-v2' | 'v3-v4' | 'v5-v6' | 'v7-v8' | 'v9-v10' | 'v11+'

let gradeToLabel: Record<Grade, string> = {
  'vb-v0': 'VB - V0',
  'v1-v2': 'V1 - V2',
  'v3-v4': 'V3 - V4',
  'v5-v6': 'V5 - V6',
  'v7-v8': 'V7 - V8',
  'v9-v10': 'V9 - V10',
  'v11+': 'V11+',
}

function createEmptyProjects(): { [key in Grade]: Project[] } {
  return {
    'vb-v0': [],
    'v1-v2': [],
    'v3-v4': [],
    'v5-v6': [],
    'v7-v8': [],
    'v9-v10': [],
    'v11+': [],
  }
}

// Object.keys is type string[], so we have to type caste it
let grades = Object.keys(gradeToLabel) as Array<keyof typeof gradeToLabel>
let gradesSet = new Set(grades)

function createGradeLabel(grade: Grade) {
  let label = gradeToLabel[grade]
  if (label === undefined) {
    throw new Error('Invalid grade')
  }
  return label
}

// would prefer to use `unknown`, but I can't get that to work for type narrowing
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isGrade(grade: any): grade is Grade {
  return gradesSet.has(grade)
}

type AttemptsControlProps = { attempts: number }
function AttemptsControl({ attempts }: AttemptsControlProps) {
  return (
    <Form className="flex items-center py-4 space-x-6">
      <button>
        <VisuallyHidden>decrease attempts</VisuallyHidden>
        <MinusIcon />
      </button>
      <span className="text-3xl font-semibold text-gray-700">{attempts}</span>
      <button>
        <VisuallyHidden>increase attempts</VisuallyHidden>
        <PlusIcon />
      </button>
    </Form>
  )
}

function MinusIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={iconClassName}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1}
        d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={iconClassName}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1}
        d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  )
}

const iconClassName = 'h-16 w-16 text-green-800 text-opacity-50'

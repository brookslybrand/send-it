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

// not a fan of this...
function parseFormNumber(body: FormData, key: string) {
  return body.has(key) ? Number(body.get(key)) : NaN
}

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

export let action: ActionFunction = async ({ request }) => {
  let body = await request.formData()

  console.log(body)

  // TODO: implement hidden method for progressive enhancement
  if (request.method.toLowerCase() === 'delete') {
    const projectId = parseFormNumber(body, 'id')

    if (Number.isNaN(projectId)) {
      return json({ message: 'No project ID provided' }, 400)
    }
    await prisma.project.delete({ where: { id: projectId } })
    return json({ delete: true })
  }

  if (request.method.toLowerCase() === 'patch') {
    const projectId = parseFormNumber(body, 'id')
    const attempts = parseFormNumber(body, 'attempts')

    await sleep(1000)

    if (Number.isNaN(projectId)) {
      return json({ message: 'No project ID provided' }, 400)
    }
    if (Number.isNaN(attempts)) {
      return json({ message: 'No project ID provided' }, 400)
    }
    await prisma.project.update({
      where: { id: projectId },
      data: { attempts },
    })
    return json({ delete: true })
  }

  const sessionId = parseFormNumber(body, 'sessionId')
  const grade = body.get('grade')

  if (Number.isNaN(sessionId)) {
    return json({ message: 'No session ID provided' }, 400)
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
            'text-3xl font-bold w-full flex justify-between items-center',
            'text-green-600 hover:text-green-800 active:text-green-900 group'
          )}
        >
          <span>{createGradeLabel(grade)}</span>
          <ProjectIcon count={projects.length} />
        </button>
      </Form>
      <p className="pt-2 text-xl text-gray-400">Attempts</p>
      <ul>
        {projects.map(({ id, attempts }) => (
          <li key={id} className="flex justify-between">
            <AttemptsControl projectId={id} attempts={attempts} />
            <RemoveProjectButton projectId={id} />
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

type AttemptsControlProps = { projectId: number; attempts: number }
function AttemptsControl({ projectId, attempts }: AttemptsControlProps) {
  const atMinAttempts = attempts === 1
  return (
    <div className="flex items-center py-4 space-x-6">
      <Form method="patch">
        <input type="hidden" name="_method" value="patch" />
        <input type="hidden" name="attempts" value={attempts - 1} />
        <input type="hidden" name="id" value={projectId} />
        <button className="group" disabled={atMinAttempts}>
          <VisuallyHidden>decrease attempts</VisuallyHidden>
          <MinusIcon disabled={atMinAttempts} />
        </button>
      </Form>
      <span className="text-3xl font-semibold text-gray-700">{attempts}</span>
      <Form method="patch">
        <input type="hidden" name="_method" value="patch" />
        <input type="hidden" name="attempts" value={attempts + 1} />
        <input type="hidden" name="id" value={projectId} />
        <button className="group" name="this" value="butts" type="submit">
          <VisuallyHidden>increase attempts</VisuallyHidden>
          <PlusIcon />
        </button>
      </Form>
    </div>
  )
}

type RemoveProjectButtonProps = { projectId: number }
function RemoveProjectButton({ projectId }: RemoveProjectButtonProps) {
  return (
    <Form method="delete">
      {/* TODO: abstract out this method input */}
      <input type="hidden" name="_method" value="delete" />
      <input type="hidden" name="id" value={projectId} />
      <button type="submit" className="group">
        <VisuallyHidden>remove project</VisuallyHidden>
        <RemoveIcon />
      </button>
    </Form>
  )
}

type IconProps = {
  disabled?: boolean
}

function ProjectIcon({ count }: { count: number }) {
  return (
    <div className="relative group-active:text-blue-400">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className={clsx(iconBase, 'group-active:stroke-[2px]')}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      {/* Note: this will break visually if there is a 3 digit number */}
      <span className="text-3xl font-semibold absolute text-center leading-[0px] w-full inset-0 top-1/2">
        {count}
      </span>
    </div>
  )
}

function MinusIcon({ disabled = false }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={attemptIconClassName(disabled)}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  )
}

function PlusIcon({ disabled = false }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={attemptIconClassName(disabled)}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  )
}

function RemoveIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={clsx(iconBase, 'text-red-500 group-hover:text-red-700')}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  )
}

function attemptIconClassName(disabled: boolean) {
  return clsx(
    iconBase,
    'text-green-800 text-opacity-50 group-disabled:text-green-200',
    !disabled ? 'group-hover:text-green-600 ' : ''
  )
}

const iconBase = 'h-16 w-16 stroke-1 group-active:stroke-2'

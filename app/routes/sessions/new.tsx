import VisuallyHidden from '@reach/visually-hidden'
import clsx from 'clsx'
import { json, useLoaderData, useTransition } from 'remix'
import { db, Serialized } from '~/db'
import { FormWithHiddenMethod, addMethodToFormData } from '~/utils/form'
import type { Project, Session, Grade } from '.prisma/client'
import type { MetaFunction, LoaderFunction, ActionFunction } from 'remix'

export let meta: MetaFunction = () => {
  return {
    title: 'New Session',
  }
}

// not a fan of this...
function parseFormNumber(body: FormData, key: string) {
  return body.has(key) ? Number(body.get(key)) : NaN
}

export let action: ActionFunction = async ({ request }) => {
  let body = await addMethodToFormData(request)
  let method = body.get('method')

  switch (method) {
    // CREATE A NEW PROJECT
    case 'post': {
      let sessionId = parseFormNumber(body, 'sessionId')
      let grade = body.get('grade')

      if (Number.isNaN(sessionId)) {
        return json({ message: 'No session ID provided' }, 400)
      } else if (!isGrade(grade)) {
        return json({ message: 'Invalid grade' }, 400)
      }

      let sessionWithNewProject = await db.session.update({
        where: {
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
    // DELETE A PROJECT
    case 'delete': {
      let projectId = parseFormNumber(body, 'id')

      if (Number.isNaN(projectId)) {
        return json({ message: 'No project ID provided' }, 400)
      }
      await db.project.delete({ where: { id: projectId } })
      return json({ delete: true })
    }
    // UPDATE NUMBER OF ATTEMPTS ON PROJECT
    case 'patch': {
      let projectId = parseFormNumber(body, 'id')
      let attempts = parseFormNumber(body, 'attempts')

      // await sleep(1000)

      if (Number.isNaN(projectId)) {
        return json({ message: 'No project ID provided' }, 400)
      }
      if (Number.isNaN(attempts)) {
        return json(
          {
            message: `Invalid attempts provided provided: ${body.get(
              'attempts'
            )}`,
          },
          400
        )
      }
      await db.project.update({
        where: { id: projectId },
        data: { attempts },
      })
      return json({ attempts })
    }
    default: {
      return json({ message: `Unsupported method ${method}` }, 501)
    }
  }
}

type LoaderData = {
  session: Session & {
    projects: Project[]
  }
}

export let loader: LoaderFunction = async () => {
  // TODO: Get the authenticated user, not just me every time
  let user = await db.user.findUnique({
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
  let session = await db.session.findFirst({
    where: {
      userId: user.id,
      status: 'inProgress',
    },
    include: {
      projects: {
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  })

  if (session === null) {
    session = await db.session.create({
      data: {
        status: 'inProgress',
        User: {
          connect: {
            id: user.id,
          },
        },
      },
      include: {
        projects: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    })
  }

  let result: LoaderData = { session }
  return json(result)
}

export default function NewSession() {
  let { session } = useLoaderData<Serialized<LoaderData>>()
  let pendingProjectGrade = usePendingAddProject()

  let projectsByGrade = createEmptyProjects()
  for (let project of session.projects) {
    let { grade } = project
    if (!isGrade(grade)) throw new Error('Invalid grade')
    projectsByGrade[grade].push(project)
  }

  return (
    <main className="flex flex-col lg:w-1/2 m-auto p-8">
      <h1 className="text-4xl text-center">New Session</h1>

      <section className="py-16 space-y-8">
        <DateTimeInput
          name="start-time"
          label="Start Time"
          defaultValue={session.startTime}
        />
        <DateTimeInput
          name="end-time"
          label="End Time"
          defaultValue={session.endTime}
        />
        <section>
          {grades.map((grade) => (
            <GradeControl
              key={grade}
              sessionId={session.id}
              grade={grade}
              projects={projectsByGrade[grade]}
              disabled={pendingProjectGrade === grade}
            />
          ))}
        </section>
      </section>
    </main>
  )
}

type DateTimeInputProps = {
  name: string
  label: string
  defaultValue?: string | null | undefined
}
function DateTimeInput({ name, label, defaultValue }: DateTimeInputProps) {
  return (
    <label className="flex flex-col text-xl text-emerald-600 hover:text-emerald-800 active:text-emerald-900 font-bold">
      <span>{label}</span>
      <input
        // apply a padding to line up with the icons
        className="font-normal mt-2 pr-2"
        name={name}
        type="datetime-local"
        defaultValue={defaultValue ?? undefined}
      />
    </label>
  )
}

type GradeControlProps = {
  sessionId: number
  grade: Grade
  projects: Project[]
  disabled: boolean
}

function GradeControl({
  sessionId,
  grade,
  projects,
  disabled,
}: GradeControlProps) {
  return (
    <div className="py-8">
      <FormWithHiddenMethod method="post" replace>
        <input type="hidden" name="sessionId" value={sessionId} />
        <input type="hidden" name="grade" value={grade} />
        <button
          type="submit"
          className={clsx(
            'text-2xl font-bold w-full flex justify-between items-center',
            'text-emerald-600 hover:text-emerald-800 active:text-emerald-900 group',
            'disabled:text-emerald-200'
          )}
          disabled={disabled}
        >
          <span>{createGradeLabel(grade)}</span>
          <ProjectIcon count={projects.length} />
        </button>
      </FormWithHiddenMethod>
      <p className="pt-2 text-xl text-gray-400">Attempts</p>
      <ul>
        {projects.map(({ id, attempts }) => (
          <li key={id} className="flex items-center justify-between">
            <AttemptsControl
              projectId={id}
              attempts={attempts}
              disabled={disabled}
            />
            <RemoveProjectButton projectId={id} disabled={disabled} />
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * Detects whether a grade is being added
 * @returns {Grade} The grade of the project being added
 */
function usePendingAddProject() {
  let { submission } = useTransition()

  let body = submission?.formData

  if (!body) return null

  const grade = body.get('grade')

  return isGrade(grade) ? grade : null
}

let gradeToLabel: Record<Grade, string> = {
  vb_v0: 'VB - V0',
  v1_v2: 'V1 - V2',
  v3_v4: 'V3 - V4',
  v5_v6: 'V5 - V6',
  v7_v8: 'V7 - V8',
  v9_v10: 'V9 - V10',
  v11_: 'V11+',
}

function createEmptyProjects(): { [key in Grade]: Project[] } {
  return {
    vb_v0: [],
    v1_v2: [],
    v3_v4: [],
    v5_v6: [],
    v7_v8: [],
    v9_v10: [],
    v11_: [],
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

type AttemptsControlProps = {
  projectId: number
  attempts: number
  disabled: boolean
}
function AttemptsControl({
  projectId,
  attempts,
  disabled,
}: AttemptsControlProps) {
  let pendingAttempts = usePendingAttempts(projectId, attempts)

  let atMinAttempts = (pendingAttempts ?? attempts) <= 1
  return (
    <div className="flex items-center py-4 space-x-4">
      <FormWithHiddenMethod method="patch" replace>
        <input type="hidden" name="id" value={projectId} />
        <input type="hidden" name="attempts" value={pendingAttempts - 1} />

        <button
          className="group"
          type="submit"
          // TODO: Implement when bug is fixed in remix
          // name="attempts"
          // value={pendingAttempts - 1}
          disabled={disabled || atMinAttempts}
        >
          <VisuallyHidden>decrease attempts</VisuallyHidden>
          <MinusIcon />
        </button>
      </FormWithHiddenMethod>

      <span className="text-3xl font-semibold text-gray-700">
        {pendingAttempts}
      </span>

      <FormWithHiddenMethod method="patch" replace>
        <input type="hidden" name="id" value={projectId} />
        <input type="hidden" name="attempts" value={pendingAttempts + 1} />
        <button
          className="group"
          type="submit"
          name="attempts"
          value={pendingAttempts + 1}
          disabled={disabled}
        >
          <VisuallyHidden>increase attempts</VisuallyHidden>
          <PlusIcon />
        </button>
      </FormWithHiddenMethod>
    </div>
  )
}

/**
 * Gets the number of attempts currently being submitted to the project.
 * This allows users to click multiple times in a row and have all of their actions submitted
 * @param attempts
 * @returns
 */
function usePendingAttempts(projectId: number, attempts: number) {
  let { submission } = useTransition()
  let body = submission?.formData

  // return the original attempts if there is no submission
  // otherwise return the pending attempts
  if (!body) return attempts
  if (parseFormNumber(body, 'id') !== projectId) {
    return attempts
  }
  let pendingAttempts = parseFormNumber(body, 'attempts')
  return Number.isNaN(pendingAttempts) ? attempts : pendingAttempts
}

type RemoveProjectButtonProps = { projectId: number; disabled: boolean }
function RemoveProjectButton({
  projectId,
  disabled,
}: RemoveProjectButtonProps) {
  return (
    <FormWithHiddenMethod method="delete" replace>
      <input type="hidden" name="id" value={projectId} />
      <button type="submit" className="group" disabled={disabled}>
        <VisuallyHidden>remove project</VisuallyHidden>
        <RemoveIcon />
      </button>
    </FormWithHiddenMethod>
  )
}

function ProjectIcon({ count }: { count: number }) {
  return (
    <div className="relative group-active:text-emerald-900">
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
      <span className="text-2xl font-semibold absolute text-center leading-[0px] w-full inset-0 top-1/2">
        {count}
      </span>
    </div>
  )
}

function MinusIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={attemptIconClassName}
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

function PlusIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={attemptIconClassName}
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
      className={clsx(
        iconBase,
        'text-red-500 group-hover:text-red-700 group-disabled:text-red-200'
      )}
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

let iconBase =
  'h-12 w-12 stroke-1 group-active:stroke-2 group-disabled:stroke-1'

let attemptIconClassName = clsx(
  iconBase,
  'text-emerald-800 text-opacity-50 group-disabled:text-emerald-200 group-hover:text-emerald-600'
)

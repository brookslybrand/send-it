import VisuallyHidden from '@reach/visually-hidden'
import clsx from 'clsx'
import { json, useFetcher, useLoaderData } from 'remix'
import {
  createProject,
  deleteProject,
  updateProjectAttempts,
  findOrCreateInProgressSession,
} from '~/db'
import { addMethodToFormData, useFetcherWithHiddenMethod } from '~/utils/form'
import type { Serialized } from '~/db'
import type { Project, Session, Grade } from '.prisma/client'
import type { MetaFunction, LoaderFunction, ActionFunction } from 'remix'
import { useMemo } from 'react'

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

      let sessionWithNewProject = await createProject(sessionId, grade)

      return json({ session: sessionWithNewProject.projects })
    }
    // DELETE A PROJECT
    case 'delete': {
      let projectId = parseFormNumber(body, 'id')

      if (Number.isNaN(projectId)) {
        return json({ message: 'No project ID provided' }, 400)
      }
      await deleteProject(projectId)
      return json({ delete: true })
    }
    // UPDATE NUMBER OF ATTEMPTS ON PROJECT
    case 'patch': {
      let projectId = parseFormNumber(body, 'id')
      let attempts = parseFormNumber(body, 'attempts')

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
      await updateProjectAttempts(projectId, attempts)
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
  let session = await findOrCreateInProgressSession('brookslybrand@gmail.com')

  let result: LoaderData = { session }
  return json(result)
}

export default function NewSession() {
  let { session } = useLoaderData<Serialized<LoaderData>>()
  let projectsByGrade = useProjectsByGrade(session.projects)

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
            />
          ))}
        </section>
      </section>
    </main>
  )
}

function useProjectsByGrade(projects: Project[]) {
  return useMemo(() => {
    let projectsByGrade: { [key in Grade]: Project[] } = {
      vb_v0: [],
      v1_v2: [],
      v3_v4: [],
      v5_v6: [],
      v7_v8: [],
      v9_v10: [],
      v11_: [],
    }
    for (let project of projects) {
      let { grade } = project
      if (!isGrade(grade)) throw new Error('Invalid grade')
      projectsByGrade[grade].push(project)
    }
    return projectsByGrade
  }, [projects])
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
        className="font-normal text-gray-800 mt-2 pr-2"
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
}

function GradeControl({ sessionId, grade, projects }: GradeControlProps) {
  let fetcher = useFetcher()
  let disabled = fetcher.state !== 'idle'

  return (
    <div className="py-8">
      <fetcher.Form method="post" replace>
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
      </fetcher.Form>
      <p className="pt-2 text-xl text-gray-400">Attempts</p>
      <ul>
        {projects.map(({ id, attempts }) => (
          <ProjectControl key={id} id={id} attempts={attempts} />
        ))}
      </ul>
    </div>
  )
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

type ProjectControlProps = {
  id: number
  attempts: number
}
function ProjectControl({ id, attempts }: ProjectControlProps) {
  let deleteProjectFetcher = useFetcherWithHiddenMethod()
  let deletingProject = deleteProjectFetcher.state !== 'idle'

  return (
    <li className="flex items-center justify-between">
      <AttemptsControl
        projectId={id}
        attempts={attempts}
        disabled={deletingProject}
      />
      <deleteProjectFetcher.Form method="delete" replace>
        <input type="hidden" name="id" value={id} />
        <button type="submit" className="group" disabled={deletingProject}>
          <VisuallyHidden>remove project</VisuallyHidden>
          <RemoveIcon />
        </button>
      </deleteProjectFetcher.Form>
    </li>
  )
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
  let fetcher = useFetcherWithHiddenMethod()

  let body = fetcher.submission?.formData
  let displayAttempts = body ? parseFormNumber(body, 'attempts') : attempts

  let atMinAttempts = displayAttempts <= 1

  return (
    <fetcher.Form method={'patch'} replace>
      <input type="hidden" name="id" value={projectId} />
      <div className="flex items-center py-4 space-x-4">
        <button
          className="group"
          type="submit"
          name="attempts"
          value={displayAttempts - 1}
          disabled={disabled || atMinAttempts}
        >
          <VisuallyHidden>decrease attempts</VisuallyHidden>
          <MinusIcon />
        </button>

        <span className="text-3xl font-semibold text-gray-700">
          {displayAttempts}
        </span>

        <button
          className="group"
          type="submit"
          name="attempts"
          value={displayAttempts + 1}
          disabled={disabled}
        >
          <VisuallyHidden>increase attempts</VisuallyHidden>
          <PlusIcon />
        </button>
      </div>
    </fetcher.Form>
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

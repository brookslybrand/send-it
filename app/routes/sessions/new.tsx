import { Project } from '.prisma/client'
import clsx from 'clsx'
import { Form, MetaFunction } from 'remix'

export const meta: MetaFunction = () => {
  return {
    title: 'New Session',
  }
}

export default function NewSession() {
  return (
    <main className="flex flex-col w-1/2 m-auto p-8">
      <h1 className="text-6xl text-center">New Session</h1>
      <Form className="py-16 space-y-8" method="post">
        <DateTimeInput id="start-time" name="start-time" label="Start Time" />
        <DateTimeInput id="end-time" name="end-time" label="End Time" />
        <Grade
          label="VB - V0"
          projects={[{ id: 123, grade: 'vbv0', attempts: 0, sessionId: 123 }]}
        />
      </Form>
    </main>
  )
}

type DateTimeInputProps = {
  id: string
  name: string
  label: string
}
function DateTimeInput({ id, name, label }: DateTimeInputProps) {
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
    <div>
      <button
        className={clsx(
          'text-2xl font-bold w-full flex justify-between items-center',
          'text-green-600 hover:text-green-800 active:text-green-900 group'
          // 'border-4 border-gray-200 py-4 pr-2'
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
    </div>
  )
}

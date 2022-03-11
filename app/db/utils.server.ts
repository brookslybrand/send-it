import { db } from '~/db'
import type { Grade, User } from '@prisma/client'

export async function findOrCreateInProgressSession(user: User) {
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

  return session
}

export function createProject(sessionId: string, grade: Grade) {
  return db.session.update({
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
}

export function deleteProject(projectId: string) {
  return db.project.delete({ where: { id: projectId } })
}

export function updateProjectAttempts(projectId: string, rawAttempts: number) {
  let attempts = rawAttempts > 0 ? rawAttempts : 0 // can't have less than 0 attempts
  return db.project.update({
    where: { id: projectId },
    data: { attempts },
  })
}

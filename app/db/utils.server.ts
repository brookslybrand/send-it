import { Grade } from '@prisma/client'
import { db } from '~/db'

export async function findOrCreateInProgressSession(email: string) {
  let user = await db.user.findUnique({
    where: {
      email,
    },
    select: {
      id: true,
    },
  })

  if (!user?.id) {
    throw new Error('User not found')
  }

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

export function createProject(sessionId: number, grade: Grade) {
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

export function deleteProject(projectId: number) {
  return db.project.delete({ where: { id: projectId } })
}

export function updateProjectAttempts(projectId: number, rawAttempts: number) {
  let attempts = rawAttempts > 0 ? rawAttempts : 0 // can't have less than 0 attempts
  return db.project.update({
    where: { id: projectId },
    data: { attempts },
  })
}

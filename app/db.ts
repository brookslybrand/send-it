import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export { prisma }

/**
 * Utility type to give the serialized version of prisma data
 * Adapted from https://stackoverflow.com/a/52910586
 */
export type Serialized<T> = T extends Record<string, unknown>
  ? {
      [P in keyof T]: T[P] extends Date ? string : Serialized<T[P]>
    }
  : T extends Date
  ? string
  : T

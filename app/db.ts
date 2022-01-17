import { PrismaClient } from '@prisma/client'

let db: PrismaClient

declare global {
  // eslint-disable-next-line no-var
  var __db: PrismaClient | undefined
}

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

// this is needed because in development we don't want to restart
// the server with every change, but we want to make sure we don't
// create a new connection to the DB with every change either.
if (process.env.NODE_ENV === 'production') {
  db = new PrismaClient()
  db.$connect()
} else {
  if (!global.__db) {
    global.__db = new PrismaClient()
    global.__db.$connect()
  }
  db = global.__db
}

export { db }

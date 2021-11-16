import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const email = 'brookslybrand@gmail.com'

async function seed() {
  // create the user if they don't already exist
  await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      name: 'Brooks Lybrand',
      email,
    },
  })
}

seed()

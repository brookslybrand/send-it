import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const email = 'brookslybrand@gmail.com'

async function seed() {
  // delete default user if they exist, then recreate them
  try {
    await prisma.user.delete({ where: { email } })
  } catch (error) {
    // do nothing
  }
  await prisma.user.create({
    data: {
      name: 'Brooks Lybrand',
      email,
    },
  })
}

seed()

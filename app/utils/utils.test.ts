import { vi } from 'vitest'
import { sleep } from './sleep.server'
import { inspect } from 'util'

test('sleep returns a promise that resolves after time', async () => {
  vi.useFakeTimers()
  let ms = 1000
  let s = sleep(ms)
  expect(s).toBeInstanceOf(Promise)

  vi.advanceTimersByTime(ms - 1)
  expect(inspect(s)).includes('pending')
  vi.advanceTimersByTime(1)
  await expect(s).resolves.toBeUndefined()
  vi.useRealTimers() // not sure if this cleanup is even necessary
})

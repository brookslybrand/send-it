/**
 * Simpler helper function to simulate slow network requests
 * @param ms
 * @returns
 */
export function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

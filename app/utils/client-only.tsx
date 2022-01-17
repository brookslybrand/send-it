import { useEffect, useState, ReactNode } from 'react'

let hydrating = true

export function useHydrated() {
  let [hydrated, setHydrated] = useState(() => !hydrating)

  useEffect(function hydrate() {
    hydrating = false
    setHydrated(true)
  }, [])

  return hydrated
}

type Props = {
  children: ReactNode
  fallback?: ReactNode
}

export function ClientOnly({ children, fallback = null }: Props) {
  return useHydrated() ? <>{children}</> : <>{fallback}</>
}

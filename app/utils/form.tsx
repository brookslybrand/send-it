import { forwardRef, useMemo } from 'react'
import { Form, useFetcher } from 'remix'
import type { FormMethod, FormProps } from 'remix'
import { useHydrated } from './client-only'

const hiddenMethodName = '_method'

export function FormWithHiddenMethod({
  method,
  children,
  ...props
}: FormProps) {
  const [validMethod, HiddenMethodInput] = useHiddenMethod(method)
  return (
    // use the valid method if we're using JS, otherwise default to either POST or GET
    <Form method={validMethod} {...props}>
      <HiddenMethodInput />
      {children}
    </Form>
  )
}

export function useFetcherWithHiddenMethod<T>(): ReturnType<typeof useFetcher> {
  let fetcher = useFetcher<T>()

  let fetcherWithHiddenMethod = useMemo(() => {
    let Form = forwardRef<HTMLFormElement, FormProps>(
      ({ method, children, ...props }, ref) => {
        let [validMethod, HiddenMethodInput] = useHiddenMethod(method)
        return (
          <fetcher.Form ref={ref} {...props} method={validMethod}>
            <HiddenMethodInput />
            {children}
          </fetcher.Form>
        )
      }
    )
    Form.displayName = 'FormWithHiddenMethod'

    return { ...fetcher, Form }
  }, [fetcher])

  return fetcherWithHiddenMethod
}

type InputProps = React.DetailedHTMLProps<
  React.InputHTMLAttributes<HTMLInputElement>,
  HTMLInputElement
>

/**
 * Returns a valid method ('get' or 'post') and a hidden input element.
 */
export function useHiddenMethod(method: FormProps['method']) {
  const isHydrated = useHydrated()
  const validMethod = isHydrated ? method : getValidMethod(method)
  //  hidden input for non `get` and `post` methods
  const Input = (props: InputProps) => (
    <input
      {...props} // not sure why, but might want to be able to pass more props in
      type="hidden"
      name={hiddenMethodName}
      value={method}
    />
  )
  return [validMethod, Input] as const
}

/**
 * Get the method from the hidden input carrying the true method if it exists,
 * defaulting to the form's method, and attach this to the form data
 * Note: This method calls `request.formData()` and will fail if this is called
 * before invoking this function
 */
export async function addMethodToFormData(request: Request): Promise<FormData> {
  // I'm not sure if this will slow down requests much, since `.formData()` will likely be called outside this function
  let body = await request.formData()
  let method = body.get(hiddenMethodName) ?? request.method

  if (typeof method !== 'string') {
    throw new Error(`Expected method to be a string, got ${typeof method}`)
  }

  const lowerCaseMethod = method.toLowerCase()

  if (!isMethod(lowerCaseMethod)) {
    throw new Error(`Invalid method: ${method}`)
  }

  body.append('method', lowerCaseMethod)

  return body
}

/**
 * Only `get` and `post` are supported by browsers. This is a simple utility function
 * that converts all http methods into one of these two.
 * @param method
 * @returns
 */
function getValidMethod(method: FormProps['method']) {
  switch (method) {
    case undefined:
    case 'get':
      return 'get'
    case 'post':
    case 'put':
    case 'patch':
    case 'delete':
      return 'post'
    default:
      throw new Error(`Unsupported method: ${method}`)
  }
}

function isMethod(method: string): method is FormMethod {
  switch (method) {
    case 'get':
    case 'post':
    case 'put':
    case 'patch':
    case 'delete':
      return true
    default:
      return false
  }
}

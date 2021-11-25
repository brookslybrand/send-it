import { Form, FormMethod } from 'remix'

import type { FormProps } from 'remix'

const hiddenMethodName = '_method'

export function FormWithHiddenMethod({
  method,
  children,
  ...props
}: FormProps) {
  return (
    <Form method={getValidMethod(method)} {...props}>
      {
        // add a hidden input for non `get` and `post` methods
        method && ['put', 'patch', 'delete'].includes(method) ? (
          <input type="hidden" name={hiddenMethodName} value={method} />
        ) : null
      }
      {children}
    </Form>
  )
}

/**
 * Get the method from the hidden input carrying the true method if it exists, defaulting to the form's method
 * @param body
 */
export async function getMethod(request: Request): Promise<FormMethod> {
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

  return lowerCaseMethod
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

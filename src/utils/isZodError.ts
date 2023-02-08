import { ZodError } from 'zod'

export function isZodError<T = any>(err: any): err is ZodError<T> {
  return err instanceof ZodError
}

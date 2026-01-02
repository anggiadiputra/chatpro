import type { Context } from 'hono'

export async function errorHandler(c: Context, next: () => Promise<void>) {
  try {
    await next()
  } catch (err) {
    // Log the error
    console.error('Error:', err)
    
    // Set appropriate status code and message
    let status = 500
    let message = 'Internal Server Error'
    
    if (err instanceof Error) {
      if (err.name === 'ValidationError') {
        status = 400
        message = err.message
      } else if (err.name === 'UnauthorizedError') {
        status = 401
        message = 'Unauthorized'
      } else if (err.name === 'ForbiddenError') {
        status = 403
        message = 'Forbidden'
      } else if (err.name === 'NotFoundError') {
        status = 404
        message = 'Not Found'
      } else if (err.name === 'ConflictError') {
        status = 409
        message = 'Conflict'
      }
    }
    
    return c.json({
      error: {
        code: err instanceof Error ? err.name : 'InternalServerError',
        message,
        timestamp: new Date().toISOString()
      }
    }, { status } as any)
  }
}

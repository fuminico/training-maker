import { NextResponse } from 'next/server'

export type ApiResponse<T> = {
  data: T | null
  error: {
    code: string
    message: string
  } | null
}

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json<ApiResponse<T>>(
    {
      data,
      error: null,
    },
    { status }
  )
}

export function errorResponse(
  code: string,
  message: string,
  status = 400
) {
  return NextResponse.json<ApiResponse<never>>(
    {
      data: null,
      error: {
        code,
        message,
      },
    },
    { status }
  )
}

export function unauthorizedResponse(message = 'Unauthorized') {
  return errorResponse('UNAUTHORIZED', message, 401)
}

export function notFoundResponse(message = 'Not found') {
  return errorResponse('NOT_FOUND', message, 404)
}

export function serverErrorResponse(message = 'Internal server error') {
  return errorResponse('SERVER_ERROR', message, 500)
}

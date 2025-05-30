import { NextRequest, NextResponse } from 'next/server'
import { getServerSideUser } from './lib/payload-utils'

export async function middleware(req: NextRequest) {
  const { nextUrl, cookies } = req
  const { user } = await getServerSideUser(cookies)

  // Prevent authenticated users from accessing auth routes
  const restrictedPaths = ['/sign-in', '/sign-up']

  if (user && restrictedPaths.includes(nextUrl.pathname)) {
    return NextResponse.redirect(
      new URL('/', process.env.NEXT_PUBLIC_SERVER_URL)
    )
  }

  return NextResponse.next()
}


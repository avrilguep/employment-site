import { NextRequest, NextResponse } from "next/server"

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (pathname.startsWith("/api/")) return NextResponse.next()

  const appPassword = process.env.APP_PASSWORD
  const cookie = req.cookies.get("app_access")?.value

  if (cookie === appPassword) return NextResponse.next()

  if (pathname === "/enter") return NextResponse.next()

  const url = req.nextUrl.clone()
  url.pathname = "/enter"
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
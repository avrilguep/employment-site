import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const { password } = await req.json()
  const appPassword = process.env.APP_PASSWORD

  if (password !== appPassword) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set("app_access", appPassword || "", {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  })

  return res
}
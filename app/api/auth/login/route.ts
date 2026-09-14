export const dynamic = "force-static";

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { signToken } from '@/lib/auth'
import { checkRateLimit, resetRateLimit } from '@/lib/rate-limit'

function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) return forwardedFor.split(',')[0].trim()
  return request.headers.get('x-real-ip') || 'unknown'
}

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    // Previously this endpoint had no limit at all — unlimited password
    // guesses were possible. Cap by IP (broad spray protection) and by
    // IP+email (tighter protection per targeted account).
    const ip = getClientIp(request)
    const normalizedEmail = email.toLowerCase()
    const ipLimit = checkRateLimit(`login:ip:${ip}`, 20, 15 * 60 * 1000)
    const accountLimit = checkRateLimit(`login:acct:${ip}:${normalizedEmail}`, 5, 15 * 60 * 1000)

    if (!ipLimit.allowed || !accountLimit.allowed) {
      const retryAfterSeconds = !ipLimit.allowed
        ? (ipLimit as { retryAfterSeconds: number }).retryAfterSeconds
        : (accountLimit as { retryAfterSeconds: number }).retryAfterSeconds
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Successful login — clear the attempt counters for this account/IP.
    resetRateLimit(`login:acct:${ip}:${normalizedEmail}`)

    const token = signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    })

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    })

    response.cookies.set({
      name: 'cms_session',
      value: token,
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: 'lax',
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

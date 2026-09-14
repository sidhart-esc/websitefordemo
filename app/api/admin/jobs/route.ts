export const dynamic = "force-static";

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireUser, requireRole, isAuthResult } from '@/lib/auth'

export async function GET() {
  // Previously had no auth check at all — anyone could fetch every job
  // listing, including inactive ones, without logging in.
  const auth = await requireUser()
  if (isAuthResult(auth)) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const jobs = await prisma.jobListing.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(jobs)
  } catch (error) {
    console.error('Error fetching jobs:', error)
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  // Jobs can be managed by ADMIN or HR (matches the seeded "Talent
  // Acquisition Partner" HR account's actual job).
  const auth = await requireRole(['ADMIN', 'HR'])
  if (isAuthResult(auth)) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const body = await request.json()
    const { title, department, location, type, experience, salary, description, requirements, active } = body

    if (!title || !department || !location || !type || !description) {
      return NextResponse.json({ error: 'Title, department, location, type, and description are required' }, { status: 400 })
    }

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '') + '-' + Date.now().toString().slice(-4)

    const job = await prisma.jobListing.create({
      data: {
        title,
        slug,
        department,
        location,
        type,
        experience: experience || null,
        salary: salary || null,
        description,
        requirements: requirements || null,
        active: active ?? true,
      },
    })

    return NextResponse.json(job, { status: 201 })
  } catch (error) {
    console.error('Error creating job listing:', error)
    return NextResponse.json({ error: 'Failed to create job listing' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const auth = await requireRole(['ADMIN', 'HR'])
  if (isAuthResult(auth)) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const body = await request.json()
    const { id, title, department, location, type, experience, salary, description, requirements, active } = body

    if (!id) {
      return NextResponse.json({ error: 'Job ID required' }, { status: 400 })
    }

    const job = await prisma.jobListing.update({
      where: { id },
      data: {
        title,
        department,
        location,
        type,
        experience,
        salary,
        description,
        requirements,
        active,
      },
    })

    return NextResponse.json(job)
  } catch (error) {
    console.error('Error updating job listing:', error)
    return NextResponse.json({ error: 'Failed to update job listing' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const auth = await requireRole(['ADMIN', 'HR'])
  if (isAuthResult(auth)) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID parameter required' }, { status: 400 })
    }

    await prisma.jobListing.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting job listing:', error)
    return NextResponse.json({ error: 'Failed to delete job listing' }, { status: 500 })
  }
}

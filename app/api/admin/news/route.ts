export const dynamic = "force-static";

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireUser, requireRole, isAuthResult } from '@/lib/auth'

export async function GET() {
  // Previously had no auth check at all — anyone could fetch every news
  // item, including unpublished ones, without logging in.
  const auth = await requireUser()
  if (isAuthResult(auth)) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const news = await prisma.news.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(news)
  } catch (error) {
    console.error('Error fetching news:', error)
    return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  // News is ADMIN-only — previously any authenticated user (including the
  // HR account) could create news items.
  const auth = await requireRole(['ADMIN'])
  if (isAuthResult(auth)) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const body = await request.json()
    const { title, category, date, readTime, excerpt, content, imageUrl, published } = body

    if (!title || !content || !excerpt) {
      return NextResponse.json({ error: 'Title, content, and excerpt are required' }, { status: 400 })
    }

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '') + '-' + Date.now().toString().slice(-4)

    const news = await prisma.news.create({
      data: {
        title,
        slug,
        category: category || 'General',
        date: date || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        readTime: readTime || '3 min read',
        excerpt,
        content,
        imageUrl: imageUrl || null,
        published: published ?? true,
      },
    })

    return NextResponse.json(news, { status: 201 })
  } catch (error) {
    console.error('Error creating news:', error)
    return NextResponse.json({ error: 'Failed to create news' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const auth = await requireRole(['ADMIN'])
  if (isAuthResult(auth)) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const body = await request.json()
    const { id, title, category, date, readTime, excerpt, content, imageUrl, published } = body

    if (!id) {
      return NextResponse.json({ error: 'News ID is required' }, { status: 400 })
    }

    const news = await prisma.news.update({
      where: { id },
      data: {
        title,
        category,
        date,
        readTime,
        excerpt,
        content,
        imageUrl,
        published,
      },
    })

    return NextResponse.json(news)
  } catch (error) {
    console.error('Error updating news:', error)
    return NextResponse.json({ error: 'Failed to update news' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const auth = await requireRole(['ADMIN'])
  if (isAuthResult(auth)) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID parameter required' }, { status: 400 })
    }

    await prisma.news.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting news:', error)
    return NextResponse.json({ error: 'Failed to delete news' }, { status: 500 })
  }
}

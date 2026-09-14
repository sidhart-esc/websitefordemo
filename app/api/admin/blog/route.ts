export const dynamic = "force-static";

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireUser, requireRole, isAuthResult } from '@/lib/auth'

export async function GET() {
  // Previously had no auth check at all — anyone could fetch every blog
  // post, including unpublished drafts, without logging in.
  const auth = await requireUser()
  if (isAuthResult(auth)) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const posts = await prisma.blogPost.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(posts)
  } catch (error) {
    console.error('Error fetching blog posts:', error)
    return NextResponse.json({ error: 'Failed to fetch blog posts' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  // Blog content is ADMIN-only — previously any authenticated user
  // (including the HR account) could create posts.
  const auth = await requireRole(['ADMIN'])
  if (isAuthResult(auth)) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }
  const user = auth

  try {
    const body = await request.json()
    const { title, category, date, readTime, excerpt, content, authorName, authorRole, coverImageUrl, published } = body

    if (!title || !content || !excerpt) {
      return NextResponse.json({ error: 'Title, content, and excerpt are required' }, { status: 400 })
    }

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '') + '-' + Date.now().toString().slice(-4)

    const post = await prisma.blogPost.create({
      data: {
        title,
        slug,
        category: category || 'Generative AI',
        date: date || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        readTime: readTime || '5 min read',
        excerpt,
        content,
        authorName: authorName || user.name,
        authorRole: authorRole || 'Editor',
        coverImageUrl: coverImageUrl || null,
        published: published ?? true,
      },
    })

    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    console.error('Error creating blog post:', error)
    return NextResponse.json({ error: 'Failed to create blog post' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const auth = await requireRole(['ADMIN'])
  if (isAuthResult(auth)) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const body = await request.json()
    const { id, title, category, date, readTime, excerpt, content, authorName, authorRole, coverImageUrl, published } = body

    if (!id) {
      return NextResponse.json({ error: 'Blog post ID required' }, { status: 400 })
    }

    const post = await prisma.blogPost.update({
      where: { id },
      data: {
        title,
        category,
        date,
        readTime,
        excerpt,
        content,
        authorName,
        authorRole,
        coverImageUrl,
        published,
      },
    })

    return NextResponse.json(post)
  } catch (error) {
    console.error('Error updating blog post:', error)
    return NextResponse.json({ error: 'Failed to update blog post' }, { status: 500 })
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

    await prisma.blogPost.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting blog post:', error)
    return NextResponse.json({ error: 'Failed to delete blog post' }, { status: 500 })
  }
}

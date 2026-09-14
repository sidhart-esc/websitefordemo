export const dynamic = "force-static";

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const [news, jobs, blogs] = await Promise.all([
      prisma.news.findMany({
        where: { published: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.jobListing.findMany({
        where: { active: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.blogPost.findMany({
        where: { published: true },
        orderBy: { createdAt: 'desc' },
      }),
    ])

    return NextResponse.json({ news, jobs, blogs })
  } catch (error) {
    console.error('Error fetching public CMS data:', error)
    return NextResponse.json({ error: 'Failed to fetch public content' }, { status: 500 })
  }
}

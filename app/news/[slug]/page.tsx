'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Calendar, ArrowLeft, Building2, UserCircle2, Clock } from 'lucide-react'
import CTAStrip from '@/components/sections/CTAStrip'
import PageTransition from '@/components/ui/PageTransition'

interface NewsItem {
  id: string
  title: string
  slug: string
  category: string
  date: string
  readTime: string
  excerpt: string
  content: string
  imageUrl?: string | null
}

export async function generateStaticParams() {
  return [];
}

export default function NewsDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params)
  const [article, setArticle] = useState<NewsItem | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadArticle() {
      try {
        const res = await fetch('/api/public/data')
        const data = await res.json()
        if (data.news && Array.isArray(data.news)) {
          const found = data.news.find((n: NewsItem) => n.slug === resolvedParams.slug)
          if (found) setArticle(found)
        }
      } catch (err) {
        console.error('Failed to load article:', err)
      } finally {
        setLoading(false)
      }
    }
    loadArticle()
  }, [resolvedParams.slug])

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-gray-400">Loading announcement...</p>
      </div>
    )
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
        <h1 className="text-3xl font-bold mb-4">News Release Not Found</h1>
        <p className="text-gray-400 mb-8">The requested announcement could not be found or has been removed.</p>
        <Link href="/news" className="px-6 py-3 rounded-xl bg-red-600 text-white font-semibold flex items-center space-x-2">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All News</span>
        </Link>
      </div>
    )
  }

  return (
    <PageTransition>
      <article className="min-h-screen bg-black text-white pt-32 pb-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/news"
            className="inline-flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-white mb-8 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All News</span>
          </Link>

          {/* Header */}
          <div className="space-y-4 mb-8">
            <div className="flex items-center space-x-3 text-xs font-semibold">
              <span className="px-3 py-1 rounded-full bg-red-950/80 border border-red-800/50 text-red-400 uppercase tracking-wider">
                {article.category}
              </span>
              <span className="text-gray-400 flex items-center gap-1">
                <Calendar size={13} />
                {article.date}
              </span>
              <span className="text-gray-400 flex items-center gap-1">
                <Clock size={13} />
                {article.readTime}
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
              {article.title}
            </h1>

            <p className="text-lg text-gray-300 leading-relaxed font-light border-l-2 border-red-600 pl-4 py-1">
              {article.excerpt}
            </p>
          </div>

          {/* Featured Image */}
          {article.imageUrl && (
            <div className="relative w-full h-80 sm:h-96 rounded-2xl overflow-hidden mb-12 border border-white/10">
              <Image src={article.imageUrl} alt={article.title} fill className="object-cover" priority />
            </div>
          )}

          {/* Article Body */}
          <div className="prose prose-invert prose-lg max-w-none text-gray-300 leading-relaxed space-y-6">
            {article.content.split('\n\n').map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>

          {/* Author Footer */}
          <div className="mt-12 pt-8 border-t border-white/10 flex items-center justify-between text-xs text-gray-400">
            <span className="flex items-center gap-1.5">
              <UserCircle2 size={16} />
              Published by ESC Editorial Team
            </span>
            <span>ESC Utility Services</span>
          </div>
        </div>
      </article>

      <CTAStrip />
    </PageTransition>
  )
}

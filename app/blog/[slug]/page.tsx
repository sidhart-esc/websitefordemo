'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Calendar, ArrowLeft, Clock, User } from 'lucide-react'
import CTAStrip from '@/components/sections/CTAStrip'
import PageTransition from '@/components/ui/PageTransition'

export const dynamicParams = false;

interface BlogPostItem {
  id: string
  title: string
  slug: string
  category: string
  date: string
  readTime: string
  excerpt: string
  content: string
  authorName?: string | null
  authorRole?: string | null
  coverImageUrl?: string | null
}

export default function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params)
  const [article, setArticle] = useState<BlogPostItem | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadArticle() {
      try {
        const res = await fetch('/api/public/data')
        const data = await res.json()
        if (data.blogs && Array.isArray(data.blogs)) {
          const found = data.blogs.find((b: BlogPostItem) => b.slug === resolvedParams.slug)
          if (found) setArticle(found)
        }
      } catch (err) {
        console.error('Failed to load blog article:', err)
      } finally {
        setLoading(false)
      }
    }
    loadArticle()
  }, [resolvedParams.slug])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f1f5f9] text-slate-900 flex items-center justify-center">
        <p className="text-slate-600 font-medium">Loading article...</p>
      </div>
    )
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-[#f1f5f9] text-slate-900 flex flex-col items-center justify-center p-4">
        <h1 className="text-3xl font-extrabold mb-4 font-plus-jakarta">Blog Article Not Found</h1>
        <p className="text-slate-600 mb-8">The requested blog post could not be found.</p>
        <Link href="/blog" className="px-6 py-3 rounded-xl bg-[#962228] text-white font-semibold flex items-center space-x-2 shadow-md">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Articles</span>
        </Link>
      </div>
    )
  }

  return (
    <PageTransition>
      <article className="min-h-screen bg-gradient-to-b from-[#cbd5e1] via-[#f1f5f9] to-[#cbd5e1] text-slate-900 pt-32 pb-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/blog"
            className="inline-flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-[#962228] mb-8 transition font-outfit"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Articles</span>
          </Link>

          {/* Header */}
          <div className="space-y-6 mb-10">
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
              <span className="px-3.5 py-1.5 rounded-full bg-[#962228] text-white uppercase tracking-wider font-outfit shadow-sm">
                {article.category}
              </span>
              <span className="text-slate-600 flex items-center gap-1.5 font-mono">
                <Calendar size={13} className="text-[#962228]" />
                {article.date}
              </span>
              <span className="text-slate-600 flex items-center gap-1.5 font-mono">
                <Clock size={13} className="text-[#962228]" />
                {article.readTime}
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight font-plus-jakarta">
              {article.title}
            </h1>

            <p className="text-lg sm:text-xl text-slate-700 leading-relaxed font-normal border-l-4 border-[#962228] pl-5 py-1">
              {article.excerpt}
            </p>

            {/* Author Header Meta Card */}
            <div className="flex items-center gap-4 py-4 px-6 rounded-2xl bg-white/85 border border-slate-300/90 shadow-md backdrop-blur-xl">
              <div className="w-12 h-12 rounded-full bg-[#962228] text-white flex items-center justify-center font-bold text-lg shadow-md flex-shrink-0">
                {article.authorName ? article.authorName.charAt(0) : 'E'}
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900 font-plus-jakarta">{article.authorName || 'ESC Technical Specialist'}</h3>
                <p className="text-xs text-[#962228] font-bold font-outfit">{article.authorRole || 'Author & Utility Technology Lead'}</p>
              </div>
              <div className="hidden sm:flex items-center gap-4 text-xs text-slate-500 border-l border-slate-200 pl-6 font-outfit font-semibold">
                <span>ESC Utility Services</span>
              </div>
            </div>
          </div>

          {/* Cover Image */}
          {article.coverImageUrl && (
            <div className="relative w-full h-80 sm:h-[450px] rounded-3xl overflow-hidden mb-12 border border-slate-300 shadow-xl bg-slate-900">
              <Image src={article.coverImageUrl} alt={article.title} fill className="object-cover" priority />
            </div>
          )}

          {/* Article Body */}
          <div className="prose prose-slate prose-lg max-w-none text-slate-800 leading-relaxed space-y-6 font-normal">
            {article.content.split('\n\n').map((paragraph, index) => (
              <p key={index} className="text-slate-800 text-base sm:text-lg leading-relaxed">{paragraph}</p>
            ))}
          </div>

          {/* About the Author Spotlight Section */}
          <div className="mt-16 p-8 rounded-3xl bg-white/90 border border-slate-300/90 shadow-xl flex flex-col sm:flex-row items-start sm:items-center gap-6 backdrop-blur-xl">
            <div className="w-16 h-16 rounded-2xl bg-[#962228] flex items-center justify-center text-white font-extrabold text-2xl shadow-lg flex-shrink-0">
              {article.authorName ? article.authorName.charAt(0) : 'E'}
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#962228] font-outfit block mb-1">
                Written By
              </span>
              <h4 className="text-xl font-bold text-slate-900 font-plus-jakarta">{article.authorName || 'ESC Technical Specialist'}</h4>
              <p className="text-xs text-[#962228] font-bold font-outfit mb-2">{article.authorRole || 'Author & Utility Software Specialist'}</p>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                Author and technology lead at ESC Utility Services Pvt. Ltd. &bull; Specializing in energy grid digital transformation, software engineering, and intelligent automation.
              </p>
            </div>
          </div>
        </div>
      </article>

      <CTAStrip />
    </PageTransition>
  )
}

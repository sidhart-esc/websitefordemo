export const dynamic = "force-static";

import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { requireUser, isAuthResult } from '@/lib/auth'

// Only image types are ever needed here (cover images for blog/news posts).
// Previously ANY file type was accepted and served statically from
// /uploads/*, including .html/.svg/.js — a stored-XSS vector on this site's
// own origin — with no size limit at all.
const ALLOWED_MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
}
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

export async function POST(request: Request) {
  const auth = await requireUser()
  if (isAuthResult(auth)) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    const ext = ALLOWED_MIME_TO_EXT[file.type]
    if (!ext) {
      return NextResponse.json(
        { error: 'Unsupported file type. Only JPEG, PNG, WebP, and GIF images are allowed.' },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File is too large. Maximum size is 5MB.' },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    await mkdir(uploadDir, { recursive: true })

    // Extension comes from the validated MIME type above, never from the
    // client-supplied filename, so a name like "shell.html" can't smuggle
    // an executable/renderable extension through.
    const baseName = path.parse(file.name).name.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 60) || 'file'
    const fileName = `${Date.now()}_${baseName}${ext}`
    const filePath = path.join(uploadDir, fileName)

    await writeFile(filePath, buffer)
    const publicUrl = `/uploads/${fileName}`

    return NextResponse.json({ url: publicUrl, fileName })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}

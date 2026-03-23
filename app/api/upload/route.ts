// app/api/upload/route.ts
// Handles temporary Vercel Blob storage for pending uploads (before admin approval)
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { requireAuth } from '@/lib/auth-middleware';

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/jpeg',
  'image/png',
  'image/webp',
];

const MAX_SIZE_BYTES = 64 * 1024 * 1024; // 64 MB

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    if (!user.emailVerified) {
      return NextResponse.json({ success: false, message: 'Please verify your email before uploading' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) return NextResponse.json({ success: false, message: 'No file provided' }, { status: 400 });
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ success: false, message: `File type not allowed: ${file.type}` }, { status: 400 });
    }
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ success: false, message: 'File exceeds 64 MB limit' }, { status: 400 });
    }

    // Sanitise filename
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const blobPath = `pending/${user.userId}/${Date.now()}_${safeName}`;

    const blob = await put(blobPath, file, {
      access: 'public',
      contentType: file.type,
    });

    // Compute a simple hash from size + name for duplicate detection
    // (real hash requires reading bytes which is expensive — good enough for MVP)
    const fileHash = Buffer.from(`${file.size}-${file.name}-${user.userId}`).toString('base64');

    return NextResponse.json({
      success: true,
      data: {
        blobUrl: blob.url,
        fileSize: file.size,
        fileHash,
        fileName: file.name,
        contentType: file.type,
      },
    });
  } catch (error: any) {
    if (error?.message === 'Unauthorized') return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    console.error('Upload error:', error);
    return NextResponse.json({ success: false, message: 'Upload failed' }, { status: 500 });
  }
}
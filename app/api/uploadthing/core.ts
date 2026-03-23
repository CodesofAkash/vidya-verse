// app/api/uploadthing/core.ts
import { createUploadthing, type FileRouter } from 'uploadthing/next';
import { auth } from '@/auth';

const f = createUploadthing();

const ALLOWED_FILES = {
  pdf: { maxFileSize: '64MB' as const, maxFileCount: 1 },
  image: { maxFileSize: '16MB' as const, maxFileCount: 1 },
} as const;

export const ourFileRouter = {
  // Regular users upload here when submitting a resource for review
  // After upload, client saves metadata to pending_uploads via POST /api/resources
  pendingUploader: f(ALLOWED_FILES)
    .middleware(async () => {
      const session = await auth();
      if (!session?.user?.id) throw new Error('Unauthorized');
      const emailVerified = (session.user as any).emailVerified;
      if (!emailVerified) throw new Error('Please verify your email before uploading');
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId, url: file.url, key: file.key, size: file.size };
    }),

  // Admins can upload a replacement file when approving (optional)
  adminUploader: f(ALLOWED_FILES)
    .middleware(async () => {
      const session = await auth();
      if (!session?.user?.id) throw new Error('Unauthorized');
      const roles: string[] = (session.user as any).roles ?? [];
      if (!roles.some((r) => r === 'ADMIN' || r === 'OWNER')) throw new Error('Forbidden');
      return { adminId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.adminId, url: file.url, key: file.key };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
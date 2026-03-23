// app/api/uploadthing/core.ts
// UploadThing router — handles permanent file storage after admin approval
import { createUploadthing, type FileRouter } from 'uploadthing/next';
import { auth } from '@/auth';

const f = createUploadthing();

export const ourFileRouter = {
  // Called by admin when they approve a pending upload — moves file to permanent storage
  resourceUploader: f({
    pdf: { maxFileSize: '64MB', maxFileCount: 1 },
    'application/msword': { maxFileSize: '32MB', maxFileCount: 1 },
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { maxFileSize: '32MB', maxFileCount: 1 },
    'application/vnd.ms-powerpoint': { maxFileSize: '64MB', maxFileCount: 1 },
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': { maxFileSize: '64MB', maxFileCount: 1 },
    image: { maxFileSize: '16MB', maxFileCount: 1 },
  })
    .middleware(async () => {
      const session = await auth();
      if (!session?.user?.id) throw new Error('Unauthorized');
      const roles: string[] = (session.user as any).roles ?? [];
      if (!roles.some((r) => r === 'ADMIN' || r === 'OWNER')) {
        throw new Error('Forbidden — only admins can trigger permanent upload');
      }
      return { adminId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // Return the key and url so the calling route can save to DB
      return { uploadedBy: metadata.adminId, url: file.url, key: file.key };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
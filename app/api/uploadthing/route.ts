// app/api/upload/route.ts
// No longer used. Uploads go directly through UploadThing (/api/uploadthing).
import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { success: false, message: "Deprecated. Use /api/uploadthing instead." },
    { status: 410 }
  );
}
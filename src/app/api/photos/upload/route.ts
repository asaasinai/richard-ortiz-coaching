import { NextResponse } from "next/server"
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client"

// Token exchange for client-direct Blob uploads. The browser uploads straight
// to Vercel Blob (bypasses the 4.5MB serverless body limit — phone camera
// originals can be 15MB+), this route only signs the request.
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody
  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"],
        maximumSizeInBytes: 50 * 1024 * 1024, // generous — covers uncompressed 48MP phone originals
        addRandomSuffix: true,
      }),
      // Runs on Vercel after the blob lands; we persist metadata at form
      // submit instead, so nothing to do here.
      onUploadCompleted: async () => {},
    })
    return NextResponse.json(jsonResponse)
  } catch (err) {
    console.error("[photos/upload]", err)
    return NextResponse.json({ error: String(err) }, { status: 400 })
  }
}

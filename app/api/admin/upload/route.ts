import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/session'
import { uploadImage } from '@/lib/cloudinary'
import { ok, fail } from '@/lib/api-response'

// POST /api/admin/upload — admin only, multipart/form-data
// body: FormData with "file" (image) and "folder" ("products" | "categories")
export async function POST(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin()
    if (!adminCheck.ok) return fail(adminCheck.error, adminCheck.status)

    let formData: FormData
    try {
      formData = await request.formData()
    } catch {
      return fail('Invalid form data', 400)
    }

    const file = formData.get('file')
    const folder = formData.get('folder')

    if (!(file instanceof File)) return fail('No file provided', 400)
    if (folder !== 'products' && folder !== 'categories') {
      return fail('folder must be "products" or "categories"', 400)
    }

    const result = await uploadImage(file, folder)
    return ok(result, 201)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upload failed'
    // our own validation errors (type/size) — safe to surface
    if (message.includes('Only JPG') || message.includes('under 5MB')) {
      return fail(message, 400)
    }
    console.error('Upload error:', err)
    return fail('Upload failed', 500)
  }
}
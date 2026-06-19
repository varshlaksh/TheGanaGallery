import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key:    process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
})

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5MB

export async function uploadImage(
  file: File,
  folder: 'products' | 'categories'
): Promise<{ url: string; publicId: string }> {

  // Validate MIME type — check actual content, not just extension
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Only JPG, PNG, and WebP images are allowed')
  }

  if (file.size > MAX_SIZE_BYTES) {
    throw new Error('Image must be under 5MB')
  }

  // Convert File to base64 data URI for Cloudinary upload
  const arrayBuffer = await file.arrayBuffer()
  const base64 = Buffer.from(arrayBuffer).toString('base64')
  const dataUri = `data:${file.type};base64,${base64}`

  const result = await cloudinary.uploader.upload(dataUri, {
    folder:          `ganagallery/${folder}`,
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    max_bytes:       MAX_SIZE_BYTES,
    transformation: [
      { width: 1200, height: 1200, crop: 'limit' }, // cap resolution
      { quality: 'auto', fetch_format: 'auto' },      // auto WebP conversion
    ],
  })

  return { url: result.secure_url, publicId: result.public_id }
}

export async function deleteImage(publicId: string) {
  await cloudinary.uploader.destroy(publicId)
}
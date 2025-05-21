import { NextRequest, NextResponse } from 'next/server';
import cloudinary from '@/utils/cloudinary';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  // Konfigurasi Cloudinary DI DALAM HANDLER
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  console.log('CLOUDINARY ENV:', process.env.CLOUDINARY_CLOUD_NAME, process.env.CLOUDINARY_API_KEY, process.env.CLOUDINARY_API_SECRET);

  const formData = await req.formData();
  const file = formData.get('file');
  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }
  // @ts-ignore
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const filename = `${Date.now()}-${file.name}`;
  try {
    // Upload ke Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { folder: 'linkedfriend', public_id: filename, resource_type: 'image' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        )
        .end(buffer);
    });
    // @ts-ignore
    const url = uploadResult.secure_url;
    return NextResponse.json({ url });
  } catch (err: any) {
    console.error('UPLOAD ERROR:', err);
    return NextResponse.json({ error: 'Failed to upload to Cloudinary', detail: err.message }, { status: 500 });
  }
}

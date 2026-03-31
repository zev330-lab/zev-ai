import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const ext = file.name?.split('.').pop() || 'webm';
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from('discovery-audio')
      .upload(fileName, buffer, {
        contentType: file.type || 'audio/webm',
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }

    const { data: urlData } = supabase.storage
      .from('discovery-audio')
      .getPublicUrl(fileName);

    return NextResponse.json({ url: urlData.publicUrl });
  } catch {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}

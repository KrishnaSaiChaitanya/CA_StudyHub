import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { createClient as createServerClient } from '@/utils/supabase/server';

export async function POST(req: Request) {
  try {
    // 1. Authenticate user
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    const adminEmails = (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map(email => email.trim().toLowerCase())
      .filter(email => email.length > 0);

    if (!user || !user.email || !adminEmails.includes(user.email.toLowerCase())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse form data
    const data = await req.formData();
    const file = data.get('file') as File;
    const category = data.get('category') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (!category) {
      return NextResponse.json({ error: 'No category selected' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // 3. Ensure 'planners' bucket exists
    const { data: buckets, error: bucketsError } = await adminClient.storage.listBuckets();
    if (bucketsError) {
      console.error('List buckets error:', bucketsError);
      return NextResponse.json({ error: 'Failed to access storage: ' + bucketsError.message }, { status: 500 });
    }
    const plannersBucketExists = buckets?.some(b => b.id === 'planners');

    if (!plannersBucketExists) {
      const { error: createError } = await adminClient.storage.createBucket('planners', {
        public: true,
        allowedMimeTypes: ['application/pdf'],
      });
      if (createError) {
        console.error('Failed to create planners bucket:', createError);
        return NextResponse.json({ error: 'Failed to create planners bucket: ' + createError.message }, { status: 500 });
      }
    }

    // Convert file to Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Sanitize filename to prevent directory traversal
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const path = `${category}/${Date.now()}_${sanitizedFilename}`;

    // 4. Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await adminClient.storage
      .from('planners')
      .upload(path, buffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return NextResponse.json({ error: 'Upload failed: ' + uploadError.message }, { status: 500 });
    }

    // 5. Get public URL
    const { data: urlData } = adminClient.storage.from('planners').getPublicUrl(path);

    return NextResponse.json({ url: urlData.publicUrl });
  } catch (error: any) {
    console.error('Upload API error:', error);
    return NextResponse.json({ error: 'Internal Server Error: ' + error.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createUploadUrl } from '../../actions-new';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Create upload URL
    const uploadResult = await createUploadUrl();

    return NextResponse.json(uploadResult);
  } catch (error) {
    console.error('Error creating upload URL:', error);
    return NextResponse.json(
      { error: 'Failed to create upload URL' },
      { status: 500 }
    );
  }
}

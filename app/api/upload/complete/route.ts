import { NextRequest, NextResponse } from 'next/server';
import { queueTranscodeJob } from '@/lib/queue/video-jobs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { uploadId, assetId, videoUrl } = body;

    if (!uploadId || !assetId || !videoUrl) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Queue transcoding job
    await queueTranscodeJob(assetId, videoUrl, {
      quality: 'medium',
      outputFormat: 'hls',
    });

    return NextResponse.json({
      success: true,
      message: 'Upload completed and transcoding queued',
      assetId,
    });
  } catch (error) {
    console.error('Error processing upload:', error);
    return NextResponse.json(
      { error: 'Failed to process upload' },
      { status: 500 }
    );
  }
}

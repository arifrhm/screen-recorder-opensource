import { NextRequest, NextResponse } from 'next/server';
import { getVideoServiceProvider } from '@/lib/providers/VideoServiceProvider';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const playbackId = params.id;
    const serviceProvider = await getVideoServiceProvider();
    const player = serviceProvider.getPlayer();

    // Get signed URL or direct URL
    const url = await player.getSignedPlaybackUrl(playbackId);

    // For HLS streaming, you could either:
    // 1. Proxy through this endpoint
    // 2. Return the signed URL directly
    // 3. Use Cloudflare/CDN for better performance

    return NextResponse.redirect(url);
  } catch (error) {
    console.error('Error getting playback URL:', error);
    return NextResponse.json(
      { error: 'Failed to get playback URL' },
      { status: 500 }
    );
  }
}

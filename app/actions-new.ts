'use server';

import { getVideoServiceProvider } from '../lib/providers/VideoServiceProvider';
import { StorageProviderOptions } from '../lib/providers/interfaces/IStorageProvider';

export async function createUploadUrl() {
  const serviceProvider = await getVideoServiceProvider();
  const storage = serviceProvider.getStorage();

  const uploadId = `upload_${Date.now()}`;

  const uploadResult = await storage.createUpload({
    uploadId,
    corsOrigin: '*',
  });

  return uploadResult;
}

export async function uploadVideo(uploadId: string, formData: FormData) {
  const serviceProvider = await getVideoServiceProvider();
  const storage = serviceProvider.getStorage();
  const transcoder = serviceProvider.getTranscoder();

  const file = formData.get('video') as File;

  if (!file) {
    throw new Error('No video file provided');
  }

  // In a real implementation, you would:
  // 1. Upload the file to storage
  // 2. Trigger transcoding
  // 3. Start transcription

  // For now, return the upload status
  const uploadStatus = await storage.getUploadStatus(uploadId);

  return uploadStatus;
}

export async function startTranscode(assetId: string, videoUrl: string) {
  const serviceProvider = await getVideoServiceProvider();
  const transcoder = serviceProvider.getTranscoder();

  const transcodeId = await transcoder.startTranscode(assetId, {
    inputUrl: videoUrl,
    outputFormat: 'hls',
    quality: 'medium',
  });

  return { transcodeId };
}

export async function getTranscodeStatus(transcodeId: string) {
  const serviceProvider = await getVideoServiceProvider();
  const transcoder = serviceProvider.getTranscoder();

  return await transcoder.getTranscodeStatus(transcodeId);
}

export async function listVideos() {
  try {
    // In a real implementation, you would query your database
    // For now, return empty array
    return [];
  } catch (e) {
    console.error("Error listing videos", e);
    return [];
  }
}

export async function getAssetStatus(playbackId: string) {
  const serviceProvider = await getVideoServiceProvider();
  const transcoder = serviceProvider.getTranscoder();

  const transcodeStatus = await transcoder.getTranscodeStatus(playbackId);

  return {
    status: transcodeStatus.status,
    transcriptStatus: 'preparing',
    transcript: [],
  };
}

export async function generateVideoSummary(playbackId: string) {
  try {
    const serviceProvider = await getVideoServiceProvider();
    const transcript = serviceProvider.getTranscript();
    const storage = serviceProvider.getStorage();

    // In a real implementation, you would:
    // 1. Get transcript ID from database
    // 2. Generate summary using transcript provider

    // For now, return mock summary
    return {
      title: 'Video Summary',
      summary: 'This is a placeholder summary. Implement full flow with transcript.',
      tags: ['video', 'demo'],
    };
  } catch (error) {
    console.error('Error generating summary:', error);
    return null;
  }
}

export async function generateTranscript(assetId: string, videoUrl: string) {
  const serviceProvider = await getVideoServiceProvider();
  const transcript = serviceProvider.getTranscript();

  const transcriptId = await transcript.generateTranscript(assetId, videoUrl);

  return { transcriptId };
}

export async function getTranscriptStatus(transcriptId: string) {
  const serviceProvider = await getVideoServiceProvider();
  const transcript = serviceProvider.getTranscript();

  return await transcript.getTranscriptStatus(transcriptId);
}

export async function generateVtt(segments: any[]) {
  const serviceProvider = await getVideoServiceProvider();
  const transcript = serviceProvider.getTranscript();

  return transcript.generateVtt(segments);
}

export async function generateThumbnail(assetId: string, videoUrl: string) {
  const serviceProvider = await getVideoServiceProvider();
  const transcoder = serviceProvider.getTranscoder();

  const thumbnailUrl = await transcoder.generateThumbnail(videoUrl, 5);

  return { thumbnailUrl };
}

export async function generateGifPreview(assetId: string, videoUrl: string) {
  const serviceProvider = await getVideoServiceProvider();
  const player = serviceProvider.getPlayer();

  const gifUrl = await player.generateGifPreview(videoUrl, 3);

  return { gifUrl };
}

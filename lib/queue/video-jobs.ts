import Queue from 'bull';
import { getVideoServiceProvider } from '../lib/providers/VideoServiceProvider';

// Initialize Redis connection
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
};

// Create job queues
export const transcodeQueue = new Queue('video-transcoding', {
  redis: redisConfig,
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 20,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

export const transcriptQueue = new Queue('video-transcription', {
  redis: redisConfig,
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 20,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

export const thumbnailQueue = new Queue('thumbnail-generation', {
  redis: redisConfig,
  defaultJobOptions: {
    removeOnComplete: 20,
    removeOnFail: 20,
    attempts: 2,
  },
});

// Process transcoding jobs
transcodeQueue.process(async (job) => {
  const { assetId, videoUrl, options } = job.data;

  job.log(`Starting transcoding for ${assetId}`);

  const serviceProvider = await getVideoServiceProvider();
  const transcoder = serviceProvider.getTranscoder();

  try {
    const transcodeId = await transcoder.startTranscode(assetId, options);

    job.log(`Transcoding started: ${transcodeId}`);

    // Poll for completion (in production, use webhooks or events)
    let status = await transcoder.getTranscodeStatus(transcodeId);
    while (status.status === 'processing') {
      await new Promise(resolve => setTimeout(resolve, 5000));
      status = await transcoder.getTranscodeStatus(transcodeId);

      job.progress(percentage = status.progress?.percentage || 0);
    }

    if (status.status === 'ready') {
      job.log('Transcoding completed successfully');

      // Trigger thumbnail generation
      await thumbnailQueue.add(
        { assetId, videoUrl },
        { jobId: `thumb_${assetId}` }
      );

      // Trigger transcription
      await transcriptQueue.add(
        { assetId, videoUrl },
        { jobId: `transcript_${assetId}` }
      );

      return {
        transcodeId,
        playlistUrl: status.playlistUrl,
        segments: status.segments,
      };
    } else {
      throw new Error(`Transcoding failed: ${status.status}`);
    }
  } catch (error) {
    job.log(`Error: ${error}`);
    throw error;
  }
});

// Process transcription jobs
transcriptQueue.process(async (job) => {
  const { assetId, videoUrl } = job.data;

  job.log(`Starting transcription for ${assetId}`);

  const serviceProvider = await getVideoServiceProvider();
  const transcript = serviceProvider.getTranscript();

  try {
    const transcriptId = await transcript.generateTranscript(assetId, videoUrl);
    job.log(`Transcription started: ${transcriptId}`);

    let status = await transcript.getTranscriptStatus(transcriptId);
    while (status.status === 'processing' || status.status === 'preparing') {
      await new Promise(resolve => setTimeout(resolve, 3000));
      status = await transcript.getTranscriptStatus(transcriptId);
      job.progress(percentage = 50);
    }

    if (status.status === 'ready') {
      job.log('Transcription completed successfully');

      // Generate summary
      const summary = await transcript.generateSummary(transcriptId);

      return {
        transcriptId,
        segments: status.segments,
        fullText: status.fullText,
        summary,
      };
    } else {
      throw new Error(`Transcription failed: ${status.status}`);
    }
  } catch (error) {
    job.log(`Error: ${error}`);
    throw error;
  }
});

// Process thumbnail generation jobs
thumbnailQueue.process(async (job) => {
  const { assetId, videoUrl } = job.data;

  job.log(`Generating thumbnail for ${assetId}`);

  const serviceProvider = await getVideoServiceProvider();
  const transcoder = serviceProvider.getTranscoder();

  try {
    const thumbnailUrl = await transcoder.generateThumbnail(videoUrl, 5);
    job.log(`Thumbnail generated: ${thumbnailUrl}`);

    return { thumbnailUrl };
  } catch (error) {
    job.log(`Error: ${error}`);
    throw error;
  }
});

// Helper functions to add jobs
export async function queueTranscodeJob(
  assetId: string,
  videoUrl: string,
  options?: any
) {
  return await transcodeQueue.add(
    { assetId, videoUrl, options },
    { jobId: `transcode_${assetId}` }
  );
}

export async function queueTranscriptJob(assetId: string, videoUrl: string) {
  return await transcriptQueue.add(
    { assetId, videoUrl },
    { jobId: `transcript_${assetId}` }
  );
}

export async function queueThumbnailJob(assetId: string, videoUrl: string) {
  return await thumbnailQueue.add(
    { assetId, videoUrl },
    { jobId: `thumb_${assetId}` }
  );
}

// Helper functions to get job status
export async function getTranscodeJobStatus(assetId: string) {
  const job = await transcodeQueue.getJob(`transcode_${assetId}`);
  if (!job) return null;

  return {
    id: job.id,
    name: job.name,
    progress: job.progress(),
    state: await job.getState(),
    data: job.data,
  };
}

export async function getTranscriptJobStatus(assetId: string) {
  const job = await transcriptQueue.getJob(`transcript_${assetId}`);
  if (!job) return null;

  return {
    id: job.id,
    name: job.name,
    progress: job.progress(),
    state: await job.getState(),
    data: job.data,
  };
}

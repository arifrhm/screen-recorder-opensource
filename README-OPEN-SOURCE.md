# Screen Recorder - Open Source Loom Clone

A self-hosted video recording and sharing application built with Next.js, OpenStack Swift, FFmpeg, and Video.js.

## Features

- 🎥 Screen recording with audio
- ☁️ Self-hosted storage (OpenStack Swift)
- 🎬 Video transcoding to HLS (FFmpeg)
- 🎭 Video player with HLS support (Video.js)
- 📝 Automatic transcription (OpenAI Whisper)
- 🤖 AI-powered video summaries
- 🖼️ Thumbnail and GIF preview generation
- 💬 VTT subtitle generation
- 🔗 Shareable video links
- 🎨 Responsive design

## Tech Stack

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS
- **Storage:** OpenStack Swift (self-hosted object storage)
- **Transcoding:** FFmpeg with HLS support
- **Video Player:** Video.js with HTTP streaming
- **Transcription:** OpenAI Whisper (@xenova/transformers)
- **Job Queue:** Bull + Redis
- **Image Processing:** Sharp

## Architecture

This project uses the **Dependency Inversion Principle** with abstract interfaces for all major components:

```
IStorageProvider
├── OpenStackSwiftProvider (self-hosted)
└── MuxStorageProvider (original, optional)

ITranscodeProvider
├── FFmpegTranscodeProvider (self-hosted)
└── MuxTranscodeProvider (original, optional)

ITranscriptProvider
├── WhisperTranscriptProvider (self-hosted)
└── MuxAITranscriptProvider (original, optional)

IVideoPlayerProvider
├── VideoJSProvider (self-hosted)
└── MuxPlayerProvider (original, optional)
```

## Prerequisites

- Node.js 18+ and npm
- FFmpeg installed and available in PATH
- OpenStack Swift instance (or MinIO with Swift API)
- Redis server (for Bull job queue)
- 2GB+ RAM (for Whisper model)

## Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/beaucarnes/screen-recorder.git
   cd screen-recorder
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Install FFmpeg:**

   Ubuntu/Debian:
   ```bash
   sudo apt update
   sudo apt install ffmpeg
   ```

   macOS:
   ```bash
   brew install ffmpeg
   ```

4. **Setup OpenStack Swift:**

   Install Swift using devstack or docker:
   ```bash
   docker run -d \
     --name swift \
     -p 8080:8080 \
     -e SWIFT_DEFAULT_KEY=devstack \
     morrisjobke/docker-swift-only
   ```

5. **Setup Redis:**

   Using docker:
   ```bash
   docker run -d -p 6379:6379 redis
   ```

6. **Configure environment variables:**

   Copy the example environment file:
   ```bash
   cp .env.local.example .env.local
   ```

   Edit `.env.local` with your configuration:
   ```env
   OPENSTACK_AUTH_URL=http://localhost:5000/v3
   OPENSTACK_USERNAME=admin
   OPENSTACK_PASSWORD=devstack
   OPENSTACK_TENANT_ID=
   OPENSTACK_REGION=RegionOne
   OPENSTACK_CONTAINER=videos

   OUTPUT_DIR=./output
   REDIS_URL=redis://localhost:6379

   VIDEO_PROVIDER=self-hosted
   ```

7. **Create output directory:**
   ```bash
   mkdir -p output/hls output/thumbnails output/previews
   ```

8. **Run development server:**
   ```bash
   npm run dev
   ```

9. **Open [http://localhost:3000](http://localhost:3000)**

## Usage

### Recording Videos

1. Click "Start Recording"
2. Select screen to share
3. Click "Share"
4. Speak into your microphone
5. Click "Stop Recording"

### Uploading Videos

Videos are automatically uploaded to OpenStack Swift after recording.

### Watching Videos

Navigate to the video page to watch the transcoded video with:
- HLS streaming (adaptive bitrate)
- Keyboard shortcuts (k/space, arrows, f for fullscreen)
- Playback speed control

### Transcripts & Summaries

- Automatic transcription is queued after upload
- AI summaries are generated from transcripts
- Subtitles are available in the player

## Background Jobs

The application uses Bull for background job processing:

```typescript
import { queueTranscodeJob, queueTranscriptJob } from '@/lib/queue/video-jobs';

// Queue a transcoding job
await queueTranscodeJob(assetId, videoUrl, {
  quality: 'medium',
  outputFormat: 'hls',
});

// Queue a transcription job
await queueTranscriptJob(assetId, videoUrl);
```

## Switching Providers

To switch between self-hosted and Mux providers:

1. Change `VIDEO_PROVIDER` in `.env.local`:
   ```env
   VIDEO_PROVIDER=self-hosted  # or 'mux'
   ```

2. Or programmatically:
   ```typescript
   import { getVideoServiceProvider } from '@/lib/providers/VideoServiceProvider';

   const serviceProvider = await getVideoServiceProvider('self-hosted');
   ```

## Deployment

### Production Setup

1. **Environment:** Use production environment variables
2. **Storage:** Use production OpenStack Swift instance
3. **Redis:** Use managed Redis (e.g., AWS ElastiCache)
4. **FFmpeg:** Install on production server
5. **Output Directory:** Use persistent storage or cloud storage

### Docker Deployment

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install FFmpeg
RUN apk add --no-cache ffmpeg

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN mkdir -p output/hls output/thumbnails output/previews

EXPOSE 3000

CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t screen-recorder .
docker run -p 3000:3000 \
  -e OPENSTACK_AUTH_URL=... \
  -e REDIS_URL=... \
  screen-recorder
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see LICENSE file for details

## Credits

Based on the [freeCodeCamp Loom Clone Tutorial](https://youtu.be/IBTx5aGj-6U) by Beau Carnes.

Modified to use open source self-hosted components instead of Mux.

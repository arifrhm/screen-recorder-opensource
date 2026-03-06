# Screen Recorder - Open Source Loom Clone

A self-hosted video recording and sharing application built with Next.js, OpenStack Swift, FFmpeg, and Video.js. Features automatic transcription with OpenAI Whisper and AI-powered video summaries.

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat&logo=typescript)
![License](https://img.shields.io/badge/License-ISC-blue?style=flat)

## ✨ Features

- 🎥 **Screen Recording** - Capture screen with audio using browser APIs
- ☁️ **Self-Hosted Storage** - OpenStack Swift for complete data control
- 🎬 **HLS Transcoding** - FFmpeg-powered adaptive bitrate streaming
- 📹 **Video Player** - Video.js with HTTP streaming and keyboard shortcuts
- 📝 **Auto Transcription** - OpenAI Whisper for accurate subtitles
- 🤖 **AI Summaries** - Automatic video summaries and tags
- 🖼️ **Thumbnails & Previews** - Auto-generated thumbnails and GIF previews
- 💬 **VTT Subtitles** - WebVTT subtitle generation
- 🔗 **Shareable Links** - Easy video sharing with unique URLs
- 🎨 **Responsive Design** - Works on desktop, tablet, and mobile

## 🏗️ Architecture

This project implements the **Dependency Inversion Principle** with abstract interfaces for all major components, allowing easy switching between providers:

```
┌─────────────────────────────────────────────────────────┐
│                   Next.js 16 Application                  │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│              VideoServiceProvider (Factory)              │
│         - Switchable providers via configuration          │
└─────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ IStorage      │   │ ITranscode    │   │ ITranscript   │
│   Provider    │   │   Provider    │   │   Provider    │
└───────┬───────┘   └───────┬───────┘   └───────┬───────┘
        │                   │                   │
    ┌───┴───┐           ┌───┴───┐           ┌───┴───┐
    ▼       ▼           ▼       ▼           ▼       ▼
┌────────┐ │        ┌────────┐ │        ┌────────┐ │
│OpenStack│ │        │FFmpeg  │ │        │Whisper │ │
│  Swift  │ │        │HLS     │ │        │   AI   │ │
└────────┘ │        └────────┘ │        └────────┘ │
          │                   │                   │
┌─────────▼───────┐   ┌────────▼────────┐   ┌────▼───────────┐
│ IVideoPlayer    │   │ Bull Queue      │   │ Redis           │
│   Provider      │   │ (Job Scheduling)│   │ (Queue Storage) │
└─────┬───────────┘   └─────────────────┘   └────────────────┘
      │
  ┌───┴───┐
  ▼       ▼
┌────────┐
│Video.js│
│Player  │
└────────┘
```

## 🛠️ Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Utility-first styling
- **Lucide React** - Icons

### Backend Services
- **OpenStack Swift** - Self-hosted object storage
- **FFmpeg** - Video transcoding to HLS
- **Redis** - Job queue storage
- **Bull** - Job queue manager

### Media Processing
- **Video.js** - HLS video player
- **@xenova/transformers** - OpenAI Whisper (runs in browser/Node)
- **Sharp** - Image processing
- **fluent-ffmpeg** - FFmpeg wrapper for Node.js

## 📋 Prerequisites

- Node.js 18+ and npm
- FFmpeg installed and available in PATH
- OpenStack Swift instance (or MinIO with Swift API)
- Redis server (for Bull job queue)
- 2GB+ RAM (for Whisper model)

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)

```bash
# Clone the repository
git clone https://github.com/arifrhm/screen-recorder-opensource.git
cd screen-recorder-opensource

# Run the setup script
./setup.sh

# Start the development server
npm run dev
```

### Option 2: Manual Setup

```bash
# Clone the repository
git clone https://github.com/arifrhm/screen-recorder-opensource.git
cd screen-recorder-opensource

# Install dependencies
npm install

# Install FFmpeg
# Ubuntu/Debian:
sudo apt update && sudo apt install ffmpeg

# macOS:
brew install ffmpeg

# Start Redis and OpenStack Swift with Docker
docker-compose up -d

# Create .env.local file
cp .env.local.example .env.local
# Edit .env.local with your configuration

# Run the development server
npm run dev

# Open http://localhost:3000
```

## ⚙️ Configuration

Create `.env.local` in the project root:

```env
# OpenStack Swift Configuration
OPENSTACK_AUTH_URL=http://localhost:8080/auth/v1.0
OPENSTACK_USERNAME=admin
OPENSTACK_PASSWORD=devstack
OPENSTACK_TENANT_ID=
OPENSTACK_REGION=RegionOne
OPENSTACK_CONTAINER=videos

# Output Directory
OUTPUT_DIR=./output

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Provider Selection (self-hosted | mux)
VIDEO_PROVIDER=self-hosted

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 📖 Usage

### Recording Videos

1. Click "Start Recording" button
2. Select screen or window to share
3. Enable microphone if needed
4. Click "Share" to begin recording
5. Click "Stop Recording" when done
6. Video automatically uploads to OpenStack Swift

### Watching Videos

Navigate to any video page to watch:
- **HLS Streaming** - Adaptive bitrate playback
- **Keyboard Shortcuts**:
  - `K` or `Space` - Play/Pause
  - `←` / `→` - Rewind/Forward 5 seconds
  - `F` - Toggle fullscreen
  - `0-9` - Jump to percentage
- **Playback Speed** - 0.5x to 2x speed control

### Transcripts & Summaries

After upload:
1. **Transcription** - Automatically queued and processed
2. **AI Summary** - Generated from transcript with key points
3. **Tags** - Auto-generated from video content
4. **Subtitles** - Available in player via VTT format

## 🔄 Background Jobs

The application uses **Bull** for async job processing:

```typescript
import { queueTranscodeJob, queueTranscriptJob } from '@/lib/queue/video-jobs';

// Queue transcoding
await queueTranscodeJob(assetId, videoUrl, {
  quality: 'medium',
  outputFormat: 'hls',
});

// Queue transcription
await queueTranscriptJob(assetId, videoUrl);
```

**Job Types:**
- `video-transcoding` - FFmpeg HLS conversion
- `video-transcription` - Whisper AI transcription
- `thumbnail-generation` - Thumbnail creation

## 🐳 Docker Deployment

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Remove volumes (deletes data)
docker-compose down -v
```

**Services:**
- `redis` - Redis on port 6379
- `swift` - OpenStack Swift on port 8080
- `redis-commander` - Redis UI on port 8081

## 🔧 Switching Providers

To switch between self-hosted and Mux providers:

```env
# In .env.local
VIDEO_PROVIDER=self-hosted  # or 'mux'
```

Or programmatically:

```typescript
import { getVideoServiceProvider } from '@/lib/providers/VideoServiceProvider';

// Use self-hosted providers
const serviceProvider = await getVideoServiceProvider('self-hosted');

// Use Mux providers
const muxProvider = await getVideoServiceProvider('mux');
```

## 📁 Project Structure

```
screen-recorder/
├── app/                      # Next.js app directory
│   ├── actions.ts           # Server actions (Mux)
│   ├── actions-new.ts       # Server actions (Self-hosted)
│   ├── api/                 # API routes
│   ├── dashboard/           # Dashboard page
│   └── video/               # Video pages
├── components/              # React components
│   ├── ScreenRecorder.tsx   # Recording component
│   ├── VideoJSPlayer.tsx    # Video.js player
│   └── ...
├── lib/
│   ├── providers/           # DI pattern
│   │   ├── interfaces/      # Provider interfaces
│   │   ├── implementations/ # Provider implementations
│   │   └── VideoServiceProvider.ts
│   └── queue/               # Bull job queues
├── public/                  # Static assets
├── docker-compose.yml       # Docker services
├── setup.sh                 # Setup script
└── README.md                # This file
```

## 🚢 Production Deployment

### Vercel

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Self-Hosted

```bash
# Build
npm run build

# Start production server
npm start
```

**Production Considerations:**
- Use managed Redis (AWS ElastiCache, Redis Cloud)
- Use production OpenStack Swift or S3-compatible storage
- Enable HTTPS with SSL certificates
- Setup monitoring (Prometheus + Grafana)
- Add authentication (NextAuth.js)
- Setup CDN (Cloudflare, AWS CloudFront)

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

ISC License - see [LICENSE](LICENSE) file for details

This project is open source and can be used by anyone for any purpose, with or without fee, under the ISC License.

## 🙏 Credits

- Based on the [freeCodeCamp Loom Clone Tutorial](https://youtu.be/IBTx5aGj-6U) by Beau Carnes
- Modified to use open source self-hosted components instead of Mux
- Built with Dependency Inversion Principle for flexibility

## 🔗 Links

- **Original Tutorial**: https://youtu.be/IBTx5aGj-6U
- **Next.js**: https://nextjs.org
- **Video.js**: https://videojs.com
- **OpenStack Swift**: https://docs.openstack.org/swift/
- **OpenAI Whisper**: https://github.com/openai/whisper
- **Bull Queue**: https://github.com/OptimalBits/bull

## 💬 Support

- **GitHub Issues**: [Report bugs and request features](https://github.com/arifrhm/screen-recorder-opensource/issues)
- **Discussions**: [Ask questions and share ideas](https://github.com/arifrhm/screen-recorder-opensource/discussions)

---

Made with ❤️ by Arif Rahman

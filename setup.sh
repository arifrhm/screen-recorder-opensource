#!/bin/bash

# Setup script for Screen Recorder - Open Source Loom Clone

set -e

echo "🚀 Setting up Screen Recorder..."

# Check for required dependencies
echo "📋 Checking dependencies..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm"
    exit 1
fi

if ! command -v ffmpeg &> /dev/null; then
    echo "❌ FFmpeg is not installed. Please install FFmpeg"
    echo "   Ubuntu/Debian: sudo apt install ffmpeg"
    echo "   macOS: brew install ffmpeg"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo "⚠️  Docker is not installed. Docker is recommended for Redis and OpenStack Swift"
fi

# Install npm dependencies
echo "📦 Installing npm dependencies..."
npm install

# Create output directories
echo "📁 Creating output directories..."
mkdir -p output/hls output/thumbnails output/previews

# Create .env.local if it doesn't exist
if [ ! -f .env.local ]; then
    echo "⚙️  Creating .env.local..."
    cp .env.local.example .env.local
    echo "✅ Created .env.local from example"
    echo "⚠️  Please edit .env.local with your configuration"
else
    echo "✅ .env.local already exists"
fi

# Check for Redis
echo "🔍 Checking for Redis..."
if ! redis-cli ping &> /dev/null; then
    echo "⚠️  Redis is not running. Starting Redis with Docker..."
    docker run -d -p 6379:6379 --name screen-recorder-redis redis
    echo "✅ Redis started with Docker"
else
    echo "✅ Redis is running"
fi

# Check for OpenStack Swift
echo "🔍 Checking for OpenStack Swift..."
if ! curl -s http://localhost:8080 > /dev/null; then
    echo "⚠️  OpenStack Swift is not running. Starting with Docker..."
    docker run -d \
        --name screen-recorder-swift \
        -p 8080:8080 \
        -e SWIFT_DEFAULT_KEY=devstack \
        morrisjobke/docker-swift-only
    echo "✅ OpenStack Swift started with Docker"
    echo "⚠️  Note: Swift may take a few minutes to initialize"
else
    echo "✅ OpenStack Swift is running"
fi

# Create container in Swift
echo "📦 Creating videos container in Swift..."
sleep 5  # Wait for Swift to initialize
docker exec screen-recorder-swift swift -A http://localhost:8080/auth/v1.0 -U admin:admin -K devstack post videos 2>/dev/null || echo "Container may already exist"

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Edit .env.local with your configuration"
echo "2. Run 'npm run dev' to start the development server"
echo "3. Open http://localhost:3000"
echo ""
echo "🐳 Docker containers:"
echo "   - Redis: docker logs screen-recorder-redis"
echo "   - Swift: docker logs screen-recorder-swift"
echo ""
echo "📚 Read README-OPEN-SOURCE.md for detailed documentation"

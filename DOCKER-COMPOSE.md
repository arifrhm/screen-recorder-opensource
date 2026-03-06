# Docker Compose Setup

This setup uses Docker Compose to run all required services (Redis, OpenStack Swift, and the application).

## Prerequisites

- Docker
- Docker Compose

## Quick Start

1. **Copy environment file:**
   ```bash
   cp .env.local.example .env.local
   ```

2. **Edit `.env.local` with your configuration:**
   ```env
   OPENSTACK_AUTH_URL=http://swift:8080/auth/v1.0
   OPENSTACK_USERNAME=admin
   OPENSTACK_PASSWORD=devstack
   OPENSTACK_REGION=RegionOne
   OPENSTACK_CONTAINER=videos

   REDIS_URL=redis://redis:6379

   OUTPUT_DIR=./output
   VIDEO_PROVIDER=self-hosted
   ```

3. **Run Docker Compose:**
   ```bash
   docker-compose up -d
   ```

4. **Install npm dependencies:**
   ```bash
   npm install
   ```

5. **Run development server:**
   ```bash
   npm run dev
   ```

6. **Open [http://localhost:3000](http://localhost:3000)**

## Services

### Redis
- **Port:** 6379
- **Image:** redis:alpine
- **Purpose:** Bull job queue

### OpenStack Swift
- **Port:** 8080
- **Image:** morrisjobke/docker-swift-only
- **Purpose:** Object storage for videos
- **Environment:**
  - `SWIFT_DEFAULT_KEY=devstack`
- **Note:** Swift uses tempauth for authentication

### Application
- **Port:** 3000
- **Purpose:** Next.js application
- **Mounts:**
  - `./output:/app/output` - For transcoded files, thumbnails, etc.

## Management Commands

### Start all services:
```bash
docker-compose up -d
```

### Stop all services:
```bash
docker-compose down
```

### View logs:
```bash
docker-compose logs -f
```

### View specific service logs:
```bash
docker-compose logs -f redis
docker-compose logs -f swift
```

### Restart services:
```bash
docker-compose restart
```

### Remove all containers and volumes:
```bash
docker-compose down -v
```

## Troubleshooting

### Swift not ready
Wait a few seconds for Swift to initialize:
```bash
docker-compose logs swift
```

### Redis connection errors
Check if Redis is running:
```bash
docker-compose ps redis
```

### Permission issues
Ensure output directory has proper permissions:
```bash
sudo chown -R $USER:$USER output
```

## Production Deployment

For production, consider:

1. **Use managed services:**
   - AWS ElastiCache for Redis
   - AWS S3 or Google Cloud Storage instead of self-hosted Swift
   - Vercel or AWS for Next.js deployment

2. **Use environment-specific configs:**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

3. **Add monitoring:**
   - Health checks
   - Log aggregation
   - Metrics collection

4. **Add security:**
   - Use secrets for sensitive data
   - Enable HTTPS
   - Add rate limiting
   - Add authentication

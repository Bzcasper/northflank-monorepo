# Northflank Deployment for Shirt Video Maker

Automated deployment configuration for the Bzcasper/short-video-maker project on Northflank.

## Quick Start

1. **Setup environment**:

   ```bash
   cp .env.example .env
   # Edit .env with your actual values
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Authenticate with Northflank**:

   ```bash
   northflank login --token YOUR_API_TOKEN
   ```

4. **Deploy**:
   ```bash
   npm run deploy
   ```

## Environment Variables

Required variables in your `.env` file:

- `NORTHFLANK_API_TOKEN` - Your Northflank API token
- `PEXELS_API_KEY` - API key for Pexels video/image service
- `LOG_LEVEL` - Application log level (debug, info, warn, error)
- `VIDEO_CACHE_SIZE_IN_BYTES` - Cache size for video processing (default: 2GB)

## Available Commands

### Deployment

```bash
npm run deploy        # Deploy to Northflank
npm run deploy:dev    # Deploy development environment
npm run deploy:prod   # Deploy production environment
```

### Monitoring

```bash
npm run status        # Check service status
npm run logs          # View service logs (follow mode)
```

### Scaling

```bash
npm run scale 3       # Scale to 3 instances
```

### Rollback

```bash
npm run rollback      # List available builds
npm run rollback <build_id>  # Rollback to specific build
```

## Service Configuration

- **Repository**: Bzcasper/short-video-maker
- **Branch**: main
- **Dockerfile**: /main.Dockerfile
- **Port**: 3123
- **Resources**: 4 vCPU, 16GB RAM (optimized for video processing)
- **Auto-scaling**: 1-3 instances

## Files Overview

- `northflank.yaml` - Declarative service configuration
- `scripts/deploy.js` - Automated deployment script
- `scripts/scale.js` - Service scaling automation
- `scripts/rollback.js` - Build rollback utility
- `.env.example` - Environment variables template

## Troubleshooting

### Authentication Issues

```bash
# Re-authenticate
northflank login --token YOUR_TOKEN
```

### Build Failures

```bash
# Check build logs
northflank logs build --service shirt-video-maker --project n8n-shirtvideo-mcp
```

### Service Not Starting

```bash
# Check runtime logs
npm run logs
```

## Manual Northflank UI Fix

If using the Northflank web interface, ensure:

- **Dockerfile location**: `/main.Dockerfile` (absolute path)
- **Build context**: `/`
- **Port**: 3123
- **CPU**: 4000m
- **Memory**: 16384MB

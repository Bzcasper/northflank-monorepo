#!/bin/bash

# Northflank deployment script for shirt-video-maker
# Authenticate first: export NORTHFLANK_API_TOKEN=your_token

northflank create service combined \
  --name "shirt-video-maker" \
  --project "n8n-shirtvideo-mcp" \
  --repository "Bzcasper/short-video-maker" \
  --branch "main" \
  --dockerfile "/main.Dockerfile" \
  --build-context "/" \
  --port 3123 \
  --cpu 4000 \
  --memory 16384 \
  --env LOG_LEVEL=debug \
  --env PEXELS_API_KEY=your_pexels_key \
  --env VIDEO_CACHE_SIZE_IN_BYTES=2097152000 \
  --env DEV=false
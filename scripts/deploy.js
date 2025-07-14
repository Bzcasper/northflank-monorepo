#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
require('dotenv').config();

const config = {
  serviceName: process.env.SERVICE_NAME || 'shirt-video-maker',
  projectName: process.env.PROJECT_NAME || 'n8n-shirtvideo-mcp',
  repository: process.env.REPOSITORY || 'Bzcasper/short-video-maker',
  branch: process.env.BRANCH || 'main',
  dockerfilePath: process.env.DOCKERFILE_PATH || '/main.Dockerfile',
  buildContext: process.env.BUILD_CONTEXT || '/',
  port: process.env.PORT || '3123',
  cpu: process.env.CPU_MILLICORES || '4000',
  memory: process.env.MEMORY_MB || '16384',
  instances: process.env.INSTANCES || '1'
};

function runCommand(command, description) {
  console.log(`🔄 ${description}...`);
  try {
    const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    console.log(`✅ ${description} completed`);
    return output;
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    process.exit(1);
  }
}

function deployService() {
  console.log('🚀 Starting Northflank deployment...');
  
  // Check if service exists
  try {
    execSync(`northflank get service ${config.serviceName} --project ${config.projectName}`, { stdio: 'pipe' });
    console.log('📝 Service exists, updating...');
    updateService();
  } catch (error) {
    console.log('🆕 Service not found, creating new...');
    createService();
  }
}

function createService() {
  const createCmd = `northflank create service combined \\
    --name "${config.serviceName}" \\
    --project "${config.projectName}" \\
    --repository "${config.repository}" \\
    --branch "${config.branch}" \\
    --dockerfile "${config.dockerfilePath}" \\
    --build-context "${config.buildContext}" \\
    --port ${config.port} \\
    --cpu ${config.cpu} \\
    --memory ${config.memory} \\
    --replicas ${config.instances} \\
    --env LOG_LEVEL="${process.env.LOG_LEVEL || 'debug'}" \\
    --env PEXELS_API_KEY="${process.env.PEXELS_API_KEY}" \\
    --env VIDEO_CACHE_SIZE_IN_BYTES="${process.env.VIDEO_CACHE_SIZE_IN_BYTES || '2097152000'}" \\
    --env DEV="${process.env.DEV || 'false'}"`;

  runCommand(createCmd, 'Creating combined service');
}

function updateService() {
  const updateCmd = `northflank update service ${config.serviceName} \\
    --project ${config.projectName} \\
    --cpu ${config.cpu} \\
    --memory ${config.memory} \\
    --replicas ${config.instances}`;

  runCommand(updateCmd, 'Updating service configuration');
}

function checkDeploymentStatus() {
  console.log('🔍 Checking deployment status...');
  runCommand(`northflank get service ${config.serviceName} --project ${config.projectName}`, 'Getting service status');
}

// Main execution
if (require.main === module) {
  deployService();
  setTimeout(() => {
    checkDeploymentStatus();
  }, 5000);
}
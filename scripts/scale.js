#!/usr/bin/env node

const { execSync } = require('child_process');
require('dotenv').config();

const config = {
  serviceName: process.env.SERVICE_NAME || 'shirt-video-maker',
  projectName: process.env.PROJECT_NAME || 'n8n-shirtvideo-mcp'
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

function scaleService() {
  const replicas = process.argv[2];
  
  if (!replicas || isNaN(replicas)) {
    console.error('❌ Please provide a valid number of replicas');
    console.log('Usage: npm run scale <number_of_replicas>');
    process.exit(1);
  }

  console.log(`🔧 Scaling ${config.serviceName} to ${replicas} instances...`);
  
  const scaleCmd = `northflank scale service ${config.serviceName} --project ${config.projectName} --replicas ${replicas}`;
  runCommand(scaleCmd, `Scaling service to ${replicas} replicas`);
  
  setTimeout(() => {
    runCommand(`northflank get service ${config.serviceName} --project ${config.projectName}`, 'Checking scaling status');
  }, 3000);
}

if (require.main === module) {
  scaleService();
}
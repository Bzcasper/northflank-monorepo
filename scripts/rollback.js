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

function listBuilds() {
  console.log('📋 Getting recent builds...');
  const buildsCmd = `northflank get builds --service ${config.serviceName} --project ${config.projectName} --limit 10`;
  return runCommand(buildsCmd, 'Fetching build history');
}

function rollbackToBuild() {
  const buildId = process.argv[2];
  
  if (!buildId) {
    console.log('📋 Available builds:');
    listBuilds();
    console.log('\nUsage: npm run rollback <build_id>');
    return;
  }

  console.log(`🔄 Rolling back ${config.serviceName} to build ${buildId}...`);
  
  const rollbackCmd = `northflank rollback service ${config.serviceName} --project ${config.projectName} --build ${buildId}`;
  runCommand(rollbackCmd, `Rolling back to build ${buildId}`);
  
  setTimeout(() => {
    runCommand(`northflank get service ${config.serviceName} --project ${config.projectName}`, 'Checking rollback status');
  }, 5000);
}

if (require.main === module) {
  rollbackToBuild();
}
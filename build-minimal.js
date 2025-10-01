#!/usr/bin/env node

// Ultra-minimal build - skip everything possible
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('⚡ Starting ULTRA-MINIMAL build...');

// Set all possible optimizations
process.env.GENERATE_SOURCEMAP = 'false';
process.env.INLINE_RUNTIME_CHUNK = 'false';
process.env.SKIP_PREFLIGHT_CHECK = 'true';
process.env.NODE_OPTIONS = '--max-old-space-size=8192';
process.env.DISABLE_ESLINT_PLUGIN = 'true';
process.env.CI = 'false';
process.env.TSC_COMPILE_ON_ERROR = 'true';
process.env.ESLINT_NO_DEV_ERRORS = 'true';

// Clear build directory
const buildDir = path.join(__dirname, 'build');
if (fs.existsSync(buildDir)) {
  console.log('🧹 Cleaning build...');
  fs.rmSync(buildDir, { recursive: true, force: true });
}

console.log('🔨 Building with ALL optimizations...');
const startTime = Date.now();

try {
  execSync('react-scripts build', { 
    stdio: 'inherit',
    env: { ...process.env },
    timeout: 600000 // 10 minute timeout
  });
  
  const endTime = Date.now();
  const buildTime = (endTime - startTime) / 1000;
  
  console.log(`⚡ ULTRA-MINIMAL build completed in ${buildTime.toFixed(2)} seconds`);
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  console.log('💡 Try: npm start (development mode) for testing');
  process.exit(1);
}

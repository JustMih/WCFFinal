#!/usr/bin/env node

// Memory-optimized build script
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧠 Starting memory-optimized build...');

// Set maximum memory and optimizations
process.env.GENERATE_SOURCEMAP = 'false';
process.env.INLINE_RUNTIME_CHUNK = 'false';
process.env.SKIP_PREFLIGHT_CHECK = 'true';
process.env.NODE_OPTIONS = '--max-old-space-size=8192';
process.env.DISABLE_ESLINT_PLUGIN = 'true';
process.env.CI = 'false';

// Clear build directory
const buildDir = path.join(__dirname, 'build');
if (fs.existsSync(buildDir)) {
  console.log('🧹 Cleaning build directory...');
  fs.rmSync(buildDir, { recursive: true, force: true });
}

console.log('🔨 Building with memory optimizations...');
const startTime = Date.now();

try {
  // Force garbage collection before build
  if (global.gc) {
    global.gc();
  }
  
  execSync('react-scripts build', { 
    stdio: 'inherit',
    env: { ...process.env },
    maxBuffer: 1024 * 1024 * 10 // 10MB buffer
  });
  
  const endTime = Date.now();
  const buildTime = (endTime - startTime) / 1000;
  
  console.log(`✅ Build completed in ${buildTime.toFixed(2)} seconds`);
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  console.log('💡 Try: npm start (development mode) for faster testing');
  process.exit(1);
}

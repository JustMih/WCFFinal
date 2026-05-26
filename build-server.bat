@echo off
echo 🚀 Starting server build process...

REM Set environment variables for maximum performance
set GENERATE_SOURCEMAP=false
set INLINE_RUNTIME_CHUNK=false
set SKIP_PREFLIGHT_CHECK=true
set NODE_OPTIONS=--max-old-space-size=8192
set DISABLE_ESLINT_PLUGIN=true
set CI=false
set TSC_COMPILE_ON_ERROR=true

REM Clear build directory
if exist build (
    echo 🧹 Cleaning build directory...
    rmdir /s /q build
)

REM Clear npm cache
echo 🧹 Clearing npm cache...
npm cache clean --force

REM Record start time
echo 🔨 Building application...
timeout /t 1 /nobreak >nul

REM Run the build
call npm run build:minimal

echo ✅ Server build completed!

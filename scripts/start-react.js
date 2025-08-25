#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('📦 Starting React Development Server Only...\n');

const reactProcess = spawn('npm', ['run', 'dev'], {
    cwd: path.join(__dirname, '..', 'ClientApp'),
    stdio: 'inherit',
    shell: true
});

// Handle process cleanup
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down React server...');
    reactProcess.kill('SIGINT');
    process.exit(0);
});

process.on('SIGTERM', () => {
    reactProcess.kill('SIGTERM');
    process.exit(0);
});

reactProcess.on('close', (code) => {
    console.log(`\nReact process exited with code ${code}`);
    process.exit(code);
});

// Keep the script running
process.stdin.resume();

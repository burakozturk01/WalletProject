#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🔧 Starting .NET Backend Only...\n');

const dotnetProcess = spawn('dotnet', ['run'], {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit',
    shell: true
});

process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down .NET server...');
    dotnetProcess.kill('SIGINT');
    process.exit(0);
});

process.on('SIGTERM', () => {
    dotnetProcess.kill('SIGTERM');
    process.exit(0);
});

dotnetProcess.on('close', (code) => {
    console.log(`\n.NET process exited with code ${code}`);
    process.exit(code);
});

process.stdin.resume();

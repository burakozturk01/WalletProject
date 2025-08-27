#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Full Stack Development Environment...\n');

console.log('📦 Starting React development server...');
const reactProcess = spawn('npm', ['run', 'dev'], {
    cwd: path.join(__dirname, '..', 'ClientApp'),
    stdio: 'inherit',
    shell: true
});

setTimeout(() => {
    console.log('\n🔧 Starting .NET backend...');
    const dotnetProcess = spawn('dotnet', ['run'], {
        cwd: path.join(__dirname, '..'),
        stdio: 'inherit',
        shell: true
    });

        process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down development servers...');
        reactProcess.kill('SIGINT');
        dotnetProcess.kill('SIGINT');
        process.exit(0);
    });

    process.on('SIGTERM', () => {
        reactProcess.kill('SIGTERM');
        dotnetProcess.kill('SIGTERM');
        process.exit(0);
    });

    dotnetProcess.on('close', (code) => {
        console.log(`\n.NET process exited with code ${code}`);
        reactProcess.kill('SIGTERM');
        process.exit(code);
    });

    reactProcess.on('close', (code) => {
        console.log(`\nReact process exited with code ${code}`);
        dotnetProcess.kill('SIGTERM');
        process.exit(code);
    });

}, 3000); 

process.stdin.resume();

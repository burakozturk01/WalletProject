#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🧪 Running All Tests for WalletProject...\n');

// Function to run a command and return a promise
function runCommand(command, args, options = {}) {
    return new Promise((resolve, reject) => {
        const fullCommand = `${command} ${args.join(' ')}`;
        console.log(`📋 Running: ${fullCommand}`);
        
        const process = spawn(fullCommand, [], {
            cwd: path.join(__dirname, '..'),
            stdio: 'inherit',
            shell: true,
            ...options
        });

        process.on('close', (code) => {
            if (code === 0) {
                resolve(code);
            } else {
                reject(new Error(`Command failed with exit code ${code}`));
            }
        });

        process.on('error', (error) => {
            reject(error);
        });
    });
}

async function runAllTests() {
    try {
        console.log('🧹 Step 1: Cleaning project...');
        await runCommand('dotnet', ['clean']);
        console.log('✅ Clean completed successfully\n');

        console.log('🔨 Step 2: Building project...');
        await runCommand('dotnet', ['build']);
        console.log('✅ Build completed successfully\n');

        console.log('🧪 Step 3: Running tests...');
        await runCommand('dotnet', ['test', 'WalletProject.Tests/', '--verbosity', 'normal']);
        console.log('✅ All tests completed successfully\n');

        console.log('🎉 All operations completed successfully!');
        process.exit(0);

    } catch (error) {
        console.error(`\n❌ Error: ${error.message}`);
        console.log('\n📊 Test run completed with failures. Check the output above for details.');
        process.exit(1);
    }
}

// Handle process cleanup
process.on('SIGINT', () => {
    console.log('\n🛑 Test execution interrupted...');
    process.exit(130);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Test execution terminated...');
    process.exit(143);
});

// Run the tests
runAllTests();

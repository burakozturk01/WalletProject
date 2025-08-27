#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
class CommentRemover {
    constructor() {
        this.supportedExtensions = ['.cs', '.ts', '.tsx', '.js', '.jsx'];
        this.processedFiles = 0;
        this.modifiedFiles = 0;
    }

    removeComments(content, filePath) {
        let result = '';
        let i = 0;
        let modified = false;
        const length = content.length;

        while (i < length) {
            const char = content[i];
            const nextChar = i + 1 < length ? content[i + 1] : '';

            // Handle string literals (preserve everything inside)
            if (char === '"' || char === "'" || char === '`') {
                const quote = char;
                result += char;
                i++;
                
                // Find the end of the string, handling escape sequences
                while (i < length) {
                    const currentChar = content[i];
                    result += currentChar;
                    
                    if (currentChar === quote) {
                        i++;
                        break;
                    }
                    
                    // Handle escape sequences
                    if (currentChar === '\\' && i + 1 < length) {
                        i++;
                        if (i < length) {
                            result += content[i];
                        }
                    }
                    i++;
                }
                continue;
            }

            if (char === '/' && nextChar === '/') {
                // Check if this is part of a URL (http:// or https://)
                const isUrl = this.isPartOfUrl(content, i);
                
                if (isUrl) {
                    // This is part of a URL, treat as regular text
                    result += char;
                    i++;
                    continue;
                }
                
                modified = true;
                
                // Check if this comment is on a line by itself (only whitespace before it)
                const isCommentOnlyLine = this.isCommentOnlyLine(result);
                
                // Skip until end of line
                while (i < length && content[i] !== '\n') {
                    i++;
                }
                
                // If comment was on its own line, remove the entire line including newline
                if (isCommentOnlyLine && i < length && content[i] === '\n') {
                    i++; // Skip the newline too
                } else if (i < length && content[i] === '\n') {
                    // Comment was after code, keep the newline
                    result += content[i];
                    i++;
                }
                continue;
            }

            // Handle multi-line comments /* */
            if (char === '/' && nextChar === '*') {
                modified = true;
                
                // Check if this comment starts on a line by itself
                const isCommentStartOnlyLine = this.isCommentOnlyLine(result);
                
                i += 2; // Skip /*
                
                // Track if we encounter newlines in the comment
                let commentContainsNewlines = false;
                
                // Find the end of the comment
                while (i < length - 1) {
                    if (content[i] === '\n') {
                        commentContainsNewlines = true;
                    }
                    if (content[i] === '*' && content[i + 1] === '/') {
                        i += 2; // Skip */
                        break;
                    }
                    i++;
                }
                
                // If the comment started on its own line and contained newlines,
                // and the next character is a newline, skip it to avoid empty line
                if (isCommentStartOnlyLine && commentContainsNewlines && i < length && content[i] === '\n') {
                    i++; // Skip the newline after the comment
                }
                
                continue;
            }

            // Regular character
            result += char;
            i++;
        }

        return { content: result, modified };
    }

    /**
     * Check if the current line contains only whitespace before the comment
     */
    isCommentOnlyLine(resultSoFar) {
        // Find the last newline in the result so far
        const lastNewlineIndex = resultSoFar.lastIndexOf('\n');
        const currentLineContent = lastNewlineIndex === -1 ? resultSoFar : resultSoFar.substring(lastNewlineIndex + 1);
        
        // Check if the current line contains only whitespace
        return currentLineContent.trim() === '';
    }

    /**
     * Check if the "//" at position i is part of a URL (http:// or https://)
     */
    isPartOfUrl(content, position) {
        // Look backwards to see if we have "http:" or "https:" before the "//"
        if (position < 5) return false; // Not enough space for "http:"
        
        // Check for "http://"
        if (position >= 5) {
            const beforeSlashes = content.substring(position - 5, position);
            if (beforeSlashes === 'http:') {
                return true;
            }
        }
        
        // Check for "https://"
        if (position >= 6) {
            const beforeSlashes = content.substring(position - 6, position);
            if (beforeSlashes === 'https:') {
                return true;
            }
        }
        
        // Check for other protocols that might use "//" (ftp://, file://, etc.)
        // Look for pattern: word characters followed by ":"
        let j = position - 1;
        if (j >= 0 && content[j] === ':') {
            j--;
            // Look for protocol name (letters only)
            let protocolStart = j;
            while (j >= 0 && /[a-zA-Z]/.test(content[j])) {
                j--;
            }
            
            // If we found a protocol pattern and it's at word boundary
            if (protocolStart > j && (j < 0 || !/[a-zA-Z0-9]/.test(content[j]))) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Process a single file
     */
    processFile(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const { content: newContent, modified } = this.removeComments(content, filePath);
            
            this.processedFiles++;
            
            if (modified) {
                fs.writeFileSync(filePath, newContent, 'utf8');
                this.modifiedFiles++;
                console.log(`✓ Removed comments from: ${filePath}`);
            }
        } catch (error) {
            console.error(`✗ Error processing ${filePath}: ${error.message}`);
        }
    }

    /**
     * Recursively process directory
     */
    processDirectory(dirPath, excludeDirs = []) {
        try {
            const items = fs.readdirSync(dirPath);
            
            for (const item of items) {
                const itemPath = path.join(dirPath, item);
                const stat = fs.statSync(itemPath);
                
                if (stat.isDirectory()) {
                    // Skip excluded directories
                    if (excludeDirs.includes(item) || item.startsWith('.')) {
                        continue;
                    }
                    this.processDirectory(itemPath, excludeDirs);
                } else if (stat.isFile()) {
                    const ext = path.extname(item).toLowerCase();
                    if (this.supportedExtensions.includes(ext)) {
                        this.processFile(itemPath);
                    }
                }
            }
        } catch (error) {
            console.error(`✗ Error processing directory ${dirPath}: ${error.message}`);
        }
    }

    /**
     * Main execution function
     */
    run(targetPath = '.', options = {}) {
        const {
            excludeDirs = ['node_modules', 'bin', 'obj', '.git', '.vs', 'dist', 'build'],
            dryRun = false
        } = options;

        console.log('🔍 Comment Removal Tool');
        console.log('======================');
        console.log(`Target: ${path.resolve(targetPath)}`);
        console.log(`Supported extensions: ${this.supportedExtensions.join(', ')}`);
        console.log(`Excluded directories: ${excludeDirs.join(', ')}`);
        
        if (dryRun) {
            console.log('🔍 DRY RUN MODE - No files will be modified');
        }
        
        console.log('');

        const startTime = Date.now();
        
        if (fs.statSync(targetPath).isFile()) {
            this.processFile(targetPath);
        } else {
            this.processDirectory(targetPath, excludeDirs);
        }

        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);

        console.log('');
        console.log('📊 Summary');
        console.log('==========');
        console.log(`Files processed: ${this.processedFiles}`);
        console.log(`Files modified: ${this.modifiedFiles}`);
        console.log(`Time taken: ${duration}s`);
        
        if (this.modifiedFiles > 0) {
            console.log('');
            console.log('⚠️  IMPORTANT: Please review the changes and test your code!');
            console.log('   Comments may contain important information or disable code.');
        }
    }
}

// CLI interface
if (require.main === module) {
    const args = process.argv.slice(2);
    const targetPath = args[0] || '.';
    const dryRun = args.includes('--dry-run') || args.includes('-d');
    const help = args.includes('--help') || args.includes('-h');

    if (help) {
        console.log(`
Usage: node remove-comments.js [path] [options]

Arguments:
  path              Target file or directory (default: current directory)

Options:
  --dry-run, -d     Show what would be changed without modifying files
  --help, -h        Show this help message

Examples:
  node remove-comments.js                    # Process current directory
  node remove-comments.js ./Src             # Process specific directory
  node remove-comments.js file.cs           # Process single file
  node remove-comments.js --dry-run          # Preview changes only

Supported file types: .cs, .ts, .tsx, .js, .jsx

⚠️  WARNING: This tool will permanently remove comments from your code.
   Make sure to backup your files or commit to version control first!
        `);
        process.exit(0);
    }

    // Safety check
    if (!dryRun) {
        console.log('⚠️  WARNING: This will permanently remove comments from your code files!');
        console.log('   Make sure you have backed up your files or committed to version control.');
        console.log('   Use --dry-run to preview changes first.');
        console.log('');
        console.log('   Press Ctrl+C to cancel, or any key to continue...');
        
        // Wait for user input
        process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.on('data', () => {
            process.stdin.setRawMode(false);
            process.stdin.pause();
            
            const remover = new CommentRemover();
            remover.run(targetPath, { dryRun });
        });
    } else {
        const remover = new CommentRemover();
        remover.run(targetPath, { dryRun });
    }
}

module.exports = CommentRemover;

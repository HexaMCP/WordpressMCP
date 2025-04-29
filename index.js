#!/usr/bin/env node
/**
 * WordPress MCP Server
 * 
 * This is the main entry point for the WordPress MCP Server.
 * It parses command-line arguments and starts the server with the appropriate transport.
 */
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { WordPressMcpServer } from './server.js';
import { startSseServer } from './sse.js';
import minimist from 'minimist';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Get directory name in ESM
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Parse command-line arguments
 */
function parseArgs() {
  const args = minimist(process.argv.slice(2), {
    string: ['transport', 'config', 'port'],
    boolean: ['help', 'version'],
    alias: {
      h: 'help',
      v: 'version',
      t: 'transport',
      c: 'config',
      p: 'port'
    },
    default: {
      transport: 'stdio',
      port: '3000'
    }
  });
  
  return args;
}

/**
 * Print help message
 */
function printHelp() {
  console.error(`
WordPress MCP Server

Usage: node index.js [options]

Options:
  -h, --help                 Show this help message
  -v, --version              Show version information
  -t, --transport <type>     Transport type (stdio, sse) [default: stdio]
  -c, --config <path>        Path to configuration file
  -p, --port <port>          Port for SSE transport [default: 3000]

Examples:
  node index.js                           # Start with stdio transport
  node index.js --transport=sse           # Start with SSE transport
  node index.js --config=./my-config.json # Use custom configuration file
  node index.js --transport=sse --port=8080 # Use SSE transport on port 8080
  `);
}


/**
 * Print version information
 */
function printVersion() {
  try {
    const packageJsonPath = path.join(__dirname, 'package.json');
    const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf8');
    const packageJson = JSON.parse(packageJsonContent);
    console.error(`WordPress MCP Server v${packageJson.version}`);
  } catch (error) {
    console.error('Error reading package.json:', error);
    console.error('WordPress MCP Server (version unknown)');
  }
}

/**
 * Main function
 */
async function main() {
  // Parse command-line arguments
  const args = parseArgs();
  
  // Handle help and version flags
  if (args.help) {
    printHelp();
    process.exit(0);
  }
  
  if (args.version) {
    printVersion();
    process.exit(0);
  }
  
  // Get configuration path
  const configPath = args.config ? path.resolve(args.config) : undefined;
  
  // Start server with appropriate transport
  if (args.transport === 'stdio') {
    console.error('[Server] Starting with stdio transport');
    
    // Create server
    const server = new WordPressMcpServer({ configPath });
    
    // Create transport
    const transport = new StdioServerTransport();
    
    // Run server
    await server.run(transport);
  } else if (args.transport === 'sse') {
    console.error('[Server] Starting with SSE transport');
    console.error(`[Server] Listening on port ${args.port}`);
    
    // Start SSE server
    startSseServer({
      port: parseInt(args.port, 10),
      configPath
    });
  } else {
    console.error(`[Server] Unknown transport: ${args.transport}`);
    process.exit(1);
  }
}

// Run main function
main().catch(error => {
  console.error('[Server] Error:', error);
  process.exit(1);
});

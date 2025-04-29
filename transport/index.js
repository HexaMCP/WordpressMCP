/**
 * Transport Factory for WordPress MCP Server
 * 
 * This module provides a factory function for creating transport instances
 * based on the specified type.
 */
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { HttpServerTransport } from './http.js';

/**
 * Create a transport instance based on the specified type
 * @param {string} type - The transport type ('stdio' or 'http')
 * @param {Object} options - Configuration options for the transport
 * @returns {Transport} A transport instance
 */
export function createTransport(type, options = {}) {
  console.error(`[Transport] Creating transport of type: ${type}`);
  
  switch (type.toLowerCase()) {
    case 'stdio':
      return new StdioServerTransport();
    case 'http':
      return new HttpServerTransport(options);
    default:
      console.error(`[Transport] Unknown transport type: ${type}, falling back to stdio`);
      return new StdioServerTransport();
  }
}

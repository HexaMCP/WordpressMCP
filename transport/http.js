/**
 * HTTP Transport for WordPress MCP Server
 * 
 * This module implements an HTTP transport for the MCP server,
 * allowing remote access via HTTP/REST.
 */
import express from 'express';
import bodyParser from 'body-parser';
import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';

/**
 * HTTP Server Transport for MCP
 * Implements the Transport interface for HTTP communication
 */
export class HttpServerTransport extends Transport {
  /**
   * Create a new HTTP Server Transport
   * @param {Object} options - Configuration options
   * @param {number} options.port - Port to listen on (default: 3000)
   * @param {string} options.authToken - Authentication token (default: 'default-token')
   */
  constructor(options = {}) {
    super();
    this.port = options.port || 3000;
    this.app = express();
    this.server = null;
    this.pendingRequests = new Map();
    this.authToken = options.authToken || 'default-token';
    
    // Configure Express
    this.app.use(bodyParser.json());
    
    // Basic authentication middleware
    this.app.use((req, res, next) => {
      const token = req.headers['authorization'];
      if (token !== `Bearer ${this.authToken}`) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      next();
    });
    
    // Set up the MCP endpoint
    this.app.post('/mcp', async (req, res) => {
      try {
        const requestId = req.body.id || Math.random().toString(36).substring(2, 15);
        const requestData = req.body;
        
        // Create a promise that will be resolved when we get a response
        const responsePromise = new Promise((resolve, reject) => {
          // Set a timeout to prevent hanging requests
          const timeout = setTimeout(() => {
            this.pendingRequests.delete(requestId);
            reject(new Error('Request timeout'));
          }, 30000); // 30 second timeout
          
          this.pendingRequests.set(requestId, { resolve, reject, timeout });
        });
        
        // Forward the request to the MCP server
        if (this.onmessage) {
          // Add the request ID if it doesn't exist
          if (!requestData.id) {
            requestData.id = requestId;
          }
          this.onmessage(JSON.stringify(requestData));
        }
        
        // Wait for the response
        const response = await responsePromise;
        res.json(JSON.parse(response));
      } catch (error) {
        console.error('[HTTP] Error processing request:', error);
        res.status(500).json({ error: error.message });
      }
    });
    
    console.error(`[HTTP] Initializing on port ${this.port}`);
  }

  /**
   * Connect the transport
   * @returns {Promise<void>}
   */
  async connect() {
    return new Promise((resolve) => {
      this.server = this.app.listen(this.port, () => {
        console.error(`[HTTP] Server listening on port ${this.port}`);
        resolve();
      });
    });
  }

  /**
   * Send a message through the transport
   * @param {string} message - The message to send
   */
  async send(message) {
    try {
      // Parse the response
      const response = JSON.parse(message);
      
      // Find the pending request
      const requestId = response.id;
      if (requestId && this.pendingRequests.has(requestId)) {
        const { resolve, timeout } = this.pendingRequests.get(requestId);
        clearTimeout(timeout);
        resolve(message);
        this.pendingRequests.delete(requestId);
      } else {
        console.error(`[HTTP] Cannot match response to request: ${requestId}`);
      }
    } catch (error) {
      console.error('[HTTP] Error sending response:', error);
    }
  }

  /**
   * Close the transport
   * @returns {Promise<void>}
   */
  async close() {
    if (this.server) {
      return new Promise((resolve) => {
        this.server.close(() => {
          console.error('[HTTP] Server closed');
          resolve();
        });
      });
    }
  }
}

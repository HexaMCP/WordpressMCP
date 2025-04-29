/**
 * SSE Server for WordPress MCP Server
 * 
 * This module implements an SSE (Server-Sent Events) server for the WordPress MCP Server,
 * allowing remote access via HTTP/SSE.
 * 
 * The SSE transport follows the MCP protocol specification:
 * 
 * 1. Connection Establishment:
 *    - Client connects to `/sse` endpoint via GET request
 *    - Server creates an SSEServerTransport instance
 *    - Server sends an "endpoint" event with the session ID
 * 
 * 2. Message Exchange:
 *    - Client sends requests to `/message/{sessionId}` endpoint via POST
 *    - Server responds with "Accepted" (status 202)
 *    - Server sends the actual response via the SSE connection
 */
import express from 'express';
import bodyParser from 'body-parser';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { WordPressMcpServer } from './server.js';
import { CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { addNewSite } from './db/db_connect.js';

/**
 * Start an SSE server for the WordPress MCP Server
 * @param {Object} options - Configuration options
 * @param {number} options.port - Port to listen on (default: 3000)
 * @param {string} options.configPath - Path to the configuration file
 * @returns {Object} Object with close method to shut down the server
 */
export function startSseServer(options = {}) {
  const { port = 3000, configPath } = options;

  const app = express();

  // Apply JSON body parsing to all routes EXCEPT /message
  app.use((req, res, next) => {
    if (req.path !== '/message') {
      bodyParser.json({
        strict: false
      })(req, res, next);
    } else {
      next();
    }
  });
  
  // Add error handling for JSON parsing
  app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
      console.error('[SSE] JSON parse error:', err.message);
      return res.status(400).json({ error: 'Invalid JSON in request body' });
    }
    next(err);
  });

  // Store active connections
  const connections = new Map();

  app.post('/connect-account', async (req, res) => {

    let postData = req.body;

    let values = [
      [postData.email, postData.site_url, postData.c_key, postData.c_secret, postData.username, postData.password, postData.status]
    ];

    let dbRes = await addNewSite(values);

    if (dbRes.error) {  
      return res.status(500).json({ "status": "error", "error": 'Error adding new site', "message": dbRes.error });
    }

    res.status(200).send('{"status": "success", "message": "Account connected successfully", "account_key": "'+dbRes.account_key+'"}');

  });

  // Set up SSE endpoint
  app.get('/:account_key/sse', async (req, res) => {
    console.error('[SSE] Received connection');

    
    // Create a new server instance for this connection
    const server = new WordPressMcpServer({ configPath, account_key: req.params.account_key });
    
    // Create SSE transport with path parameter instead of query parameter
    const transport = new SSEServerTransport('/message', res);
    
    console.error('[SSE] Transport created, connecting server...');
    
    // Get the session ID from the transport
    const sessionId = transport.sessionId;
    console.error(`[SSE] Created session: ${sessionId}`);
    
    // Store the connection
    connections.set(sessionId, { server, transport, res });

    // Handle client disconnect
    req.on('close', () => {
      console.error(`[SSE] Client disconnected: ${sessionId}`);
      
      // Clean up the connection
      if (connections.has(sessionId)) {
        const connection = connections.get(sessionId);
        connection.server.server.close().catch(console.error);
        connections.delete(sessionId);
      }
    });

    try {
      // Connect the server to the transport
      await server.connect(transport);
      console.error(`[SSE] Server connected to transport for session: ${sessionId}`);
    } catch (error) {
      console.error('[SSE] Error connecting server to transport:', error);
      connections.delete(sessionId);
      
      // Don't try to send a response if headers are already sent
      if (!res.headersSent) {
        res.status(500).send('Error establishing SSE connection');
      }
    }
  });

  // Set up message endpoint for client-to-server communication using path parameter
  app.post('/message', async (req, res) => {
    // Extract the session ID from the URL path parameter
    const rawSessionId = req.query.sessionId;
    
    // Extract just the session ID, removing any additional query parameters
    const sessionId = typeof rawSessionId === 'string' 
      ? rawSessionId.split('?')[0].split('&')[0]
      : rawSessionId;
    
    console.error(`[SSE] Received message for session: ${rawSessionId}`);
    console.error(`[SSE] Parsed session ID: ${sessionId}`);
    
    // We can't read the request body directly because it would consume the stream
    // Instead, we'll log the request URL and query parameters
    console.error(`[SSE:DEBUG] Request URL: ${req.url}`);
    console.error(`[SSE:DEBUG] Request query params:`, req.query);
    
    // Check if this might be a tools/list request based on the session ID
    if (sessionId) {
      console.error('[SSE:DEBUG] This might be a tools/list request');
    }
    
    try {
      // Find the connection
      if (!connections.has(sessionId)) {
        console.error(`[SSE] Session ID not found: ${sessionId}`);
        console.error(`[SSE] Known sessions: ${Array.from(connections.keys()).join(', ')}`);
        return res.status(400).json({ error: 'Invalid or expired session' });
      }
      
      const connection = connections.get(sessionId);
      const { transport, server } = connection;
      
      // Log the server state
      console.error(`[SSE:DEBUG] Server instance for session ${sessionId}:`);
      console.error(`[SSE:DEBUG] Server has ${server.toolDefinitions ? server.toolDefinitions.length : 'unknown'} tool definitions`);
      
      console.error('[SSE] Calling handlePostMessage');
      
      // Monkey patch the transport to log the response
      const originalSendEvent = transport.sendEvent;
      transport.sendEvent = function(event, data) {
        console.error(`[SSE:DEBUG] Sending event: ${event}`);
        
        // Check if this is a response to a tools/list request
        if (data && data.id === 'list-tools' && data.result) {
          console.error(`[SSE:DEBUG] Response to tools/list request: Number of tools: ${data.result.tools ? data.result.tools.length : 0}`);
          if (data.result.tools && data.result.tools.length > 0) {
            console.error(`[SSE:DEBUG] Tool names: ${data.result.tools.map(t => t.name).join(', ')}`);
          }
        }
        
        return originalSendEvent.call(this, event, data);
      };
      
      await transport.handlePostMessage(req, res);
      console.error('[SSE] handlePostMessage completed successfully');
    } catch (error) {
      console.error('[SSE] Error handling message:', error);
      
      // If headers haven't been sent yet, send an error response
      if (!res.headersSent) {
        res.status(500).json({ 
          error: 'Error processing request',
          message: error.message
        });
      }
    }
  });

  // Start the Express server
  const httpServer = app.listen(port, () => {
    console.error(`[SSE] Server listening on port ${port}`);
  });
  
  // Return cleanup function
  return {
    close: async () => {
      // Close the HTTP server
      httpServer.close();
      
      // Close all active connections
      for (const [sessionId, connection] of connections.entries()) {
        try {
          console.error(`[SSE] Closing connection: ${sessionId}`);
          await connection.server.server.close();
        } catch (error) {
          console.error(`[SSE] Error closing connection ${sessionId}:`, error);
        }
      }
      
      // Clear the connections map
      connections.clear();
    }
  };
}

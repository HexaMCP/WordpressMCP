/**
 * WordPress MCP Server
 * 
 * This module implements the core MCP server for WordPress integration.
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { registerSiteTools } from './tools/site-tools.js';
import { registerPostTools } from './tools/post-tools.js';
import { registerPageTools } from './tools/page-tools.js';
import { registerWooProductTools } from './tools/woo-product-tools.js';
import { registerWooOrderTools } from './tools/woo-order-tools.js';

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { getSiteByKey } from './db/db_connect.js';

// Get directory name in ESM
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * WordPress MCP Server
 * Implements a Model Context Protocol server for WordPress integration
 */
export class WordPressMcpServer {
  /**
   * Create a new WordPress MCP Server
   * @param {Object} options - Configuration options
   * @param {string} options.configPath - Path to the configuration file
   */
  constructor(options = {}) {
    console.error('[Server:DEBUG] Constructor called with options:', JSON.stringify(options));
    
    this.configPath = options.configPath || path.join(__dirname, 'config.json');
    this.config = this.loadConfig();
    
    this.renderInit(options.account_key);
  }

  async renderInit(account_key) {

    let dbRes = await getSiteByKey(account_key);

    var _this = this;
    
    
    if(dbRes && dbRes.length > 0){

      let site_config_data = {
        "sites": [
          {
            "id": dbRes[0].account_key,
            "name": "Wordpress site - "+dbRes[0].site_url,
            "url": dbRes[0].site_url,
            "consumerKey": dbRes[0].c_key,
            "consumerSecret": dbRes[0].c_secret,
            "username": dbRes[0].username,
            "applicationPassword": dbRes[0].password
          }
        ],
        "activeSiteId": dbRes[0].account_key
      };
      
      this.config = site_config_data;

    }
    else{
      this.config = this.loadConfig();
    }

    this.config = this.loadConfig();
    
    // Store tool handlers
    this.toolHandlers = new Map();
    console.error(`[Server:DEBUG] Initialized toolHandlers map: ${this.toolHandlers.size} entries`);
    
    // Store tool definitions
    this.toolDefinitions = [];
    console.error(`[Server:DEBUG] Initialized toolDefinitions array: ${this.toolDefinitions.length} entries`);
    
    // Initialize the MCP server
    this.server = new Server(
      {
        name: 'wordpress-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );
    console.error('[Server:DEBUG] MCP Server instance created');
    
    // Set up error handling
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };
    
    // Register tools
    this.registerTools();
    console.error(`[Server:DEBUG] After registerTools: toolDefinitions has ${this.toolDefinitions.length} entries`);
    
    // Register the centralized tool handlers
    this.registerCentralizedToolHandlers();
    console.error(`[Server:DEBUG] After registerCentralizedToolHandlers: toolDefinitions has ${this.toolDefinitions.length} entries`);
    
    console.error('[Server] WordPress MCP Server initialized');
  }
  
  /**
   * Load the server configuration
   * @returns {Object} The server configuration
   */
  loadConfig() {
    try {
      if (fs.existsSync(this.configPath)) {
        const configData = fs.readFileSync(this.configPath, 'utf8');
        return JSON.parse(configData);
      }
    } catch (error) {
      console.error('[Config] Error loading configuration:', error);
    }
    
    // Return default configuration
    return {
      server: {
        transport: 'stdio',
        http: {
          port: 3000,
          authToken: 'default-token'
        }
      },
      sites: []
    };
  }
  
  /**
   * Save the server configuration
   */
  saveConfig() {
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2), 'utf8');
    } catch (error) {
      console.error('[Config] Error saving configuration:', error);
    }
  }
  
  /**
   * Register a tool handler
   * @param {string} toolName - The name of the tool
   * @param {Function} handler - The handler function
   */
  registerToolHandler(toolName, handler) {
    console.error("registerToolHandler: ", toolName);
    this.toolHandlers.set(toolName, handler);
  }
  
  /**
   * Register a tool definition
   * @param {Object} toolDefinition - The tool definition object
   */
  registerToolDefinition(toolDefinition) {
    console.error(`[Tools:DEBUG] Registering tool definition: ${toolDefinition.name}`);
    this.toolDefinitions.push(toolDefinition);
    console.error(`[Tools:DEBUG] toolDefinitions now has ${this.toolDefinitions.length} entries`);
  }
  
  /**
   * Register multiple tool definitions
   * @param {Array<Object>} toolDefinitions - Array of tool definition objects
   */
  registerToolDefinitions(toolDefinitions) {
    console.error(`[Tools:DEBUG] Registering ${toolDefinitions.length} tool definitions: ${toolDefinitions.map(t => t.name).join(', ')}`);
    for (const toolDefinition of toolDefinitions) {
      this.registerToolDefinition(toolDefinition);
    }
  }
  
  /**
   * Register the centralized tool handlers
   * This sets up handlers for both tool listing and tool calling
   */
  registerCentralizedToolHandlers() {
    console.error('[Server:DEBUG] Setting up centralized tool handlers');
    
    // Handler for tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      console.error(`[CallTool:DEBUG] Received tool call request for: ${request.params.name}`);
      const { name, arguments: args } = request.params;
      
      // Check if we have a handler for this tool
      if (this.toolHandlers.has(name)) {
        console.error(`[CallTool:DEBUG] Found handler for tool: ${name}`);
        return this.toolHandlers.get(name)(args);
      }
      
      // If no handler is found, throw an error
      console.error(`[CallTool:DEBUG] No handler found for tool: ${name}`);
      throw new Error(`Unknown tool: ${name}`);
    });
    
    // Handler for tool listing
    this.server.setRequestHandler(ListToolsRequestSchema, async (request) => {
      console.error(`[ListTools:DEBUG] Received tools/list request`);
      console.error(`[ListTools:DEBUG] Request params: ${JSON.stringify(request.params)}`);
      console.error(`[ListTools:DEBUG] Current toolDefinitions count: ${this.toolDefinitions.length}`);
      if (this.toolDefinitions.length > 0) {
        console.error(`[ListTools:DEBUG] First few tools: ${this.toolDefinitions.slice(0, 3).map(t => t.name).join(', ')}`);
      }
      
      const response = {
        tools: this.toolDefinitions
      };
      
      console.error(`[ListTools:DEBUG] Returning ${this.toolDefinitions.length} registered tools`);
      return response;
    });
    
    console.error('[Server:DEBUG] Centralized tool handlers set up');
  }
  
  /**
   * Register all tools with the server
   */
  registerTools() {
    console.error('[Server] Registering tools');
    
    // Create a proxy for the server that forwards all method calls to the original server
    // and adds our custom methods
    const serverProxy = new Proxy(this.server, {
      get: (target, prop) => {
        // Add our custom methods
        if (prop === 'registerToolDefinition') {
          return (toolDefinition) => this.registerToolDefinition(toolDefinition);
        }
        if (prop === 'registerToolDefinitions') {
          return (toolDefinitions) => this.registerToolDefinitions(toolDefinitions);
        }
        
        // Forward all other properties to the original server
        const value = target[prop];
        if (typeof value === 'function') {
          // Bind methods to the original server
          return value.bind(target);
        }
        return value;
      }
    });
    
    console.error('[Server:DEBUG] Created server proxy with custom methods');
    console.error('[Server:DEBUG] Server proxy has setRequestHandler:', typeof serverProxy.setRequestHandler === 'function');
    
    
    // Register site management tools
    const siteManager = registerSiteTools(serverProxy, {
      configPath: this.configPath,
      registerToolHandler: (name, handler) => {
        this.registerToolHandler(name, handler);
      }
    });
    
    // Register post management tools
    registerPostTools(serverProxy, {
      siteManager,
      registerToolHandler: (name, handler) => {
        this.registerToolHandler(name, handler);
      }
    });
    
    // Register page management tools
    registerPageTools(serverProxy, {
      siteManager,
      registerToolHandler: (name, handler) => {
        this.registerToolHandler(name, handler);
      }
    });
    

    registerWooProductTools(serverProxy, {
      siteManager,
      registerToolHandler: (name, handler) => {
        this.registerToolHandler(name, handler);
      }
    });

    registerWooOrderTools(serverProxy, {
      siteManager,
      registerToolHandler: (name, handler) => {
        this.registerToolHandler(name, handler);
      }
    });
    
    // In future phases, we'll register additional tools here:
    // - More WordPress API tools (comments, etc.)
    
    console.error('[Server] Tools registered');
  }
  
  /**
   * Run the server with the specified transport
   * @param {Transport} transport - The transport to use
   */
  async run(transport) {
    console.error('[Server] Starting WordPress MCP Server');
    
    try {
      await this.connect(transport);
      console.error('[Server] WordPress MCP Server running');
      
      // Handle process termination
      process.on('SIGINT', async () => {
        console.error('[Server] Shutting down...');
        await this.server.close();
        process.exit(0);
      });
    } catch (error) {
      console.error('[Server] Error starting server:', error);
      throw error;
    }
  }
  
  /**
   * Connect the server to the specified transport
   * 
   * This method connects the server to the specified transport, allowing it to
   * receive and respond to messages. The transport is responsible for handling
   * the actual communication with the client.
   * 
   * For SSE transport, this method:
   * 1. Initializes the transport
   * 2. Sets up event handlers for messages, errors, and connection close
   * 3. Starts the transport, which sends the initial endpoint event with session ID
   * 
   * @param {Transport} transport - The transport to use (e.g., StdioServerTransport, SSEServerTransport)
   * @returns {Promise<void>} A promise that resolves when the connection is established
   * @throws {Error} If the connection fails
   */
  async connect(transport) {
    return this.server.connect(transport);
  }
}

/**
 * Site Management Tools for WordPress MCP Server
 * 
 * This module provides MCP tools for managing WordPress sites.
 * It includes tools for adding, listing, selecting, and removing sites.
 */
import { SiteManager } from '../sites/index.js';
import { ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

/**
 * Register site management tools with the MCP server
 * 
 * @param {Server} server - The MCP server instance
 * @param {Object} options - Tool options
 * @param {string} options.configPath - Path to the configuration file
 * @param {Function} options.registerToolHandler - Function to register a tool handler
 */
export function registerSiteTools(server, options) {
  console.error('[Tools] Registering site management tools');
  
  // Create site manager
  const siteManager = new SiteManager({ configPath: options.configPath });
  
  // Extract the registerToolHandler function
  const { registerToolHandler } = options;
  
  // Define the tools
  const tools = [
    {
      name: 'add_site',
      description: 'Add a new WordPress site',
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Site name'
          },
          url: {
            type: 'string',
            description: 'Site URL'
          },
          username: {
            type: 'string',
            description: 'WordPress username'
          },
          applicationPassword: {
            type: 'string',
            description: 'WordPress application password'
          },
          validate: {
            type: 'boolean',
            description: 'Whether to validate the site credentials',
            default: true
          }
        },
        required: ['name', 'url']
      }
    },
    {
      name: 'list_sites',
      description: 'List all WordPress sites',
      inputSchema: {
        type: 'object',
        properties: {
          includeCredentials: {
            type: 'boolean',
            description: 'Whether to include credentials in the response',
            default: false
          }
        }
      }
    },
    {
      name: 'get_site',
      description: 'Get a WordPress site by ID or name',
      inputSchema: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Site ID'
          },
          name: {
            type: 'string',
            description: 'Site name'
          },
          includeCredentials: {
            type: 'boolean',
            description: 'Whether to include credentials in the response',
            default: false
          }
        },
        oneOf: [
          { required: ['id'] },
          { required: ['name'] }
        ]
      }
    },
    {
      name: 'update_site',
      description: 'Update a WordPress site',
      inputSchema: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Site ID'
          },
          name: {
            type: 'string',
            description: 'Site name'
          },
          url: {
            type: 'string',
            description: 'Site URL'
          },
          username: {
            type: 'string',
            description: 'WordPress username'
          },
          applicationPassword: {
            type: 'string',
            description: 'WordPress application password'
          },
          validate: {
            type: 'boolean',
            description: 'Whether to validate the site credentials',
            default: true
          }
        },
        required: ['id']
      }
    },
    {
      name: 'remove_site',
      description: 'Remove a WordPress site',
      inputSchema: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Site ID'
          }
        },
        required: ['id']
      }
    },
    {
      name: 'select_site',
      description: 'Select a WordPress site as the active site',
      inputSchema: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Site ID'
          }
        },
        required: ['id']
      }
    },
    {
      name: 'get_active_site',
      description: 'Get the active WordPress site',
      inputSchema: {
        type: 'object',
        properties: {
          includeCredentials: {
            type: 'boolean',
            description: 'Whether to include credentials in the response',
            default: false
          }
        }
      }
    },
    /* {
      name: 'test_site_connectivity',
      description: 'Test connectivity to a WordPress site',
      inputSchema: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Site ID'
          }
        },
        required: ['id']
      }
    }, */
    {
      name: 'get_site_info',
      description: 'Get information about a WordPress site',
      inputSchema: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Site ID'
          }
        },
        required: ['id']
      }
    }
  ];
  
  // Register tool definitions with the server
  console.error('[SiteTools:DEBUG] Checking for centralized registration method');
  console.error('[SiteTools:DEBUG] server.registerToolDefinitions exists:', typeof server.registerToolDefinitions === 'function');
  
  if (typeof server.registerToolDefinitions === 'function') {
    // Use the new centralized registration method if available
    console.error('[SiteTools:DEBUG] Using centralized registration method');
    console.error('[SiteTools:DEBUG] Registering tools:', tools.map(t => t.name).join(', '));
    server.registerToolDefinitions(tools);
    console.error('[ListTools] Site tools registered using centralized method:', tools.map(t => t.name));
  } else {
    // Fall back to the old method for backward compatibility
    console.error('[SiteTools:DEBUG] Falling back to legacy registration method');
    server.setRequestHandler(ListToolsRequestSchema, async () => {
      console.error('[SiteTools:DEBUG] Legacy ListToolsRequestSchema handler called');
      return { tools };
    });
  }
  
  // Filter out credentials from site objects
  const filterCredentials = (site, includeCredentials = false) => {
    if (!site) return null;
    
    const { applicationPassword, ...filteredSite } = site;
    
    if (!includeCredentials) {
      return filteredSite;
    }
    
    return site;
  };
  
  // Register individual tool handlers
  if (registerToolHandler) {
    // Register add_site tool handler
    registerToolHandler('add_site', async (args) => {
      console.error('[Tool:add_site] Adding site:', args.name);
      
      try {
        const site = await siteManager.addSite(args);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status: 'success',
                message: `Site "${args.name}" added successfully`,
                site: filterCredentials(site, args.includeCredentials)
              }, null, 2)
            }
          ]
        };
      } catch (error) {
        console.error('[Tool:add_site] Error:', error);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status: 'error',
                message: error.message
              }, null, 2)
            }
          ],
          isError: true
        };
      }
    });
    
    // Register list_sites tool handler
    registerToolHandler('list_sites', (args) => {
      console.error('[Tool:list_sites] Listing sites');
      
      try {
        const sites = siteManager.getAllSites().map(site => 
          filterCredentials(site, args.includeCredentials)
        );
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status: 'success',
                count: sites.length,
                sites
              }, null, 2)
            }
          ]
        };
      } catch (error) {
        console.error('[Tool:list_sites] Error:', error);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status: 'error',
                message: error.message
              }, null, 2)
            }
          ],
          isError: true
        };
      }
    });
    
    // Register get_site tool handler
    registerToolHandler('get_site', (args) => {
      console.error('[Tool:get_site] Getting site:', args.id || args.name);
      
      try {
        let site;
        
        if (args.id) {
          site = siteManager.getSiteById(args.id);
        } else if (args.name) {
          site = siteManager.getSiteByName(args.name);
        }
        
        if (!site) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  status: 'error',
                  message: `Site not found: ${args.id || args.name}`
                }, null, 2)
              }
            ],
            isError: true
          };
        }
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status: 'success',
                site: filterCredentials(site, args.includeCredentials)
              }, null, 2)
            }
          ]
        };
      } catch (error) {
        console.error('[Tool:get_site] Error:', error);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status: 'error',
                message: error.message
              }, null, 2)
            }
          ],
          isError: true
        };
      }
    });
    
    // Register update_site tool handler
    registerToolHandler('update_site', async (args) => {
      console.error('[Tool:update_site] Updating site:', args.id);
      
      try {
        const { id, ...updates } = args;
        
        const site = await siteManager.updateSite(id, updates);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status: 'success',
                message: `Site "${site.name}" updated successfully`,
                site: filterCredentials(site, args.includeCredentials)
              }, null, 2)
            }
          ]
        };
      } catch (error) {
        console.error('[Tool:update_site] Error:', error);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status: 'error',
                message: error.message
              }, null, 2)
            }
          ],
          isError: true
        };
      }
    });
    
    // Register remove_site tool handler
    registerToolHandler('remove_site', (args) => {
      console.error('[Tool:remove_site] Removing site:', args.id);
      
      try {
        const success = siteManager.removeSite(args.id);
        
        if (!success) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  status: 'error',
                  message: `Site not found: ${args.id}`
                }, null, 2)
              }
            ],
            isError: true
          };
        }
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status: 'success',
                message: 'Site removed successfully'
              }, null, 2)
            }
          ]
        };
      } catch (error) {
        console.error('[Tool:remove_site] Error:', error);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status: 'error',
                message: error.message
              }, null, 2)
            }
          ],
          isError: true
        };
      }
    });
    
    // Register select_site tool handler
    registerToolHandler('select_site', (args) => {
      console.error('[Tool:select_site] Selecting site:', args.id);
      
      try {
        const site = siteManager.setActiveSite(args.id);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status: 'success',
                message: `Site "${site.name}" selected as active site`,
                site: filterCredentials(site, args.includeCredentials)
              }, null, 2)
            }
          ]
        };
      } catch (error) {
        console.error('[Tool:select_site] Error:', error);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status: 'error',
                message: error.message
              }, null, 2)
            }
          ],
          isError: true
        };
      }
    });
    
    // Register get_active_site tool handler
    registerToolHandler('get_active_site', (args) => {
      console.error('[Tool:get_active_site] Getting active site');
      
      try {
        const site = siteManager.getActiveSite();
        
        if (!site) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  status: 'error',
                  message: 'No active site set'
                }, null, 2)
              }
            ],
            isError: true
          };
        }
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status: 'success',
                site: filterCredentials(site, args.includeCredentials)
              }, null, 2)
            }
          ]
        };
      } catch (error) {
        console.error('[Tool:get_active_site] Error:', error);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status: 'error',
                message: error.message
              }, null, 2)
            }
          ],
          isError: true
        };
      }
    });
    
    // Register test_site_connectivity tool handler
    registerToolHandler('test_site_connectivity', async (args) => {
      console.error('[Tool:test_site_connectivity] Testing connectivity to site:', args.id);
      
      try {
        const reachable = await siteManager.testSiteConnectivity(args.id);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status: 'success',
                reachable,
                message: reachable ? 'Site is reachable' : 'Site is not reachable'
              }, null, 2)
            }
          ]
        };
      } catch (error) {
        console.error('[Tool:test_site_connectivity] Error:', error);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status: 'error',
                message: error.message
              }, null, 2)
            }
          ],
          isError: true
        };
      }
    });
    
    // Register get_site_info tool handler
    registerToolHandler('get_site_info', async (args) => {
      console.error('[Tool:get_site_info] Getting site info:', args.id);
      
      try {
        const info = await siteManager.getSiteInfo(args.id);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status: 'success',
                info
              }, null, 2)
            }
          ]
        };
      } catch (error) {
        console.error('[Tool:get_site_info] Error:', error);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status: 'error',
                message: error.message
              }, null, 2)
            }
          ],
          isError: true
        };
      }
    });
  }
  
  // Return the site manager for use by other tools
  return siteManager;
}

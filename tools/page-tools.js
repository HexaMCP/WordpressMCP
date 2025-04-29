/**
 * Page Management Tools for WordPress MCP Server
 * 
 * This module provides MCP tools for managing WordPress pages.
 * It includes tools for creating, retrieving, updating, and deleting pages.
 */
import { ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

/**
 * Register page management tools with the MCP server
 * 
 * @param {Server} server - The MCP server instance
 * @param {Object} options - Tool options
 * @param {SiteManager} options.siteManager - The site manager instance
 * @param {Function} options.registerToolHandler - Function to register a tool handler
 */
export function registerPageTools(server, options) {
  console.error('[Tools] Registering page management tools');
  
  const { siteManager, registerToolHandler } = options;
  
  // Define the tools
  const tools = [
    {
      name: 'list_pages',
      description: 'List pages from a WordPress site',
      inputSchema: {
        type: 'object',
        properties: {
          site_id: {
            type: 'string',
            description: 'Site ID (defaults to active site if not provided)'
          },
          per_page: {
            type: 'integer',
            description: 'Number of pages to return per page',
            default: 10
          },
          page: {
            type: 'integer',
            description: 'Page number',
            default: 1
          },
          search: {
            type: 'string',
            description: 'Search term'
          },
          parent: {
            type: 'integer',
            description: 'Parent page ID'
          },
          status: {
            type: 'string',
            description: 'Page status (publish, draft, etc.)',
            enum: ['publish', 'draft', 'pending', 'private', 'future', 'trash', 'any']
          },
          order: {
            type: 'string',
            description: 'Order (asc or desc)',
            enum: ['asc', 'desc'],
            default: 'desc'
          },
          orderby: {
            type: 'string',
            description: 'Order by field',
            enum: ['date', 'title', 'modified', 'menu_order', 'id'],
            default: 'date'
          }
        }
      }
    },
    {
      name: 'get_page',
      description: 'Get a page from a WordPress site',
      inputSchema: {
        type: 'object',
        properties: {
          site_id: {
            type: 'string',
            description: 'Site ID (defaults to active site if not provided)'
          },
          page_id: {
            type: 'integer',
            description: 'Page ID'
          }
        },
        required: ['page_id']
      }
    },
    {
      name: 'create_page',
      description: 'Create a page on a WordPress site',
      inputSchema: {
        type: 'object',
        properties: {
          site_id: {
            type: 'string',
            description: 'Site ID (defaults to active site if not provided)'
          },
          title: {
            type: 'string',
            description: 'Page title'
          },
          content: {
            type: 'string',
            description: 'Page content'
          },
          excerpt: {
            type: 'string',
            description: 'Page excerpt'
          },
          status: {
            type: 'string',
            description: 'Page status',
            enum: ['publish', 'draft', 'pending', 'private', 'future'],
            default: 'draft'
          },
          parent: {
            type: 'integer',
            description: 'Parent page ID'
          },
          menu_order: {
            type: 'integer',
            description: 'Menu order'
          },
          template: {
            type: 'string',
            description: 'Page template'
          },
          featured_media: {
            type: 'integer',
            description: 'Featured media ID'
          }
        },
        required: ['title', 'content']
      }
    },
    {
      name: 'update_page',
      description: 'Update a page on a WordPress site',
      inputSchema: {
        type: 'object',
        properties: {
          site_id: {
            type: 'string',
            description: 'Site ID (defaults to active site if not provided)'
          },
          page_id: {
            type: 'integer',
            description: 'Page ID'
          },
          title: {
            type: 'string',
            description: 'Page title'
          },
          content: {
            type: 'string',
            description: 'Page content'
          },
          excerpt: {
            type: 'string',
            description: 'Page excerpt'
          },
          status: {
            type: 'string',
            description: 'Page status',
            enum: ['publish', 'draft', 'pending', 'private', 'future', 'trash']
          },
          parent: {
            type: 'integer',
            description: 'Parent page ID'
          },
          menu_order: {
            type: 'integer',
            description: 'Menu order'
          },
          template: {
            type: 'string',
            description: 'Page template'
          },
          featured_media: {
            type: 'integer',
            description: 'Featured media ID'
          }
        },
        required: ['page_id']
      }
    },
    {
      name: 'delete_page',
      description: 'Delete a page from a WordPress site',
      inputSchema: {
        type: 'object',
        properties: {
          site_id: {
            type: 'string',
            description: 'Site ID (defaults to active site if not provided)'
          },
          page_id: {
            type: 'integer',
            description: 'Page ID'
          },
          force: {
            type: 'boolean',
            description: 'Whether to bypass trash and force deletion',
            default: false
          }
        },
        required: ['page_id']
      }
    }
  ];
  
  // Register tool definitions with the server
  console.error('[PageTools:DEBUG] Checking for centralized registration method');
  console.error('[PageTools:DEBUG] server.registerToolDefinitions exists:', typeof server.registerToolDefinitions === 'function');
  
  if (typeof server.registerToolDefinitions === 'function') {
    // Use the new centralized registration method if available
    console.error('[PageTools:DEBUG] Using centralized registration method');
    console.error('[PageTools:DEBUG] Registering tools:', tools.map(t => t.name).join(', '));
    server.registerToolDefinitions(tools);
    console.error('[ListTools] Page tools registered using centralized method:', tools.map(t => t.name));
  } else {
    // Fall back to the old method for backward compatibility
    console.error('[PageTools:DEBUG] Falling back to legacy registration method');
    server.setRequestHandler(ListToolsRequestSchema, async (request) => {
      try {
        // Get existing tools
        let response;
        if (typeof request.next === 'function') {
          response = await request.next();
        } else {
          // If request.next is not available, create a default response
          response = { tools: [] };
        }
        
        // Add our tools
        response.tools = [...(response.tools || []), ...tools];
        
        return response;
      } catch (error) {
        console.error('[ListTools] Error:', error);
        return { tools };
      }
    });
  }
  
  // Register individual tool handlers
  if (registerToolHandler) {
    // Register list_pages tool handler
    registerToolHandler('list_pages', async (args) => {
      console.error('[Tool:list_pages] Listing pages');
      
      try {
        // Get the site client
        const client = args.site_id
          ? siteManager.createClientForSite(args.site_id)
          : siteManager.createClientForActiveSite();
        
        const { per_page, page, search, parent, status, order, orderby } = args;
        
        // Build query parameters
        const params = {
          per_page,
          page,
          search,
          parent,
          status,
          order,
          orderby
        };
        
        // Filter out undefined values
        Object.keys(params).forEach(key => {
          if (params[key] === undefined) {
            delete params[key];
          }
        });
        
        // Get pages
        const pages = await client.client.get('/wp/v2/pages', params);
        
        // Get total pages and pages count from headers
        const totalPages = parseInt(client.client.lastResponse?.headers?.get('X-WP-Total') || '0', 10);
        const totalPagesCount = parseInt(client.client.lastResponse?.headers?.get('X-WP-TotalPages') || '0', 10);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status: 'success',
                count: pages.length,
                total: totalPages,
                total_pages: totalPagesCount,
                current_page: page || 1,
                pages: pages.map(page => ({
                  id: page.id,
                  title: page.title.rendered,
                  excerpt: page.excerpt.rendered,
                  status: page.status,
                  date: page.date,
                  modified: page.modified,
                  link: page.link,
                  author: page.author,
                  featured_media: page.featured_media,
                  parent: page.parent,
                  menu_order: page.menu_order,
                  template: page.template
                }))
              }, null, 2)
            }
          ]
        };
      } catch (error) {
        console.error('[Tool:list_pages] Error:', error);
        
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
    
    // Register get_page tool handler
    registerToolHandler('get_page', async (args) => {
      console.error('[Tool:get_page] Getting page:', args.page_id);
      
      try {
        // Get the site client
        const client = args.site_id
          ? siteManager.createClientForSite(args.site_id)
          : siteManager.createClientForActiveSite();
        
        const { page_id } = args;
        
        // Get page
        const page = await client.client.get(`/wp/v2/pages/${page_id}`);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status: 'success',
                page: {
                  id: page.id,
                  title: page.title.rendered,
                  content: page.content.rendered,
                  excerpt: page.excerpt.rendered,
                  status: page.status,
                  date: page.date,
                  modified: page.modified,
                  link: page.link,
                  author: page.author,
                  featured_media: page.featured_media,
                  parent: page.parent,
                  menu_order: page.menu_order,
                  template: page.template
                }
              }, null, 2)
            }
          ]
        };
      } catch (error) {
        console.error('[Tool:get_page] Error:', error);
        
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
    
    // Register create_page tool handler
    registerToolHandler('create_page', async (args) => {
      console.error('[Tool:create_page] Creating page:', args.title);
      
      try {
        // Get the site client
        const client = args.site_id
          ? siteManager.createClientForSite(args.site_id)
          : siteManager.createClientForActiveSite();
        
        const { title, content, excerpt, status, parent, menu_order, template, featured_media } = args;
        
        // Build page data
        const pageData = {
          title,
          content,
          excerpt,
          status,
          parent,
          menu_order,
          template,
          featured_media
        };
        
        // Filter out undefined values
        Object.keys(pageData).forEach(key => {
          if (pageData[key] === undefined) {
            delete pageData[key];
          }
        });
        
        // Create page
        const page = await client.client.post('/wp/v2/pages', pageData);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status: 'success',
                message: `Page '${title}' created successfully`,
                page: {
                  id: page.id,
                  title: page.title.rendered,
                  status: page.status,
                  date: page.date,
                  link: page.link
                }
              }, null, 2)
            }
          ]
        };
      } catch (error) {
        console.error('[Tool:create_page] Error:', error);
        
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
    
    // Register update_page tool handler
    registerToolHandler('update_page', async (args) => {
      console.error('[Tool:update_page] Updating page:', args.page_id);
      
      try {
        // Get the site client
        const client = args.site_id
          ? siteManager.createClientForSite(args.site_id)
          : siteManager.createClientForActiveSite();
        
        const { page_id, title, content, excerpt, status, parent, menu_order, template, featured_media } = args;
        
        // Build page data
        const pageData = {
          title,
          content,
          excerpt,
          status,
          parent,
          menu_order,
          template,
          featured_media
        };
        
        // Filter out undefined values
        Object.keys(pageData).forEach(key => {
          if (pageData[key] === undefined) {
            delete pageData[key];
          }
        });
        
        // Update page
        const page = await client.client.put(`/wp/v2/pages/${page_id}`, pageData);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status: 'success',
                message: 'Page updated successfully',
                page: {
                  id: page.id,
                  title: page.title.rendered,
                  status: page.status,
                  date: page.date,
                  modified: page.modified,
                  link: page.link
                }
              }, null, 2)
            }
          ]
        };
      } catch (error) {
        console.error('[Tool:update_page] Error:', error);
        
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
    
    // Register delete_page tool handler
    registerToolHandler('delete_page', async (args) => {
      console.error('[Tool:delete_page] Deleting page:', args.page_id);
      
      try {
        // Get the site client
        const client = args.site_id
          ? siteManager.createClientForSite(args.site_id)
          : siteManager.createClientForActiveSite();
        
        const { page_id, force } = args;
        
        // Delete page
        const page = await client.client.delete(`/wp/v2/pages/${page_id}`, { force });
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status: 'success',
                message: force
                  ? 'Page permanently deleted'
                  : 'Page moved to trash',
                page: {
                  id: page.id,
                  title: page.title.rendered,
                  status: page.status
                }
              }, null, 2)
            }
          ]
        };
      } catch (error) {
        console.error('[Tool:delete_page] Error:', error);
        
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
}

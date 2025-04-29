/**
 * Post Management Tools for WordPress MCP Server
 * 
 * This module provides MCP tools for managing WordPress posts.
 * It includes tools for creating, retrieving, updating, and deleting posts.
 */
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

/**
 * Register post management tools with the MCP server
 * 
 * @param {Server} server - The MCP server instance
 * @param {Object} options - Tool options
 * @param {SiteManager} options.siteManager - The site manager instance
 * @param {Function} options.registerToolHandler - Function to register a tool handler
 */
export function registerPostTools(server, options) {
  console.error('[Tools] Registering post management tools');
  
  const { siteManager, registerToolHandler } = options;
  
  // Define the tools
  const tools = [
    {
      name: 'list_posts',
      description: 'List posts from a WordPress site',
      inputSchema: {
        type: 'object',
        properties: {
          site_id: {
            type: 'string',
            description: 'Site ID (defaults to active site if not provided)'
          },
          per_page: {
            type: 'integer',
            description: 'Number of posts to return per page',
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
          categories: {
            type: 'array',
            description: 'Category IDs',
            items: {
              type: 'integer'
            }
          },
          tags: {
            type: 'array',
            description: 'Tag IDs',
            items: {
              type: 'integer'
            }
          },
          status: {
            type: 'string',
            description: 'Post status (publish, draft, etc.)',
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
            enum: ['date', 'title', 'modified', 'author', 'id'],
            default: 'date'
          }
        }
      }
    },
    {
      name: 'get_post',
      description: 'Get a post from a WordPress site',
      inputSchema: {
        type: 'object',
        properties: {
          site_id: {
            type: 'string',
            description: 'Site ID (defaults to active site if not provided)'
          },
          post_id: {
            type: 'integer',
            description: 'Post ID'
          }
        },
        required: ['post_id']
      }
    },
    {
      name: 'create_post',
      description: 'Create a post on a WordPress site',
      inputSchema: {
        type: 'object',
        properties: {
          site_id: {
            type: 'string',
            description: 'Site ID (defaults to active site if not provided)'
          },
          title: {
            type: 'string',
            description: 'Post title'
          },
          content: {
            type: 'string',
            description: 'Post content'
          },
          excerpt: {
            type: 'string',
            description: 'Post excerpt'
          },
          status: {
            type: 'string',
            description: 'Post status',
            enum: ['publish', 'draft', 'pending', 'private', 'future'],
            default: 'draft'
          },
          categories: {
            type: 'array',
            description: 'Category IDs',
            items: {
              type: 'integer'
            }
          },
          tags: {
            type: 'array',
            description: 'Tag IDs',
            items: {
              type: 'integer'
            }
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
      name: 'update_post',
      description: 'Update a post on a WordPress site',
      inputSchema: {
        type: 'object',
        properties: {
          site_id: {
            type: 'string',
            description: 'Site ID (defaults to active site if not provided)'
          },
          post_id: {
            type: 'integer',
            description: 'Post ID'
          },
          title: {
            type: 'string',
            description: 'Post title'
          },
          content: {
            type: 'string',
            description: 'Post content'
          },
          excerpt: {
            type: 'string',
            description: 'Post excerpt'
          },
          status: {
            type: 'string',
            description: 'Post status',
            enum: ['publish', 'draft', 'pending', 'private', 'future', 'trash']
          },
          categories: {
            type: 'array',
            description: 'Category IDs',
            items: {
              type: 'integer'
            }
          },
          tags: {
            type: 'array',
            description: 'Tag IDs',
            items: {
              type: 'integer'
            }
          },
          featured_media: {
            type: 'integer',
            description: 'Featured media ID'
          }
        },
        required: ['post_id']
      }
    },
    {
      name: 'delete_post',
      description: 'Delete a post from a WordPress site',
      inputSchema: {
        type: 'object',
        properties: {
          site_id: {
            type: 'string',
            description: 'Site ID (defaults to active site if not provided)'
          },
          post_id: {
            type: 'integer',
            description: 'Post ID'
          },
          force: {
            type: 'boolean',
            description: 'Whether to bypass trash and force deletion',
            default: false
          }
        },
        required: ['post_id']
      }
    }
  ];
  
  // Register tool definitions with the server
  console.error('[PostTools:DEBUG] Checking for centralized registration method');
  console.error('[PostTools:DEBUG] server.registerToolDefinitions exists:', typeof server.registerToolDefinitions === 'function');
  console.error('[PostTools:DEBUG] server object keys:', Object.keys(server));
  
  if (typeof server.registerToolDefinitions === 'function') {
    // Use the new centralized registration method if available
    console.error('[PostTools:DEBUG] Using centralized registration method');
    console.error('[PostTools:DEBUG] Registering tools:', tools.map(t => t.name).join(', '));
    server.registerToolDefinitions(tools);
    console.error('[ListTools] Post tools registered using centralized method:', tools.map(t => t.name));
  } else {
    // Fall back to the old method for backward compatibility
    console.error('[PostTools:DEBUG] Falling back to legacy registration method');
    server.setRequestHandler(ListToolsRequestSchema, async (request) => {
      console.error('[PostTools:DEBUG] Legacy ListToolsRequestSchema handler called');
      try {
        // Get existing tools
        let response;
        if (typeof request.next === 'function') {
          console.error('[PostTools:DEBUG] Calling request.next()');
          response = await request.next();
          console.error('[PostTools:DEBUG] request.next() returned:', JSON.stringify(response));
        } else {
          // If request.next is not available, create a default response
          console.error('[PostTools:DEBUG] request.next not available, creating default response');
          response = { tools: [] };
        }
        
        // Add our tools
        console.error('[PostTools:DEBUG] Adding post tools to response');
        response.tools = [...(response.tools || []), ...tools];
        
        console.error('[ListTools] Post tools registered using legacy method:', tools.map(t => t.name));
        
        return response;
      } catch (error) {
        console.error('[ListTools] Error:', error);
        console.error('[PostTools:DEBUG] Error in legacy handler:', error);
        return { tools };
      }
    });
  }
  
  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    
    // Check if this is one of our tools
    const tool = tools.find(t => t.name === name);
    if (!tool) {
      // If this is not one of our tools, pass to the next handler if available
      if (typeof request.next === 'function') {
        return request.next();
      } else {
        // If request.next is not available, return an error
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status: 'error',
                message: `Unknown tool: ${name}`
              }, null, 2)
            }
          ],
          isError: true
        };
      }
    }
    
    console.error(`[Tool:${name}] Executing with args:`, args);
    
    try {
      // Get the site client
      const client = args.site_id
        ? siteManager.createClientForSite(args.site_id)
        : siteManager.createClientForActiveSite();
      
      // Execute the appropriate tool based on the name
      if (name === 'list_posts') {
        return await listPosts(client, args);
      } else if (name === 'get_post') {
        return await getPost(client, args);
      } else if (name === 'create_post') {
        return await createPost(client, args);
      } else if (name === 'update_post') {
        return await updatePost(client, args);
      } else if (name === 'delete_post') {
        return await deletePost(client, args);
      }
      
      // If we get here, the tool wasn't handled
      throw new Error(`Tool not implemented: ${name}`);
    } catch (error) {
      console.error(`[Tool:${name}] Error:`, error);
      
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
  
  // Helper functions for tool implementations
  async function listPosts(client, args) {
    console.error('[Tool:list_posts] Listing posts');
    
    try {
      const { per_page, page, search, categories, tags, status, order, orderby } = args;
      
      // Build query parameters
      const params = {
        per_page,
        page,
        search,
        categories,
        tags,
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
      
      // Get posts
      const posts = await client.client.get('/wp/v2/posts', params);
      
      // Get total posts and pages from headers
      const totalPosts = parseInt(client.client.lastResponse?.headers?.get('X-WP-Total') || '0', 10);
      const totalPages = parseInt(client.client.lastResponse?.headers?.get('X-WP-TotalPages') || '0', 10);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              status: 'success',
              count: posts.length,
              total: totalPosts,
              total_pages: totalPages,
              current_page: page || 1,
              posts: posts.map(post => ({
                id: post.id,
                title: post.title.rendered,
                excerpt: post.excerpt.rendered,
                status: post.status,
                date: post.date,
                modified: post.modified,
                link: post.link,
                author: post.author,
                featured_media: post.featured_media,
                categories: post.categories,
                tags: post.tags
              }))
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      console.error('[Tool:list_posts] Error:', error);
      
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
  }
  
  async function getPost(client, args) {
    console.error('[Tool:get_post] Getting post:', args.post_id);
    
    try {
      const { post_id } = args;
      
      // Get post
      const post = await client.client.get(`/wp/v2/posts/${post_id}`);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              status: 'success',
              post: {
                id: post.id,
                title: post.title.rendered,
                content: post.content.rendered,
                excerpt: post.excerpt.rendered,
                status: post.status,
                date: post.date,
                modified: post.modified,
                link: post.link,
                author: post.author,
                featured_media: post.featured_media,
                categories: post.categories,
                tags: post.tags
              }
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      console.error('[Tool:get_post] Error:', error);
      
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
  }
  
  async function createPost(client, args) {
    console.error('[Tool:create_post] Creating post:', args.title);
    
    try {
      const { title, content, excerpt, status, categories, tags, featured_media } = args;
      
      // Build post data
      const postData = {
        title,
        content,
        excerpt,
        status,
        categories,
        tags,
        featured_media
      };
      
      // Filter out undefined values
      Object.keys(postData).forEach(key => {
        if (postData[key] === undefined) {
          delete postData[key];
        }
      });
      
      // Create post
      const post = await client.client.post('/wp/v2/posts', postData);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              status: 'success',
              message: `Post '${title}' created successfully`,
              post: {
                id: post.id,
                title: post.title.rendered,
                status: post.status,
                date: post.date,
                link: post.link
              }
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      console.error('[Tool:create_post] Error:', error);
      
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
  }
  
  async function updatePost(client, args) {
    console.error('[Tool:update_post] Updating post:', args.post_id);
    
    try {
      const { post_id, title, content, excerpt, status, categories, tags, featured_media } = args;
      
      // Build post data
      const postData = {
        title,
        content,
        excerpt,
        status,
        categories,
        tags,
        featured_media
      };
      
      // Filter out undefined values
      Object.keys(postData).forEach(key => {
        if (postData[key] === undefined) {
          delete postData[key];
        }
      });
      
      // Update post
      const post = await client.client.put(`/wp/v2/posts/${post_id}`, postData);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              status: 'success',
              message: 'Post updated successfully',
              post: {
                id: post.id,
                title: post.title.rendered,
                status: post.status,
                date: post.date,
                modified: post.modified,
                link: post.link
              }
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      console.error('[Tool:update_post] Error:', error);
      
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
  }
  
  async function deletePost(client, args) {
    console.error('[Tool:delete_post] Deleting post:', args.post_id);
    
    try {
      const { post_id, force } = args;
      
      // Delete post
      const post = await client.client.delete(`/wp/v2/posts/${post_id}`, { force });
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              status: 'success',
              message: force
                ? 'Post permanently deleted'
                : 'Post moved to trash',
              post: {
                id: post.id,
                title: post.title.rendered,
                status: post.status
              }
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      console.error('[Tool:delete_post] Error:', error);
      
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
  }
  
  // Register individual tool handlers for backward compatibility
  if (registerToolHandler) {
    // Register list_posts tool handler
    registerToolHandler('list_posts', async (args) => {
      console.error('[Tool:list_posts] Listing posts');
      
      try {
        // Get the site client
        const client = args.site_id
          ? siteManager.createClientForSite(args.site_id)
          : siteManager.createClientForActiveSite();
        
        const { per_page, page, search, categories, tags, status, order, orderby } = args;
        
        // Build query parameters
        const params = {
          per_page,
          page,
          search,
          categories,
          tags,
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
        
        // Get posts
        const posts = await client.client.get('/wp/v2/posts', params);
        
        // Get total posts and pages from headers
        const totalPosts = parseInt(client.client.lastResponse?.headers?.get('X-WP-Total') || '0', 10);
        const totalPages = parseInt(client.client.lastResponse?.headers?.get('X-WP-TotalPages') || '0', 10);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status: 'success',
                count: posts.length,
                total: totalPosts,
                total_pages: totalPages,
                current_page: page || 1,
                posts: posts.map(post => ({
                  id: post.id,
                  title: post.title.rendered,
                  excerpt: post.excerpt.rendered,
                  status: post.status,
                  date: post.date,
                  modified: post.modified,
                  link: post.link,
                  author: post.author,
                  featured_media: post.featured_media,
                  categories: post.categories,
                  tags: post.tags
                }))
              }, null, 2)
            }
          ]
        };
      } catch (error) {
        console.error('[Tool:list_posts] Error:', error);
        
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
    
    // Register get_post tool handler
    registerToolHandler('get_post', async (args) => {
      console.error('[Tool:get_post] Getting post:', args.post_id);
      
      try {
        // Get the site client
        const client = args.site_id
          ? siteManager.createClientForSite(args.site_id)
          : siteManager.createClientForActiveSite();
        
        const { post_id } = args;
        
        // Get post
        const post = await client.client.get(`/wp/v2/posts/${post_id}`);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status: 'success',
                post: {
                  id: post.id,
                  title: post.title.rendered,
                  content: post.content.rendered,
                  excerpt: post.excerpt.rendered,
                  status: post.status,
                  date: post.date,
                  modified: post.modified,
                  link: post.link,
                  author: post.author,
                  featured_media: post.featured_media,
                  categories: post.categories,
                  tags: post.tags
                }
              }, null, 2)
            }
          ]
        };
      } catch (error) {
        console.error('[Tool:get_post] Error:', error);
        
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
    
    // Register create_post tool handler
    registerToolHandler('create_post', async (args) => {
      console.error('[Tool:create_post] Creating post:', args.title);
      
      try {
        // Get the site client
        const client = args.site_id
          ? siteManager.createClientForSite(args.site_id)
          : siteManager.createClientForActiveSite();
        
        const { title, content, excerpt, status, categories, tags, featured_media } = args;
        
        // Build post data
        const postData = {
          title,
          content,
          excerpt,
          status,
          categories,
          tags,
          featured_media
        };
        
        // Filter out undefined values
        Object.keys(postData).forEach(key => {
          if (postData[key] === undefined) {
            delete postData[key];
          }
        });
        
        // Create post
        const post = await client.client.post('/wp/v2/posts', postData);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status: 'success',
                message: `Post '${title}' created successfully`,
                post: {
                  id: post.id,
                  title: post.title.rendered,
                  status: post.status,
                  date: post.date,
                  link: post.link
                }
              }, null, 2)
            }
          ]
        };
      } catch (error) {
        console.error('[Tool:create_post] Error:', error);
        
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
    
    // Register update_post tool handler
    registerToolHandler('update_post', async (args) => {
      console.error('[Tool:update_post] Updating post:', args.post_id);
      
      try {
        // Get the site client
        const client = args.site_id
          ? siteManager.createClientForSite(args.site_id)
          : siteManager.createClientForActiveSite();
        
        const { post_id, title, content, excerpt, status, categories, tags, featured_media } = args;
        
        // Build post data
        const postData = {
          title,
          content,
          excerpt,
          status,
          categories,
          tags,
          featured_media
        };
        
        // Filter out undefined values
        Object.keys(postData).forEach(key => {
          if (postData[key] === undefined) {
            delete postData[key];
          }
        });
        
        // Update post
        const post = await client.client.put(`/wp/v2/posts/${post_id}`, postData);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status: 'success',
                message: 'Post updated successfully',
                post: {
                  id: post.id,
                  title: post.title.rendered,
                  status: post.status,
                  date: post.date,
                  modified: post.modified,
                  link: post.link
                }
              }, null, 2)
            }
          ]
        };
      } catch (error) {
        console.error('[Tool:update_post] Error:', error);
        
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
    
    // Register delete_post tool handler
    registerToolHandler('delete_post', async (args) => {
      console.error('[Tool:delete_post] Deleting post:', args.post_id);
      
      try {
        // Get the site client
        const client = args.site_id
          ? siteManager.createClientForSite(args.site_id)
          : siteManager.createClientForActiveSite();
        
        const { post_id, force } = args;
        
        // Delete post
        const post = await client.client.delete(`/wp/v2/posts/${post_id}`, { force });
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status: 'success',
                message: force
                  ? 'Post permanently deleted'
                  : 'Post moved to trash',
                post: {
                  id: post.id,
                  title: post.title.rendered,
                  status: post.status
                }
              }, null, 2)
            }
          ]
        };
      } catch (error) {
        console.error('[Tool:delete_post] Error:', error);
        
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

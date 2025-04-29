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
export function registerWooProductTools(server, options) {
  console.error('[Tools] Registering post management tools');
  
  const { siteManager, registerToolHandler } = options;
  
  // Define the tools
  const tools = [
    {
      name: 'list_products',
      description: 'List products from a woocommerce site',
      inputSchema: {
        type: 'object',
        properties: {
          site_id: {
            type: 'string',
            description: 'Site ID (defaults to active site if not provided)'
          },
          per_page: {
            type: 'integer',
            description: 'Number of products to fetch per page',
            default: 10
          },
          page: {
            type: 'integer',
            description: 'Page number',
            default: 1
          },
          search: {
            type: 'string',
            description: 'Search term for products'
          },
          category: {
            type: 'integer',
            description: 'Category ID to filter products'
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
            enum: ['date', 'title', 'price', 'popularity'],
            default: 'date'
          }
        }
      }
    },
    {
      name: 'create_product',
      description: 'Create a new product in WooCommerce',
      inputSchema: {
        type: 'object',
        properties: {
          site_id: {
            type: 'string',
            description: 'Site ID (defaults to active site if not provided)'
          },
          name: {
            type: 'string',
            description: 'Product name'
          },
          type: {
            type: 'string',
            description: 'Product type (e.g., simple, variable)',
            default: 'simple'
          },
          regular_price: {
            type: 'string',
            description: 'Regular price of the product'
          },
          description: {
            type: 'string',
            description: 'Full description of the product'
          },
          short_description: {
            type: 'string',
            description: 'Short description of the product'
          },
          categories: {
            type: 'array',
            description: 'Array of category IDs',
            items: {
              type: 'integer'
            }
          },
          images: {
            type: 'array',
            description: 'Array of image URLs',
            items: {
              type: 'string'
            }
          }
        },
        required: ['name', 'regular_price']
      }
    },
    {
      name: 'update_product',
      description: 'Update an existing product in WooCommerce',
      inputSchema: {
        type: 'object',
        properties: {
          site_id: {
            type: 'string',
            description: 'Site ID (defaults to active site if not provided)'
          },
          id: {
            type: 'integer',
            description: 'Product ID to update'
          },
          name: {
            type: 'string',
            description: 'Product name'
          },
          type: {
            type: 'string',
            description: 'Product type (e.g., simple, variable)'
          },
          regular_price: {
            type: 'string',
            description: 'Regular price of the product'
          },
          cost: {
            type: 'string',
            description: 'Cost price of the product'
          },
          description: {
            type: 'string',
            description: 'Full description of the product'
          },
          short_description: {
            type: 'string',
            description: 'Short description of the product'
          },
          categories: {
            type: 'array',
            description: 'Array of category IDs',
            items: {
              type: 'integer'
            }
          },
          images: {
            type: 'array',
            description: 'Array of image URLs',
            items: {
              type: 'string'
            }
          }
        },
        required: ['id']
      }
    },
    {
      name: 'delete_product',
      description: 'Delete a product in WooCommerce',
      inputSchema: {
        type: 'object',
        properties: {
          site_id: {
            type: 'string',
            description: 'Site ID (defaults to active site if not provided)'
          },
          id: {
            type: 'integer',
            description: 'Product ID to delete'
          }
        },
        required: ['id']
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
      if (name === 'list_products') {
        return await listProducts(client, args);
      } else if (name === 'create_product') {
        return await createProduct(client, args);
      } else if (name === 'update_product') {
        return await updateProduct(client, args);
      } else if (name === 'delete_product') {
        return await deleteProduct(client, args);
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
  async function listProducts(client, args) {
    console.error('[Tool:list_posts] Listing posts');
    
    try {

      const wc_client = args.site_id ? siteManager.createClientForWoocommerce(args.site_id) : false;

      const { per_page, page, search, category, order, orderby } = args;
      
      // Build query parameters
      const params = {
        per_page,
        page,
        search,
        category,
        order,
        orderby
      };
      
      // Filter out undefined values
      Object.keys(params).forEach(key => {
        if (params[key] === undefined) {
          delete params[key];
        }
      });

      console.error('Entered products fetch', params);

      // Fetch products
      const response = await wc_client.get('products', params);

      console.error('Entered res fetch', response);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              status: 'success',
              count: response.data.length,
              products: response.data
            }, null, 2)
          }
        ]
      };

    } catch (error) {
      console.error('[WooCommerce:fetch_products] Error:', error);
      
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
  
  async function createProduct(client, args) {
    console.error('[Tool:create_post] Creating post:', args.title);
    
    try {

      const wc_client = args.site_id ? siteManager.createClientForWoocommerce(args.site_id) : false;

      const { name, type, regular_price, description, short_description, categories, images } = args;

      
      // Build product data
      const productData = {
        name,
        type,
        regular_price,
        description,
        short_description,
        categories,
        images
      };

      // Filter out undefined values
      Object.keys(productData).forEach(key => {
        if (productData[key] === undefined) {
          delete productData[key];
        }
      });
      
      // Create product
      const response = await wc_client.post('products', productData);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              status: 'success',
              message: `Product '${name}' created successfully`,
              product: response.data
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      console.error('[WooCommerce:create_product] Error:', error);
      
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

  // Add the updateProduct function
  async function updateProduct(client, args) {
    console.error('[Tool:update_product] Updating product:', args.id);

    try {

      const wc_client = args.site_id ? siteManager.createClientForWoocommerce(args.site_id) : false;

      const { id, name, type, regular_price, description, short_description, categories, images } = args;

      // Build product data
      const productData = {
        name,
        type,
        regular_price,
        description,
        short_description,
        categories,
        images
      };

      // Filter out undefined values
      Object.keys(productData).forEach(key => {
        if (productData[key] === undefined) {
          delete productData[key];
        }
      });

      // Update product
      const response = await wc_client.put(`products/${id}`, productData);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              status: 'success',
              message: `Product '${id}' updated successfully`,
              product: response.data
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      console.error('[WooCommerce:update_product] Error:', error);

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

  // Add the deleteProduct function
  async function deleteProduct(client, args) {
    console.error('[Tool:delete_product] Deleting product:', args.id);

    try {

      const wc_client = args.site_id ? siteManager.createClientForWoocommerce(args.site_id) : false;

      const { id } = args;

      // Delete product
      const response = await wc_client.delete(`products/${id}`, {
        force: true // Force delete to bypass trash
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              status: 'success',
              message: `Product '${id}' deleted successfully`,
              product: response.data
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      console.error('[WooCommerce:delete_product] Error:', error);

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

    // Register fetch_products tool handler
    registerToolHandler('list_products', async (args) => {
      console.error('[WooCommerce:list_products] Fetching products with args:', args);

      try {

        const client = args.site_id ? siteManager.createClientForWoocommerce(args.site_id) : false;

        const { per_page, page, search, category, order, orderby } = args;

        // Build query parameters
        const params = {
          per_page,
          page,
          search,
          category,
          order,
          orderby
        };

        // Filter out undefined values
        Object.keys(params).forEach(key => {
          if (params[key] === undefined) {
            delete params[key];
          }
        });

        // Fetch products
        const response = await client.get('products', params);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status: 'success',
                count: response.data.length,
                products: response.data
              }, null, 2)
            }
          ]
        };
      } catch (error) {
        console.error('[WooCommerce:fetch_products] Error:', error);

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

    // Register create_product tool handler
    registerToolHandler('create_product', async (args) => {
      console.error('[WooCommerce:create_product] Creating product with args:', args);

      try {

        const client = args.site_id ? siteManager.createClientForWoocommerce(args.site_id) : false;

        const { name, type, regular_price, description, short_description, categories, images } = args;

        // Build product data
        const productData = {
          name,
          type,
          regular_price,
          description,
          short_description,
          categories,
          images
        };

        // Filter out undefined values
        Object.keys(productData).forEach(key => {
          if (productData[key] === undefined) {
            delete productData[key];
          }
        });

        // Create product
        const response = await client.post('products', productData);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status: 'success',
                message: `Product '${name}' created successfully`,
                product: response.data
              }, null, 2)
            }
          ]
        };
      } catch (error) {
        console.error('[WooCommerce:create_product] Error:', error);

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

    // Register update_product tool handler
    registerToolHandler('update_product', async (args) => {
      console.error('[WooCommerce:update_product] Updating product with args:', args);

      try {

        const client = args.site_id ? siteManager.createClientForWoocommerce(args.site_id) : false;

        const { id, name, type, regular_price, cost, description, short_description, categories, images } = args;

        // Build product data
        const productData = {
          name,
          type,
          regular_price,
          cost,
          description,
          short_description,
          categories,
          images
        };

        // Filter out undefined values
        Object.keys(productData).forEach(key => {
          if (productData[key] === undefined) {
            delete productData[key];
          }
        });

        // Update product
        const response = await client.put(`products/${id}`, productData);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status: 'success',
                message: `Product '${id}' updated successfully`,
                product: response.data
              }, null, 2)
            }
          ]
        };
      } catch (error) {
        console.error('[WooCommerce:update_product] Error:', error);

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

    // Register delete_product tool handler
    registerToolHandler('delete_product', async (args) => {
      console.error('[WooCommerce:delete_product] Deleting product with args:', args);

      try {

        const client = args.site_id ? siteManager.createClientForWoocommerce(args.site_id) : false;

        const { id } = args;

        // Delete product
        const response = await client.delete(`products/${id}`, {
          force: true // Force delete to bypass trash
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status: 'success',
                message: `Product '${id}' deleted successfully`,
                product: response.data
              }, null, 2)
            }
          ]
        };
      } catch (error) {
        console.error('[WooCommerce:delete_product] Error:', error);

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

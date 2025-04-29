/**
 * Post Management Tools for WordPress MCP Server
 * 
 * This module provides MCP tools for managing WordPress posts.
 * It includes tools for creating, retrieving, updating, and deleting posts.
 */
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import pkg from '@woocommerce/woocommerce-rest-api';
const WooCommerceRestApi = pkg.default;

const wooCommerceApi = new WooCommerceRestApi({
  url: "https://betadev.canambullion.com", // Base URL of your WooCommerce store
  consumerKey: "ck_5aa2e29fb924d0be9c1fad2d31db2fb507830086", // API consumer key
  consumerSecret: "cs_d20b375ffef0de2b777e3cb0b238be50050163f9", // API consumer secret
  version: 'wc/v2' // WooCommerce API version
});
/**
 * Register post management tools with the MCP server
 * 
 * @param {Server} server - The MCP server instance
 * @param {Object} options - Tool options
 * @param {SiteManager} options.siteManager - The site manager instance
 * @param {Function} options.registerToolHandler - Function to register a tool handler
 */
export function registerWooOrderTools(server, options) {
  console.error('[Tools] Registering order management tools');
  
  const { siteManager, registerToolHandler } = options;

  // Define the tools
  const tools = [
    {
      name: 'list_orders',
      description: 'List orders from a WooCommerce site',
      inputSchema: {
        type: 'object',
        properties: {
          site_id: {
            type: 'string',
            description: 'Site ID (defaults to active site if not provided)'
          },
          per_page: {
            type: 'integer',
            description: 'Number of orders to fetch per page',
            default: 10
          },
          page: {
            type: 'integer',
            description: 'Page number',
            default: 1
          },
          search: {
            type: 'string',
            description: 'Search term for orders'
          },
          status: {
            type: 'string',
            description: 'Order status (e.g., pending, processing, completed)',
            enum: ['pending', 'processing', 'on-hold', 'completed', 'cancelled', 'refunded', 'failed', 'trash']
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
            enum: ['date', 'id', 'total'],
            default: 'date'
          }
        }
      }
    },
    {
      name: 'create_order',
      description: 'Create a new order in WooCommerce',
      inputSchema: {
        type: 'object',
        properties: {
          site_id: {
            type: 'string',
            description: 'Site ID (defaults to active site if not provided)'
          },
          customer_id: {
            type: 'integer',
            description: 'Customer ID for the order'
          },
          line_items: {
            type: 'array',
            description: 'Array of line items for the order',
            items: {
              type: 'object',
              properties: {
                product_id: { type: 'integer' },
                quantity: { type: 'integer' }
              },
              required: ['product_id', 'quantity']
            }
          },
          status: {
            type: 'string',
            description: 'Order status (e.g., pending, processing, completed)',
            default: 'pending'
          },
          total: {
            type: 'string',
            description: 'Total amount for the order'
          }
        },
        required: ['line_items']
      }
    },
    {
      name: 'update_order',
      description: 'Update an existing order in WooCommerce',
      inputSchema: {
        type: 'object',
        properties: {
          site_id: {
            type: 'string',
            description: 'Site ID (defaults to active site if not provided)'
          },
          id: {
            type: 'integer',
            description: 'Order ID to update'
          },
          status: {
            type: 'string',
            description: 'Order status (e.g., pending, processing, completed)'
          },
          total: {
            type: 'string',
            description: 'Total amount for the order'
          },
          line_items: {
            type: 'array',
            description: 'Array of line items for the order',
            items: {
              type: 'object',
              properties: {
                product_id: { type: 'integer' },
                quantity: { type: 'integer' }
              }
            }
          }
        },
        required: ['id']
      }
    },
    {
      name: 'delete_order',
      description: 'Delete an order in WooCommerce',
      inputSchema: {
        type: 'object',
        properties: {
          site_id: {
            type: 'string',
            description: 'Site ID (defaults to active site if not provided)'
          },
          id: {
            type: 'integer',
            description: 'Order ID to delete'
          }
        },
        required: ['id']
      }
    }
  ];

  // Register tool definitions with the server
  if (typeof server.registerToolDefinitions === 'function') {
    server.registerToolDefinitions(tools);
  }
  else {
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
      if (name === 'list_orders') {
        return await listOrders(client, args);
      } else if (name === 'create_order') {
        return await createOrder(client, args);
      } else if (name === 'update_order') {
        return await updateOrder(client, args);
      } else if (name === 'delete_order') {
        return await deleteOrder(client, args);
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

  // List Orders
  async function listOrders(client, args) {
    console.error('[Tool:list_orders] Listing orders');

    try {

      const wc_client = args.site_id ? siteManager.createClientForWoocommerce(args.site_id) : false;

      const { per_page, page, search, status, order, orderby } = args;

      // Build query parameters
      const params = {
        per_page,
        page,
        search,
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

      // Fetch orders
      const response = await wc_client.get('orders', params);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              status: 'success',
              count: response.data.length,
              orders: response.data
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      console.error('[WooCommerce:list_orders] Error:', error);

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

  // Create Order
  async function createOrder(client, args) {
    console.error('[Tool:create_order] Creating order:', args);

    try {

      const wc_client = args.site_id ? siteManager.createClientForWoocommerce(args.site_id) : false;

      const { customer_id, line_items, status, total } = args;

      // Build order data
      const orderData = {
        customer_id,
        line_items,
        status,
        total
      };

      // Filter out undefined values
      Object.keys(orderData).forEach(key => {
        if (orderData[key] === undefined) {
          delete orderData[key];
        }
      });

      // Create order
      const response = await wooCommerceApi.post('orders', orderData);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              status: 'success',
              message: `Order created successfully`,
              order: response.data
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      console.error('[WooCommerce:create_order] Error:', error);

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

  // Update Order
  async function updateOrder(client, args) {
    console.error('[Tool:update_order] Updating order:', args.id);

    try {

      const wc_client = args.site_id ? siteManager.createClientForWoocommerce(args.site_id) : false;

      const { id, status, total, line_items } = args;

      // Build order data
      const orderData = {
        status,
        total,
        line_items
      };

      // Filter out undefined values
      Object.keys(orderData).forEach(key => {
        if (orderData[key] === undefined) {
          delete orderData[key];
        }
      });

      // Update order
      const response = await wc_client.put(`orders/${id}`, orderData);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              status: 'success',
              message: `Order '${id}' updated successfully`,
              order: response.data
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      console.error('[WooCommerce:update_order] Error:', error);

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

  // Delete Order
  async function deleteOrder(client, args) {
    console.error('[Tool:delete_order] Deleting order:', args.id);

    try {

      const wc_client = args.site_id ? siteManager.createClientForWoocommerce(args.site_id) : false;

      const { id } = args;

      // Delete order
      const response = await wc_client.delete(`orders/${id}`, {
        force: true // Force delete to bypass trash
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              status: 'success',
              message: `Order '${id}' deleted successfully`,
              order: response.data
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      console.error('[WooCommerce:delete_order] Error:', error);

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
    // Register list_orders tool handler
    registerToolHandler('list_orders', async (args) => {
      console.error('[WooCommerce:list_orders] Fetching orders with args:', args);

      try {

        const client = args.site_id ? siteManager.createClientForWoocommerce(args.site_id) : false;

        const { per_page, page, search, status, order, orderby } = args;

        // Build query parameters
        const params = {
          per_page,
          page,
          search,
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

        // Fetch orders
        const response = await client.get('orders', params);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status: 'success',
                count: response.data.length,
                orders: response.data
              }, null, 2)
            }
          ]
        };
      } catch (error) {
        console.error('[WooCommerce:list_orders] Error:', error);

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

    // Register create_order tool handler
    registerToolHandler('create_order', async (args) => {
      console.error('[WooCommerce:create_order] Creating order with args:', args);

      try {

        const client = args.site_id ? siteManager.createClientForWoocommerce(args.site_id) : false;

        const { customer_id, line_items, status, total } = args;

        // Build order data
        const orderData = {
          customer_id,
          line_items,
          status,
          total
        };

        // Filter out undefined values
        Object.keys(orderData).forEach(key => {
          if (orderData[key] === undefined) {
            delete orderData[key];
          }
        });

        // Create order
        const response = await client.post('orders', orderData);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status: 'success',
                message: `Order created successfully`,
                order: response.data
              }, null, 2)
            }
          ]
        };
      } catch (error) {
        console.error('[WooCommerce:create_order] Error:', error);

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

    // Register update_order tool handler
    registerToolHandler('update_order', async (args) => {
      console.error('[WooCommerce:update_order] Updating order with args:', args);

      try {
        const client = args.site_id ? siteManager.createClientForWoocommerce(args.site_id) : false;
        const { id, status, total, line_items } = args;

        // Build order data
        const orderData = {
          status,
          total,
          line_items
        };

        // Filter out undefined values
        Object.keys(orderData).forEach(key => {
          if (orderData[key] === undefined) {
            delete orderData[key];
          }
        });

        // Update order
        const response = await client.put(`orders/${id}`, orderData);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status: 'success',
                message: `Order '${id}' updated successfully`,
                order: response.data
              }, null, 2)
            }
          ]
        };
      } catch (error) {
        console.error('[WooCommerce:update_order] Error:', error);

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

    // Register delete_order tool handler
    registerToolHandler('delete_order', async (args) => {
      console.error('[WooCommerce:delete_order] Deleting order with args:', args);

      try {

        const client = args.site_id ? siteManager.createClientForWoocommerce(args.site_id) : false;

        const { id } = args;

        // Delete order
        const response = await client.delete(`orders/${id}`, {
          force: true // Force delete to bypass trash
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status: 'success',
                message: `Order '${id}' deleted successfully`,
                order: response.data
              }, null, 2)
            }
          ]
        };
      } catch (error) {
        console.error('[WooCommerce:delete_order] Error:', error);

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
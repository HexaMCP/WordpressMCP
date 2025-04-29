/**
 * Customer Management Tools for WordPress MCP Server
 * 
 * This module provides MCP tools for managing WooCommerce customers.
 * It includes tools for creating, retrieving, updating, and deleting customers.
 */
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

/**
 * Register customer management tools with the MCP server
 * 
 * @param {Server} server - The MCP server instance
 * @param {Object} options - Tool options
 * @param {SiteManager} options.siteManager - The site manager instance
 * @param {Function} options.registerToolHandler - Function to register a tool handler
 */
export function registerWooCustomerTools(server, options) {
  console.error('[Tools] Registering customer management tools');
  
  const { siteManager, registerToolHandler } = options;
  
  // Define the tools
  const tools = [
    {
      name: 'list_customers',
      description: 'List customers from a WooCommerce site',
      inputSchema: {
        type: 'object',
        properties: {
          site_id: {
            type: 'string',
            description: 'Site ID (defaults to active site if not provided)'
          },
          per_page: {
            type: 'integer',
            description: 'Number of customers to fetch per page',
            default: 10
          },
          page: {
            type: 'integer',
            description: 'Page number',
            default: 1
          },
          search: {
            type: 'string',
            description: 'Search term for customers'
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
            enum: ['id', 'email', 'date'],
            default: 'id'
          }
        }
      }
    },
    {
      name: 'create_customer',
      description: 'Create a new customer in WooCommerce',
      inputSchema: {
        type: 'object',
        properties: {
          site_id: {
            type: 'string',
            description: 'Site ID (defaults to active site if not provided)'
          },
          email: {
            type: 'string',
            description: 'Customer email'
          },
          first_name: {
            type: 'string',
            description: 'Customer first name'
          },
          last_name: {
            type: 'string',
            description: 'Customer last name'
          },
          username: {
            type: 'string',
            description: 'Customer username'
          },
          password: {
            type: 'string',
            description: 'Customer password'
          },
          billing: {
            type: 'object',
            description: 'Billing address',
            properties: {
              first_name: { type: 'string' },
              last_name: { type: 'string' },
              address_1: { type: 'string' },
              city: { type: 'string' },
              postcode: { type: 'string' },
              country: { type: 'string' }
            }
          },
          shipping: {
            type: 'object',
            description: 'Shipping address',
            properties: {
              first_name: { type: 'string' },
              last_name: { type: 'string' },
              address_1: { type: 'string' },
              city: { type: 'string' },
              postcode: { type: 'string' },
              country: { type: 'string' }
            }
          }
        },
        required: ['email', 'first_name', 'last_name']
      }
    },
    {
      name: 'update_customer',
      description: 'Update an existing customer in WooCommerce',
      inputSchema: {
        type: 'object',
        properties: {
          site_id: {
            type: 'string',
            description: 'Site ID (defaults to active site if not provided)'
          },
          id: {
            type: 'integer',
            description: 'Customer ID to update'
          },
          email: {
            type: 'string',
            description: 'Customer email'
          },
          first_name: {
            type: 'string',
            description: 'Customer first name'
          },
          last_name: {
            type: 'string',
            description: 'Customer last name'
          },
          billing: {
            type: 'object',
            description: 'Billing address',
            properties: {
              first_name: { type: 'string' },
              last_name: { type: 'string' },
              address_1: { type: 'string' },
              city: { type: 'string' },
              postcode: { type: 'string' },
              country: { type: 'string' }
            }
          },
          shipping: {
            type: 'object',
            description: 'Shipping address',
            properties: {
              first_name: { type: 'string' },
              last_name: { type: 'string' },
              address_1: { type: 'string' },
              city: { type: 'string' },
              postcode: { type: 'string' },
              country: { type: 'string' }
            }
          }
        },
        required: ['id']
      }
    },
    {
      name: 'delete_customer',
      description: 'Delete a customer in WooCommerce',
      inputSchema: {
        type: 'object',
        properties: {
          site_id: {
            type: 'string',
            description: 'Site ID (defaults to active site if not provided)'
          },
          id: {
            type: 'integer',
            description: 'Customer ID to delete'
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
      if (name === 'list_customers') {
        return await listCustomers(client, args);
      } else if (name === 'create_customer') {
        return await createCustomer(client, args);
      } else if (name === 'update_customer') {
        return await updateCustomer(client, args);
      } else if (name === 'delete_customer') {
        return await deleteCustomer(client, args);
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


  // List Customers
  async function listCustomers(client, args) {
    console.error('[Tool:list_customers] Listing customers');

    try {

      const wc_client = args.site_id ? siteManager.createClientForWoocommerce(args.site_id) : false;

      const { per_page, page, search, order, orderby } = args;

      // Build query parameters
      const params = {
        per_page,
        page,
        search,
        order,
        orderby
      };

      // Filter out undefined values
      Object.keys(params).forEach(key => {
        if (params[key] === undefined) {
          delete params[key];
        }
      });

      // Fetch customers
      const response = await wc_client.get('customers', params);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              status: 'success',
              count: response.data.length,
              customers: response.data
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      console.error('[WooCommerce:list_customers] Error:', error);

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

  // Create Customer
  async function createCustomer(client, args) {
    console.error('[Tool:create_customer] Creating customer:', args);

    try {

      const wc_client = args.site_id ? siteManager.createClientForWoocommerce(args.site_id) : false;

      const { email, first_name, last_name, username, password, billing, shipping } = args;

      // Build customer data
      const customerData = {
        email,
        first_name,
        last_name,
        username,
        password,
        billing,
        shipping
      };

      // Filter out undefined values
      Object.keys(customerData).forEach(key => {
        if (customerData[key] === undefined) {
          delete customerData[key];
        }
      });

      // Create customer
      const response = await wc_client.post('customers', customerData);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              status: 'success',
              message: `Customer created successfully`,
              customer: response.data
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      console.error('[WooCommerce:create_customer] Error:', error);

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

  // Update Customer
  async function updateCustomer(client, args) {
    console.error('[Tool:update_customer] Updating customer:', args.id);

    try {

      const wc_client = args.site_id ? siteManager.createClientForWoocommerce(args.site_id) : false;

      const { id, email, first_name, last_name, billing, shipping } = args;

      // Build customer data
      const customerData = {
        email,
        first_name,
        last_name,
        billing,
        shipping
      };

      // Filter out undefined values
      Object.keys(customerData).forEach(key => {
        if (customerData[key] === undefined) {
          delete customerData[key];
        }
      });

      // Update customer
      const response = await wc_client.put(`customers/${id}`, customerData);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              status: 'success',
              message: `Customer '${id}' updated successfully`,
              customer: response.data
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      console.error('[WooCommerce:update_customer] Error:', error);

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

  // Delete Customer
  async function deleteCustomer(client, args) {
    console.error('[Tool:delete_customer] Deleting customer:', args.id);

    try {

      const wc_client = args.site_id ? siteManager.createClientForWoocommerce(args.site_id) : false;

      const { id } = args;

      // Delete customer
      const response = await wc_client.delete(`customers/${id}`, {
        force: true // Force delete to bypass trash
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              status: 'success',
              message: `Customer '${id}' deleted successfully`,
              customer: response.data
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      console.error('[WooCommerce:delete_customer] Error:', error);

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
    // Register list_customers tool handler
    registerToolHandler('list_customers', async (args) => {
      console.error('[WooCommerce:list_customers] Fetching customers with args:', args);

      try {

        const client = args.site_id ? siteManager.createClientForWoocommerce(args.site_id) : false;

        const { per_page, page, search, order, orderby } = args;

        // Build query parameters
        const params = {
          per_page,
          page,
          search,
          order,
          orderby
        };

        // Filter out undefined values
        Object.keys(params).forEach(key => {
          if (params[key] === undefined) {
            delete params[key];
          }
        });

        // Fetch customers
        const response = await client.get('customers', params);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status: 'success',
                count: response.data.length,
                customers: response.data
              }, null, 2)
            }
          ]
        };
      } catch (error) {
        console.error('[WooCommerce:list_customers] Error:', error);

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

    // Register create_customer tool handler
    registerToolHandler('create_customer', async (args) => {
      console.error('[WooCommerce:create_customer] Creating customer with args:', args);

      try {

        const client = args.site_id ? siteManager.createClientForWoocommerce(args.site_id) : false;

        const { email, first_name, last_name, username, password, billing, shipping } = args;

        // Build customer data
        const customerData = {
          email,
          first_name,
          last_name,
          username,
          password,
          billing,
          shipping
        };

        // Filter out undefined values
        Object.keys(customerData).forEach(key => {
          if (customerData[key] === undefined) {
            delete customerData[key];
          }
        });

        // Create customer
        const response = await client.post('customers', customerData);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status: 'success',
                message: `Customer created successfully`,
                customer: response.data
              }, null, 2)
            }
          ]
        };
      } catch (error) {
        console.error('[WooCommerce:create_customer] Error:', error);

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

    // Register update_customer tool handler
    registerToolHandler('update_customer', async (args) => {
      console.error('[WooCommerce:update_customer] Updating customer with args:', args);

      try {

        const client = args.site_id ? siteManager.createClientForWoocommerce(args.site_id) : false;

        const { id, email, first_name, last_name, billing, shipping } = args;

        // Build customer data
        const customerData = {
          email,
          first_name,
          last_name,
          billing,
          shipping
        };

        // Filter out undefined values
        Object.keys(customerData).forEach(key => {
          if (customerData[key] === undefined) {
            delete customerData[key];
          }
        });

        // Update customer
        const response = await client.put(`customers/${id}`, customerData);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status: 'success',
                message: `Customer '${id}' updated successfully`,
                customer: response.data
              }, null, 2)
            }
          ]
        };
      } catch (error) {
        console.error('[WooCommerce:update_customer] Error:', error);

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

    // Register delete_customer tool handler
    registerToolHandler('delete_customer', async (args) => {
      console.error('[WooCommerce:delete_customer] Deleting customer with args:', args);

      try {

        const client = args.site_id ? siteManager.createClientForWoocommerce(args.site_id) : false;

        const { id } = args;

        // Delete customer
        const response = await client.delete(`customers/${id}`, {
          force: true // Force delete to bypass trash
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status: 'success',
                message: `Customer '${id}' deleted successfully`,
                customer: response.data
              }, null, 2)
            }
          ]
        };
      } catch (error) {
        console.error('[WooCommerce:delete_customer] Error:', error);

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
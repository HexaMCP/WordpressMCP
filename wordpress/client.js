/**
 * WordPress REST API Client
 * 
 * This module provides a base client for making requests to the WordPress REST API.
 * It handles authentication, error handling, and provides methods for common HTTP operations.
 * 
 * @see https://developer.wordpress.org/rest-api/
 */
import { createAuthHeaders } from './auth.js';

/**
 * WordPress REST API Client
 */
export class WordPressClient {
  /**
   * Create a new WordPress REST API client
   * 
   * @param {Object} options - Client options
   * @param {string} options.url - WordPress site URL
   * @param {string} options.username - WordPress username
   * @param {string} options.applicationPassword - WordPress application password
   * @param {Object} options.defaultHeaders - Default headers to include in all requests
   * @param {number} options.timeout - Request timeout in milliseconds (default: 30000)
   */
  constructor(options) {
    this.url = options.url;
    this.username = options.username;
    this.applicationPassword = options.applicationPassword;
    this.defaultHeaders = options.defaultHeaders || {};
    this.timeout = options.timeout || 30000;
    
    // Validate required options
    if (!this.url) {
      throw new Error('[Client] Missing required option: url');
    }
    
    // Normalize URL (remove trailing slash)
    this.url = this.url.replace(/\/$/, '');
    
    // Set up authentication headers if credentials are provided
    if (this.username && this.applicationPassword) {
      this.authHeaders = createAuthHeaders({
        username: this.username,
        applicationPassword: this.applicationPassword
      });
    }
    
    console.error(`[Client] Initialized WordPress client for ${this.url}`);
  }
  
  /**
   * Create headers for a request
   * 
   * @param {Object} additionalHeaders - Additional headers to include
   * @returns {Object} Headers object
   */
  createHeaders(additionalHeaders = {}) {
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...this.defaultHeaders,
      ...(this.authHeaders || {}),
      ...additionalHeaders
    };
  }
  
  /**
   * Create a URL for a WordPress REST API endpoint
   * 
   * @param {string} endpoint - API endpoint (e.g., '/wp/v2/posts')
   * @param {Object} params - Query parameters
   * @returns {string} Full URL
   */
  createUrl(endpoint, params = {}) {
    // Ensure endpoint starts with a slash
    if (!endpoint.startsWith('/')) {
      endpoint = `/${endpoint}`;
    }
    
    // Create URL
    const url = new URL(`${this.url}/wp-json${endpoint}`);
    
    // Add query parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          // Handle array parameters
          value.forEach(item => url.searchParams.append(key, item));
        } else {
          url.searchParams.append(key, value);
        }
      }
    });
    
    return url.toString();
  }
  
  /**
   * Make a request to the WordPress REST API
   * 
   * @param {Object} options - Request options
   * @param {string} options.method - HTTP method
   * @param {string} options.endpoint - API endpoint
   * @param {Object} options.params - Query parameters
   * @param {Object} options.data - Request body data
   * @param {Object} options.headers - Additional headers
   * @returns {Promise<Object>} Response data
   * @throws {Error} If the request fails
   */
  async request(options) {
    const { method = 'GET', endpoint, params, data, headers } = options;
    
    // Create URL
    const url = this.createUrl(endpoint, params);
    
    // Create headers
    const requestHeaders = this.createHeaders(headers);
    
    // Create request options
    const requestOptions = {
      method,
      headers: requestHeaders,
      signal: AbortSignal.timeout(this.timeout)
    };
    
    // Add body if data is provided
    if (data && ['POST', 'PUT', 'PATCH'].includes(method)) {
      requestOptions.body = JSON.stringify(data);
    }
    
    try {
      console.error(`[Client] ${method} ${url}`);
      
      // Make request
      const response = await fetch(url, requestOptions);
      
      // Handle response
      if (!response.ok) {
        // Try to parse error response
        const errorData = await response.json().catch(() => ({}));
        
        throw new Error(
          `[Client] ${method} ${url} failed: ${response.status} ${response.statusText}` +
          (errorData.message ? ` - ${errorData.message}` : '')
        );
      }
      
      // Parse response
      const responseData = await response.json();
      
      return responseData;
    } catch (error) {
      console.error(`[Client] Request failed:`, error);
      throw error;
    }
  }
  
  /**
   * Make a GET request to the WordPress REST API
   * 
   * @param {string} endpoint - API endpoint
   * @param {Object} params - Query parameters
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Response data
   */
  async get(endpoint, params = {}, options = {}) {
    return this.request({
      method: 'GET',
      endpoint,
      params,
      ...options
    });
  }
  
  /**
   * Make a POST request to the WordPress REST API
   * 
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body data
   * @param {Object} params - Query parameters
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Response data
   */
  async post(endpoint, data = {}, params = {}, options = {}) {
    return this.request({
      method: 'POST',
      endpoint,
      data,
      params,
      ...options
    });
  }
  
  /**
   * Make a PUT request to the WordPress REST API
   * 
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body data
   * @param {Object} params - Query parameters
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Response data
   */
  async put(endpoint, data = {}, params = {}, options = {}) {
    return this.request({
      method: 'PUT',
      endpoint,
      data,
      params,
      ...options
    });
  }
  
  /**
   * Make a PATCH request to the WordPress REST API
   * 
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body data
   * @param {Object} params - Query parameters
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Response data
   */
  async patch(endpoint, data = {}, params = {}, options = {}) {
    return this.request({
      method: 'PATCH',
      endpoint,
      data,
      params,
      ...options
    });
  }
  
  /**
   * Make a DELETE request to the WordPress REST API
   * 
   * @param {string} endpoint - API endpoint
   * @param {Object} params - Query parameters
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Response data
   */
  async delete(endpoint, params = {}, options = {}) {
    return this.request({
      method: 'DELETE',
      endpoint,
      params,
      ...options
    });
  }
}

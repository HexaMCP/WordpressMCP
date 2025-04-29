/**
 * WordPress API Client
 * 
 * This module provides a client for interacting with the WordPress REST API.
 * It includes methods for common WordPress operations like managing posts, pages, users, etc.
 * 
 * @see https://developer.wordpress.org/rest-api/
 */
import { WordPressClient } from './client.js';
import { validateCredentials } from './auth.js';

/**
 * WordPress API Client
 */
export class WordPress {
  /**
   * Create a new WordPress API client
   * 
   * @param {Object} options - Client options
   * @param {string} options.url - WordPress site URL
   * @param {string} options.username - WordPress username
   * @param {string} options.applicationPassword - WordPress application password
   * @param {Object} options.defaultHeaders - Default headers to include in all requests
   * @param {number} options.timeout - Request timeout in milliseconds (default: 30000)
   */
  constructor(options) {
    this.options = options;
    this.client = new WordPressClient(options);
    
    // Initialize endpoint handlers
    this._initializeEndpoints();
  }
  
  /**
   * Initialize endpoint handlers
   * 
   * @private
   */
  _initializeEndpoints() {
    // These will be initialized as needed when we implement specific endpoints
    this.posts = {};
    this.pages = {};
    this.media = {};
    this.users = {};
    this.categories = {};
    this.tags = {};
    this.comments = {};
    this.settings = {};
  }
  
  /**
   * Validate the WordPress credentials
   * 
   * @returns {Promise<Object>} User data if credentials are valid
   * @throws {Error} If credentials are invalid
   */
  async validateCredentials() {
    return validateCredentials({
      url: this.options.url,
      username: this.options.username,
      applicationPassword: this.options.applicationPassword
    });
  }
  
  /**
   * Get information about the WordPress site
   * 
   * @returns {Promise<Object>} Site information
   */
  async getSiteInfo() {
    try {
      const response = await this.client.get('/');
      
      return {
        name: response.name,
        description: response.description,
        url: response.url,
        home: response.home,
        gmt_offset: response.gmt_offset,
        timezone_string: response.timezone_string,
        namespaces: response.namespaces,
        authentication: response.authentication,
        routes: Object.keys(response.routes || {})
      };
    } catch (error) {
      console.error('[WordPress] Error getting site info:', error);
      throw new Error(`[WordPress] Failed to get site info: ${error.message}`);
    }
  }
  
  /**
   * Check if the WordPress site is reachable
   * 
   * @returns {Promise<boolean>} True if the site is reachable
   */
  async ping() {
    try {
      await this.client.get('/');
      return true;
    } catch (error) {
      console.error('[WordPress] Error pinging site:', error);
      return false;
    }
  }
  
  /**
   * Get the WordPress REST API schema
   * 
   * @returns {Promise<Object>} API schema
   */
  async getSchema() {
    try {
      return await this.client.get('/wp/v2');
    } catch (error) {
      console.error('[WordPress] Error getting schema:', error);
      throw new Error(`[WordPress] Failed to get schema: ${error.message}`);
    }
  }
}

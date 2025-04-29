/**
 * WordPress Authentication Module
 * 
 * This module handles authentication with WordPress sites using Application Passwords.
 * 
 * WordPress Application Passwords allow for secure authentication with the WordPress REST API
 * without requiring the user's main password. They can be created in the WordPress admin
 * under Users > Profile > Application Passwords.
 * 
 * @see https://make.wordpress.org/core/2020/11/05/application-passwords-integration-guide/
 */

/**
 * Create authentication headers for WordPress REST API requests
 * 
 * @param {Object} credentials - Authentication credentials
 * @param {string} credentials.username - WordPress username
 * @param {string} credentials.applicationPassword - WordPress application password
 * @returns {Object} Headers object with Authorization header
 */
export function createAuthHeaders(credentials) {
  if (!credentials || !credentials.username || !credentials.applicationPassword) {
    throw new Error('[Auth] Missing required credentials');
  }
  
  // Create Basic Auth token
  const token = Buffer.from(`${credentials.username}:${credentials.applicationPassword}`).toString('base64');
  
  return {
    'Authorization': `Basic ${token}`
  };
}

/**
 * Validate WordPress credentials by making a test request
 * 
 * @param {Object} options - Validation options
 * @param {string} options.url - WordPress site URL
 * @param {string} options.username - WordPress username
 * @param {string} options.applicationPassword - WordPress application password
 * @returns {Promise<Object>} User data if credentials are valid
 * @throws {Error} If credentials are invalid
 */
export async function validateCredentials(options) {
  const { url, username, applicationPassword } = options;
  
  if (!url || !username || !applicationPassword) {
    throw new Error('[Auth] Missing required credentials');
  }
  
  try {
    // Create headers with authentication
    const headers = createAuthHeaders({ username, applicationPassword });
    
    // Make a request to the WordPress REST API
    const response = await fetch(`${url}/wp-json/wp/v2/users/me`, {
      method: 'GET',
      headers
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`[Auth] Invalid credentials: ${error.message || response.statusText}`);
    }
    
    // Parse the response
    const userData = await response.json();
    
    return {
      id: userData.id,
      name: userData.name,
      roles: userData.roles,
      capabilities: userData.capabilities
    };
  } catch (error) {
    console.error('[Auth] Error validating credentials: ' + error);
    throw new Error(`[Auth] Failed to validate credentials: ${error.message}`);
  }
}

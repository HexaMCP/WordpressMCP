/**
 * Site Management Module
 * 
 * This module provides functionality for managing WordPress sites.
 * It includes methods for adding, updating, retrieving, and removing sites,
 * as well as validating site credentials and testing connectivity.
 */
import { SiteStorage } from './storage.js';
import { WordPress } from '../wordpress/index.js';
import { validateCredentials } from '../wordpress/auth.js';

/**
 * Site Manager
 */
export class SiteManager {
  /**
   * Create a new site manager
   * 
   * @param {Object} options - Manager options
   * @param {string} options.configPath - Path to the configuration file
   */
  constructor(options) {
    this.storage = new SiteStorage({ configPath: options.configPath });
  }
  
  /**
   * Get all sites
   * 
   * @returns {Array<Object>} Array of site configurations
   */
  getAllSites() {
    return this.storage.getAllSites();
  }
  
  /**
   * Get a site by ID
   * 
   * @param {string} id - Site ID
   * @returns {Object|null} Site configuration or null if not found
   */
  getSiteById(id) {
    return this.storage.getSiteById(id);
  }
  
  /**
   * Get a site by name
   * 
   * @param {string} name - Site name
   * @returns {Object|null} Site configuration or null if not found
   */
  getSiteByName(name) {
    return this.storage.getSiteByName(name);
  }
  
  /**
   * Get a site by URL
   * 
   * @param {string} url - Site URL
   * @returns {Object|null} Site configuration or null if not found
   */
  getSiteByUrl(url) {
    return this.storage.getSiteByUrl(url);
  }
  
  /**
   * Add a new site
   * 
   * @param {Object} site - Site configuration
   * @param {string} site.name - Site name
   * @param {string} site.url - Site URL
   * @param {string} site.username - WordPress username
   * @param {string} site.applicationPassword - WordPress application password
   * @param {boolean} site.validate - Whether to validate the site credentials (default: true)
   * @returns {Promise<Object>} Added site configuration
   * @throws {Error} If a site with the same name or URL already exists
   * @throws {Error} If the site credentials are invalid
   */
  async addSite(site) {
    // Validate the site credentials if requested
    if (site.validate !== false && site.username && site.applicationPassword) {
      try {
        await validateCredentials({
          url: site.url,
          username: site.username,
          applicationPassword: site.applicationPassword
        });
      } catch (error) {
        throw new Error(`[SiteManager] Failed to validate site credentials: ${error.message}`);
      }
    }
    
    // Add the site
    return this.storage.addSite(site);
  }
  
  /**
   * Update a site
   * 
   * @param {string} id - Site ID
   * @param {Object} updates - Site updates
   * @param {boolean} updates.validate - Whether to validate the site credentials (default: true)
   * @returns {Promise<Object>} Updated site configuration
   * @throws {Error} If the site is not found
   * @throws {Error} If the site credentials are invalid
   */
  async updateSite(id, updates) {
    // Get the current site
    const currentSite = this.storage.getSiteById(id);
    
    if (!currentSite) {
      throw new Error(`[SiteManager] Site not found: ${id}`);
    }
    
    // Validate the site credentials if requested
    if (updates.validate !== false) {
      const username = updates.username || currentSite.username;
      const applicationPassword = updates.applicationPassword || currentSite.applicationPassword;
      const url = updates.url || currentSite.url;
      
      if (username && applicationPassword) {
        try {
          await validateCredentials({
            url,
            username,
            applicationPassword
          });
        } catch (error) {
          throw new Error(`[SiteManager] Failed to validate site credentials: ${error.message}`);
        }
      }
    }
    
    // Remove the validate flag from the updates
    const { validate, ...siteUpdates } = updates;
    
    // Update the site
    return this.storage.updateSite(id, siteUpdates);
  }
  
  /**
   * Remove a site
   * 
   * @param {string} id - Site ID
   * @returns {boolean} True if the site was removed, false otherwise
   */
  removeSite(id) {
    return this.storage.removeSite(id);
  }
  
  /**
   * Set the active site
   * 
   * @param {string} id - Site ID
   * @returns {Object} Active site configuration
   * @throws {Error} If the site is not found
   */
  setActiveSite(id) {
    return this.storage.setActiveSite(id);
  }
  
  /**
   * Get the active site
   * 
   * @returns {Object|null} Active site configuration or null if no active site
   */
  getActiveSite() {
    return this.storage.getActiveSite();
  }
  
  /**
   * Create a WordPress client for a site
   * 
   * @param {string} id - Site ID
   * @returns {WordPress} WordPress client
   * @throws {Error} If the site is not found
   */
  createClientForSite(id) {
    const site = this.storage.getSiteById(id);
    
    if (!site) {
      throw new Error(`[SiteManager] Site not found: ${id}`);
    }
    
    return new WordPress({
      url: site.url,
      username: site.username,
      applicationPassword: site.applicationPassword
    });
  }
  
  /**
   * Create a WordPress client for the active site
   * 
   * @returns {WordPress} WordPress client
   * @throws {Error} If no active site is set
   */
  createClientForActiveSite() {
    const activeSite = this.storage.getActiveSite();
    
    if (!activeSite) {
      throw new Error('[SiteManager] No active site set');
    }
    
    return this.createClientForSite(activeSite.id);
  }
  
  /**
   * Test connectivity to a site
   * 
   * @param {string} id - Site ID
   * @returns {Promise<boolean>} True if the site is reachable
   * @throws {Error} If the site is not found
   */
  async testSiteConnectivity(id) {
    const client = this.createClientForSite(id);
    return client.ping();
  }
  
  /**
   * Get information about a site
   * 
   * @param {string} id - Site ID
   * @returns {Promise<Object>} Site information
   * @throws {Error} If the site is not found
   */
  async getSiteInfo(id) {
    const client = this.createClientForSite(id);
    return client.getSiteInfo();
  }
}

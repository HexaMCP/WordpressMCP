/**
 * Site Storage Module
 * 
 * This module handles the storage and retrieval of WordPress site configurations.
 * It provides methods for adding, updating, retrieving, and removing site configurations.
 */
import fs from 'fs-extra';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

/**
 * Site Storage Manager
 */
export class SiteStorage {
  /**
   * Create a new site storage manager
   * 
   * @param {Object} options - Storage options
   * @param {string} options.configPath - Path to the configuration file
   */
  constructor(options) {
    this.configPath = options.configPath;
    this.config = this.loadConfig();
    
    // Initialize sites array if it doesn't exist
    if (!this.config.sites) {
      this.config.sites = [];
    }
    
    console.error(`[SiteStorage] Initialized with ${this.config.sites.length} sites`);
  }
  
  /**
   * Load the configuration from the file
   * 
   * @returns {Object} Configuration object
   */
  loadConfig() {
    try {
      if (fs.existsSync(this.configPath)) {
        const configData = fs.readFileSync(this.configPath, 'utf8');
        return JSON.parse(configData);
      }
    } catch (error) {
      console.error('[SiteStorage] Error loading configuration:', error);
    }
    
    // Return default configuration
    return {
      server: {
        transport: 'stdio',
        http: {
          port: 3000,
          authToken: 'default-token'
        }
      },
      sites: []
    };
  }
  
  /**
   * Save the configuration to the file
   */
  saveConfig() {
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2), 'utf8');
      console.error('[SiteStorage] Configuration saved');
    } catch (error) {
      console.error('[SiteStorage] Error saving configuration:', error);
      throw new Error(`[SiteStorage] Failed to save configuration: ${error.message}`);
    }
  }
  
  /**
   * Get all sites
   * 
   * @returns {Array<Object>} Array of site configurations
   */
  getAllSites() {
    return this.config.sites;
  }
  
  /**
   * Get a site by ID
   * 
   * @param {string} id - Site ID
   * @returns {Object|null} Site configuration or null if not found
   */
  getSiteById(id) {
    return this.config.sites.find(site => site.id === id) || null;
  }
  
  /**
   * Get a site by name
   * 
   * @param {string} name - Site name
   * @returns {Object|null} Site configuration or null if not found
   */
  getSiteByName(name) {
    return this.config.sites.find(site => site.name === name) || null;
  }
  
  /**
   * Get a site by URL
   * 
   * @param {string} url - Site URL
   * @returns {Object|null} Site configuration or null if not found
   */
  getSiteByUrl(url) {
    // Normalize URL for comparison
    const normalizedUrl = url.replace(/\/$/, '');
    
    return this.config.sites.find(site => {
      const siteUrl = site.url.replace(/\/$/, '');
      return siteUrl === normalizedUrl;
    }) || null;
  }
  
  /**
   * Add a new site
   * 
   * @param {Object} site - Site configuration
   * @param {string} site.name - Site name
   * @param {string} site.url - Site URL
   * @param {string} site.username - WordPress username
   * @param {string} site.applicationPassword - WordPress application password
   * @returns {Object} Added site configuration
   * @throws {Error} If a site with the same name or URL already exists
   */
  addSite(site) {
    // Validate required fields
    if (!site.name) {
      throw new Error('[SiteStorage] Missing required field: name');
    }
    if (!site.url) {
      throw new Error('[SiteStorage] Missing required field: url');
    }
    
    // Check if a site with the same name already exists
    if (this.getSiteByName(site.name)) {
      throw new Error(`[SiteStorage] A site with the name "${site.name}" already exists`);
    }
    
    // Check if a site with the same URL already exists
    if (this.getSiteByUrl(site.url)) {
      throw new Error(`[SiteStorage] A site with the URL "${site.url}" already exists`);
    }
    
    // Generate a unique ID for the site
    const id = site.id || uuidv4();
    
    // Create the site object
    const newSite = {
      id,
      name: site.name,
      url: site.url,
      username: site.username,
      applicationPassword: site.applicationPassword,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Add the site to the configuration
    this.config.sites.push(newSite);
    
    // Save the configuration
    this.saveConfig();
    
    console.error(`[SiteStorage] Added site: ${newSite.name} (${newSite.id})`);
    
    return newSite;
  }
  
  /**
   * Update a site
   * 
   * @param {string} id - Site ID
   * @param {Object} updates - Site updates
   * @returns {Object} Updated site configuration
   * @throws {Error} If the site is not found
   */
  updateSite(id, updates) {
    // Find the site
    const siteIndex = this.config.sites.findIndex(site => site.id === id);
    
    if (siteIndex === -1) {
      throw new Error(`[SiteStorage] Site not found: ${id}`);
    }
    
    // Get the current site
    const currentSite = this.config.sites[siteIndex];
    
    // Check if the name is being updated and if it already exists
    if (updates.name && updates.name !== currentSite.name && this.getSiteByName(updates.name)) {
      throw new Error(`[SiteStorage] A site with the name "${updates.name}" already exists`);
    }
    
    // Check if the URL is being updated and if it already exists
    if (updates.url && updates.url !== currentSite.url && this.getSiteByUrl(updates.url)) {
      throw new Error(`[SiteStorage] A site with the URL "${updates.url}" already exists`);
    }
    
    // Update the site
    const updatedSite = {
      ...currentSite,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    // Replace the site in the configuration
    this.config.sites[siteIndex] = updatedSite;
    
    // Save the configuration
    this.saveConfig();
    
    console.error(`[SiteStorage] Updated site: ${updatedSite.name} (${updatedSite.id})`);
    
    return updatedSite;
  }
  
  /**
   * Remove a site
   * 
   * @param {string} id - Site ID
   * @returns {boolean} True if the site was removed, false otherwise
   */
  removeSite(id) {
    // Find the site
    const siteIndex = this.config.sites.findIndex(site => site.id === id);
    
    if (siteIndex === -1) {
      return false;
    }
    
    // Get the site name for logging
    const siteName = this.config.sites[siteIndex].name;
    
    // Remove the site from the configuration
    this.config.sites.splice(siteIndex, 1);
    
    // Save the configuration
    this.saveConfig();
    
    console.error(`[SiteStorage] Removed site: ${siteName} (${id})`);
    
    return true;
  }
  
  /**
   * Set the active site
   * 
   * @param {string} id - Site ID
   * @returns {Object} Active site configuration
   * @throws {Error} If the site is not found
   */
  setActiveSite(id) {
    // Find the site
    const site = this.getSiteById(id);
    
    if (!site) {
      throw new Error(`[SiteStorage] Site not found: ${id}`);
    }
    
    // Set the active site
    this.config.activeSiteId = id;
    
    // Save the configuration
    this.saveConfig();
    
    console.error(`[SiteStorage] Set active site: ${site.name} (${site.id})`);
    
    return site;
  }
  
  /**
   * Get the active site
   * 
   * @returns {Object|null} Active site configuration or null if no active site
   */
  getActiveSite() {
    if (!this.config.activeSiteId) {
      return null;
    }
    
    return this.getSiteById(this.config.activeSiteId);
  }
}

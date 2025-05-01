# WordPress MCP Server v1.0.0

A Model Context Protocol (MCP) server for interacting with WordPress sites via the REST API. This server provides a comprehensive set of tools for managing WordPress posts, pages, woocommerce customers, woocommerce orders and woocommerce products.

## Table of Contents
- [WordPress MCP Server v1.0.0](#wordpress-mcp-server-v100)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
    - [Content Management](#content-management)
      - [Posts](#posts)
      - [Pages](#pages)
      - [Customers](#Customers)
      - [Products](#Products)
      - [Orders](#Orders)
  - [Requirements](#requirements)
    - [System Requirements](#system-requirements)
    - [WordPress Requirements](#wordpress-requirements)
  - [Installation](#installation)
  - [Configuration](#configuration)
    - [Environment Variables](#environment-variables)
  - [Usage](#usage)
    - [Starting the Server](#starting-the-server)
      - [Using Server-Sent Events (SSE)](#using-server-sent-events-sse)
    - [Adding a WordPress Site](#adding-a-wordpress-site)
    - [Tool Categories](#tool-categories)
  - [License](#license)

## Features

The WordPress MCP Server provides a comprehensive set of tools for interacting with WordPress sites:

### Content Management

#### Posts
- List posts with filtering and pagination
- Get post details
- Create new posts
- Update existing posts
- Delete posts

#### Pages
- List pages with filtering and pagination
- Get page details
- Create new pages
- Update existing pages
- Delete pages

#### Customers
- List Customers with filtering and pagination
- Get Customers details
- Create new Customers
- Update existing Customers
- Delete Customers

#### Orders
- List Orders with filtering and pagination
- Get Orders details
- Create new Orders
- Update existing Orders
- Delete Orders

#### Products
- List Products with filtering and pagination
- Get Products details
- Create new Products
- Update existing Products
- Delete Products


## Requirements

### System Requirements
- Node.js 20.x or higher
- npm 10.x or higher

### WordPress Requirements
- WordPress 5.9 or higher
- REST API enabled
- Woocommerce plugin installed
- Application Passwords feature enabled (included in WordPress 5.6+)
- Proper permissions for the user account

## Installation

1. Clone the repository:

```bash
git clone https://github.com/HexaMCP/WordpressMCP.git
cd WordpressMCP
```

2. Install dependencies:

```bash
npm install
```

## Configuration

### Configuration File

The server uses a configuration file to store site information. By default, it looks for a `config.json` file in the project root. The configuration file has the following structure:

```json
{
  "sites": [
    {
      "id": "site1",
      "name": "My WordPress Site",
      "url": "https://example.com",
      "consumerKey": "XXXX XXXX XXXX XXXX XXXX XXXX",
      "consumerSecret": "XXXX XXXX XXXX XXXX XXXX XXXX",
      "username": "admin",
      "applicationPassword": "XXXX XXXX XXXX XXXX XXXX XXXX",

    }
  ],
  "activeSite": "site1"
}
```

## Usage

### Starting the Server

#### Using stdio (default)

```bash
npm start
```

#### Using Server-Sent Events (SSE)

```bash
npm run start:sse
```

### Adding a WordPress Site

Before you can interact with a WordPress site, you need to add it to the server:

1. Create an application password in your WordPress admin:
   - Go to Users > Profile
   - Scroll down to "Application Passwords"
   - Enter a name for the application (e.g., "MCP Server")
   - Click "Add New Application Password"
   - Copy the generated password

2. Create an consumer key and consumer secret in your WordPress admin:
   - Go to Woocommerce > Settings
   - Click the advanced tab and go to REST API sub tab.
   - Enter a description for mcp and choose user
   - Then choose Read/Write permission
   - Click "Generate API key"
   - Copy the consumer key and consumer secret

3. Finally add this to config.js file.


## Security Considerations

### Authentication

The WordPress MCP Server uses WordPress Application Passwords and woocommerce api keys for authentication. Application Passwords and woocommerce api keys provide a secure way to authenticate with the WordPress. 

When adding a site to the server, you need to provide the following credentials:
- WordPress username
- Application password
- Consumer key
- Consumer Secret

These credentials are stored in the server's configuration file and are used to authenticate with the WordPress REST API.

### HTTPS

For production use, it is strongly recommended to use HTTPS for all WordPress sites. This ensures that the communication between the MCP server and the WordPress site is encrypted and secure.

When adding a site to the server, make sure to use the HTTPS URL:

```json
{
  "name": "My WordPress Site",
  "url": "https://example.com",
  "consumerKey": "XXXX XXXX XXXX XXXX XXXX XXXX",
  "consumerSecret": "XXXX XXXX XXXX XXXX XXXX XXXX",
  "username": "admin",
  "applicationPassword": "XXXX XXXX XXXX XXXX XXXX XXXX"
}
```

## License

ISC
// Configuration for API endpoints
// Set USE_LAMBDA to true when deployed, false for local development

const CONFIG = {
  // Set to true to use Lambda endpoints, false for local server
  USE_LAMBDA: true,
  
  // Lambda API Gateway URL (replace with your actual deployed URL)
  LAMBDA_BASE_URL: 'https://your-api-id.execute-api.ap-southeast-5.amazonaws.com/dev',
  
  // Local server URL
  LOCAL_BASE_URL: '',
  
  // Get the current base URL based on configuration
  getBaseUrl() {
    return this.USE_LAMBDA ? this.LAMBDA_BASE_URL : this.LOCAL_BASE_URL;
  },
  
  // API endpoint paths
  ENDPOINTS: {
    MENU: '/api/menu',
    STOCK: '/api/stock',
    ORDERS: '/api/orders',
    ACTIVE_TABLES: '/api/active-tables',
    COOKING_SEQUENCE: '/api/cooking-sequence',
    FORECAST: '/api/forecast',
    RESTOCK: '/api/stock/restock'
  },
  
  // Get full URL for an endpoint
  getUrl(endpoint) {
    return this.getBaseUrl() + endpoint;
  }
};

// Export for use in other scripts
window.CONFIG = CONFIG;

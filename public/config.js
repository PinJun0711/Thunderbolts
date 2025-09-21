// Configuration for API endpoints
// Automatically detects if running locally or on server

const CONFIG = {
  // Auto-detect environment
  USE_LAMBDA: false,
  
  // Lambda API Gateway URL (replace with your actual deployed URL)
  LAMBDA_BASE_URL: 'https://your-api-id.execute-api.ap-southeast-5.amazonaws.com/dev',
  
  // Auto-detect base URL based on current location
  getBaseUrl() {
    if (this.USE_LAMBDA) {
      return this.LAMBDA_BASE_URL;
    }
    
    // If running on same server (EC2), use relative URLs
    // If running locally, use localhost
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    if (isLocalhost) {
      return 'http://localhost:3000';
    } else {
      // On EC2 or any other server, use relative URLs (same origin)
      return '';
    }
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

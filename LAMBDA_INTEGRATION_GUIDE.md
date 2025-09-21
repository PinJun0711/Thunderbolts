# 🚀 Lambda Integration Guide for Cooking Efficiency Dashboard

## Overview
Your cooking efficiency dashboard is now configured to work with AWS Lambda functions! The backend logic you already have in your Lambda handlers will be used instead of the local server.

## 🔧 What's Been Updated

### 1. Serverless Configuration
- ✅ Added cooking efficiency endpoints to `serverless.yml` and `serverless-complete.yml`
- ✅ Configured API Gateway routes for `/api/cooking-sequence` (GET and POST)

### 2. Frontend Configuration
- ✅ Created `public/config.js` for easy endpoint switching
- ✅ Updated `cooking-dashboard.html` to use Lambda endpoints
- ✅ Updated `stock-dashboard.html` to use Lambda endpoints

### 3. Deployment Scripts
- ✅ Created `deploy-lambda-cooking.ps1` (PowerShell) for Windows
- ✅ Created `deploy-lambda-cooking.sh` (Bash) for Linux/Mac

## 🚀 How to Deploy

### Step 1: Deploy Lambda Functions
```powershell
# On Windows
.\deploy-lambda-cooking.ps1

# On Linux/Mac
./deploy-lambda-cooking.sh
```

### Step 2: Update Configuration
The deployment script will automatically update `public/config.js` with your API Gateway URL. Make sure:
```javascript
const CONFIG = {
  USE_LAMBDA: true,  // Set to true for Lambda endpoints
  LAMBDA_BASE_URL: 'https://your-actual-api-gateway-url', // Auto-updated by script
  // ...
}
```

### Step 3: Upload Frontend
Upload your `public/` folder to:
- Your web server
- S3 bucket with static website hosting
- CloudFront distribution
- Any static hosting service

## 🔗 API Endpoints

Your Lambda functions will be available at:
- `GET /api/cooking-sequence` - Get optimized cooking sequence
- `POST /api/cooking-sequence` - Update item cooking status
- `GET /api/menu` - Get menu items
- `GET /api/stock` - Get stock data
- `GET /api/orders` - Get all orders
- `GET /api/active-tables` - Get active table summary

## 🧪 Testing the Integration

### 1. Test Lambda Functions Directly
```bash
# Test cooking sequence endpoint
curl https://your-api-gateway-url/api/cooking-sequence

# Test status update
curl -X POST https://your-api-gateway-url/api/cooking-sequence \
  -H "Content-Type: application/json" \
  -d '{"orderId":"123","itemId":"m1","status":"preparing"}'
```

### 2. Test Frontend
1. Open your cooking dashboard: `https://your-api-gateway-url/cooking-dashboard.html`
2. Check browser console for any errors
3. Try updating an item status
4. Verify the sequence updates correctly

## 🔄 Switching Between Local and Lambda

### For Development (Local Server)
```javascript
// In public/config.js
const CONFIG = {
  USE_LAMBDA: false,  // Use local server
  LOCAL_BASE_URL: '', // Empty for same domain
  // ...
}
```

### For Production (Lambda)
```javascript
// In public/config.js
const CONFIG = {
  USE_LAMBDA: true,   // Use Lambda endpoints
  LAMBDA_BASE_URL: 'https://your-api-gateway-url',
  // ...
}
```

## 🐛 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Make sure your serverless.yml has `cors: true` for all endpoints
   - Check that your API Gateway has CORS enabled

2. **404 Errors**
   - Verify your Lambda functions are deployed correctly
   - Check the API Gateway URL in config.js

3. **500 Errors**
   - Check CloudWatch logs for your Lambda functions
   - Verify MongoDB connection string in environment variables

### Debug Mode
Add this to your frontend to see API calls:
```javascript
// Add to any dashboard script
console.log('Using API URL:', CONFIG.getUrl(CONFIG.ENDPOINTS.COOKING_SEQUENCE));
```

## 📊 Monitoring

### CloudWatch Logs
Monitor your Lambda functions in AWS CloudWatch:
- `/aws/lambda/thunderbolts-orders-prod-getCookingSequence`
- `/aws/lambda/thunderbolts-orders-prod-updateCookingStatus`

### API Gateway Metrics
Monitor API Gateway metrics in AWS Console:
- Request count
- Latency
- Error rates

## 🎯 Next Steps

1. **Deploy**: Run the deployment script
2. **Test**: Verify all endpoints work correctly
3. **Monitor**: Set up CloudWatch alarms for errors
4. **Scale**: Configure auto-scaling for Lambda functions if needed

## 🆘 Support

If you encounter issues:
1. Check CloudWatch logs for Lambda errors
2. Verify your MongoDB connection
3. Test API endpoints directly with curl/Postman
4. Check browser console for frontend errors

Your cooking efficiency dashboard is now ready to scale with AWS Lambda! 🍳✨

#!/bin/bash

# Deploy Thunderbolts Lambda Functions with Cooking Efficiency
# This script deploys your Lambda functions and provides the API Gateway URL

echo "🚀 Deploying Thunderbolts Lambda Functions..."

# Check if serverless is installed
if ! command -v serverless &> /dev/null; then
    echo "❌ Serverless Framework not found. Installing..."
    npm install -g serverless
fi

# Deploy to AWS
echo "📦 Deploying to AWS..."
serverless deploy --stage prod

# Get the API Gateway URL
echo "🔗 Getting API Gateway URL..."
API_URL=$(serverless info --stage prod | grep "endpoints:" -A 10 | grep "https://" | head -1 | sed 's/.*https/https/')

if [ -z "$API_URL" ]; then
    echo "❌ Could not get API Gateway URL. Please check your deployment."
    exit 1
fi

echo "✅ Deployment successful!"
echo "🌐 API Gateway URL: $API_URL"

# Update the config.js file with the actual API URL
echo "⚙️  Updating frontend configuration..."
sed -i.bak "s|https://your-api-id.execute-api.ap-southeast-5.amazonaws.com/dev|$API_URL|g" public/config.js

echo "📝 Configuration updated in public/config.js"
echo ""
echo "🎯 Next steps:"
echo "1. Upload your public/ folder to your web server or S3 bucket"
echo "2. Make sure config.js has USE_LAMBDA: true"
echo "3. Your cooking dashboard will now use Lambda endpoints!"
echo ""
echo "🔗 Cooking Dashboard URL: $API_URL/cooking-dashboard.html"
echo "🔗 POS System URL: $API_URL/index.html"
echo "🔗 Stock Dashboard URL: $API_URL/stock-dashboard.html"

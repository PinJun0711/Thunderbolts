# Thunderbolts Orders - AWS Lambda Deployment Script

Write-Host "🚀 Starting AWS Lambda deployment..." -ForegroundColor Green

# Check if Serverless is installed
try {
    serverless --version | Out-Null
    Write-Host "✅ Serverless Framework is available" -ForegroundColor Green
} catch {
    Write-Host "❌ Serverless Framework not found. Installing..." -ForegroundColor Yellow
    npm install -g serverless
}

# Check if AWS CLI is configured
try {
    aws sts get-caller-identity | Out-Null
    Write-Host "✅ AWS CLI is configured" -ForegroundColor Green
} catch {
    Write-Host "❌ AWS CLI not configured. Please run 'aws configure' first." -ForegroundColor Red
    exit 1
}

# Set environment variable
$env:MONGODB_URI = "mongodb+srv://pinjun040711:Dxda6769@cluster0.pq1ueqp.mongodb.net/thunderbolts_orders?retryWrites=true&w=majority"

Write-Host "🔧 Deploying to AWS Lambda..." -ForegroundColor Yellow
serverless deploy --stage prod

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Deployment successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎯 Your API endpoints are now live!" -ForegroundColor Cyan
    Write-Host "📊 Check the output above for your API Gateway URL" -ForegroundColor White
    Write-Host ""
    Write-Host "Available endpoints:" -ForegroundColor Yellow
    Write-Host "- GET  /api/health" -ForegroundColor White
    Write-Host "- GET  /api/menu" -ForegroundColor White
    Write-Host "- GET  /api/stock" -ForegroundColor White
    Write-Host "- POST /api/orders" -ForegroundColor White
    Write-Host "- GET  /api/orders" -ForegroundColor White
    Write-Host "- GET  /api/active-tables" -ForegroundColor White
    Write-Host "- POST /api/orders/{id}/complete" -ForegroundColor White
    Write-Host "- POST /api/sagemaker/train" -ForegroundColor White
    Write-Host "- GET  /api/sagemaker/predict" -ForegroundColor White
} else {
    Write-Host "❌ Deployment failed" -ForegroundColor Red
    exit 1
}
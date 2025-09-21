# Deploy Thunderbolts Lambda Functions with Cooking Efficiency
# This script deploys your Lambda functions and provides the API Gateway URL

Write-Host "🚀 Deploying Thunderbolts Lambda Functions..." -ForegroundColor Green

# Check if serverless is installed
try {
    $null = Get-Command serverless -ErrorAction Stop
    Write-Host "✅ Serverless Framework found" -ForegroundColor Green
} catch {
    Write-Host "❌ Serverless Framework not found. Please install it first:" -ForegroundColor Red
    Write-Host "npm install -g serverless" -ForegroundColor Yellow
    exit 1
}

# Deploy to AWS
Write-Host "📦 Deploying to AWS..." -ForegroundColor Blue
serverless deploy --stage prod

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    exit 1
}

# Get the API Gateway URL
Write-Host "🔗 Getting API Gateway URL..." -ForegroundColor Blue
$output = serverless info --stage prod
$apiUrl = ($output | Select-String "https://.*execute-api.*amazonaws\.com").Matches[0].Value

if (-not $apiUrl) {
    Write-Host "❌ Could not get API Gateway URL. Please check your deployment." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Deployment successful!" -ForegroundColor Green
Write-Host "🌐 API Gateway URL: $apiUrl" -ForegroundColor Cyan

# Update the config.js file with the actual API URL
Write-Host "⚙️  Updating frontend configuration..." -ForegroundColor Blue
$configContent = Get-Content "public/config.js" -Raw
$newConfigContent = $configContent -replace "https://your-api-id\.execute-api\.ap-southeast-5\.amazonaws\.com/dev", $apiUrl
Set-Content "public/config.js" -Value $newConfigContent

Write-Host "📝 Configuration updated in public/config.js" -ForegroundColor Green
Write-Host ""
Write-Host "🎯 Next steps:" -ForegroundColor Yellow
Write-Host "1. Upload your public/ folder to your web server or S3 bucket" -ForegroundColor White
Write-Host "2. Make sure config.js has USE_LAMBDA: true" -ForegroundColor White
Write-Host "3. Your cooking dashboard will now use Lambda endpoints!" -ForegroundColor White
Write-Host ""
Write-Host "🔗 Cooking Dashboard URL: $apiUrl/cooking-dashboard.html" -ForegroundColor Cyan
Write-Host "🔗 POS System URL: $apiUrl/index.html" -ForegroundColor Cyan
Write-Host "🔗 Stock Dashboard URL: $apiUrl/stock-dashboard.html" -ForegroundColor Cyan
